import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from data.loader import load_player_stats, load_match_data, load_all_players

MIN_MATCHES_FOR_RATINGS = 10

DEFENSIVE_POSITIONS = ['GK', 'CB', 'LB', 'RB']
MIDFIELD_POSITIONS = ['CDM', 'CM']
ATTACKING_POSITIONS = ['CAM', 'LW', 'RW', 'ST']

def update_ratings():
    log.info("Starting ratings recalculation...")
    
    df = calculate_derived_ratings()
    log.info(f"Calculated ratings for {len(df)} players")

    engine = create_engine(DB_URL)

    with engine.begin() as conn:
        # Clear all existing ratings first
        conn.execute(text("DELETE FROM player_ratings"))
        log.info("Cleared existing ratings")

        # Insert fresh ML ratings for all players with match data
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO player_ratings (player_id, ability, reliability, goal_threat, rated_by, rated_at)
                VALUES (:pid, :ability, :reliability, :goal_threat, 'ML Model', NOW())
            """), {
                "pid": int(row['player_id']),
                "ability": round(row['ability']),
                "reliability": round(row['reliability']),
                "goal_threat": round(row['goal_threat'])
            })

    log.info(f"Inserted ML ratings for {len(df)} players")
    log.info("Ratings update complete")
    return len(df)

    
def get_ability_raw(row):
    """Calculate ability based on position group."""
    if row['total_matches'] < MIN_MATCHES_FOR_RATINGS:
        return 0.0
    
    pt_pct = row['points_percentage'] / 100
    gpg = min(row['goals_per_game'], 1.0)
    position = row['position'] if pd.notna(row['position']) else 'UNKNOWN'
    
    if position in DEFENSIVE_POSITIONS:
        return pt_pct
    elif position in MIDFIELD_POSITIONS:
        return pt_pct * 0.85 + gpg * 0.15
    elif position in ATTACKING_POSITIONS:
        return pt_pct * 0.60 + gpg * 0.40
    else:
        return pt_pct * 0.75 + gpg * 0.25

def calculate_derived_ratings():
    """
    Calculate objective player ratings from match data.
    Position-adjusted ability rating:
    - Defenders/GK: pure pt%
    - Midfielders: 85% pt%, 15% goals
    - Attackers: 60% pt%, 40% goals
    """
    player_stats = load_player_stats()
    match_data = load_match_data()
    all_players = load_all_players()

    total_matches = match_data['match_id'].nunique()

    career_stats = player_stats.groupby('player_id').agg(
        total_matches=('matches_played', 'sum'),
        total_wins=('wins', 'sum'),
        total_draws=('draws', 'sum'),
        total_losses=('losses', 'sum'),
        total_goals=('goals', 'sum'),
    ).reset_index()

    career_stats['points_percentage'] = (
        (career_stats['total_wins'] * 3 + career_stats['total_draws']) /
        (career_stats['total_matches'] * 3) * 100
    ).fillna(0)

    career_stats['goals_per_game'] = (
        career_stats['total_goals'] / career_stats['total_matches']
    ).fillna(0)

    # Merge position data before ability calculation
    career_stats = career_stats.merge(
        all_players[['id', 'name', 'position', 'active']],
        left_on='player_id',
        right_on='id',
        how='left'
    )

    # --- Goal Threat Rating ---
    career_stats['goal_threat_raw'] = career_stats.apply(
        lambda row: row['total_goals']
        if row['total_matches'] >= MIN_MATCHES_FOR_RATINGS
        else 0.0,
        axis=1
    )

    # --- Reliability Rating ---
    career_stats['reliability_raw'] = (
        career_stats['total_matches'] / total_matches
    ).clip(0, 1)

    # --- Ability Rating (position adjusted) ---
    career_stats['ability_raw'] = career_stats.apply(get_ability_raw, axis=1)

    # Scale all ratings to 1-10
    scaler = MinMaxScaler(feature_range=(1, 10))

    for col, raw_col in [
        ('goal_threat', 'goal_threat_raw'),
        ('reliability', 'reliability_raw'),
        ('ability', 'ability_raw'),
    ]:
        values = career_stats[[raw_col]].values
        career_stats[col] = scaler.fit_transform(values).round(1)

    return career_stats[[
        'player_id', 'name', 'position', 'active',
        'total_matches', 'total_wins', 'total_draws', 'total_losses',
        'total_goals', 'points_percentage', 'goals_per_game',
        'goal_threat', 'reliability', 'ability'
    ]]