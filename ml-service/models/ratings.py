import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from data.loader import load_player_stats, load_match_data, load_all_players

MIN_MATCHES_FOR_RATINGS = 14

def calculate_derived_ratings():
    """
    Calculate objective player ratings from match data.
    
    Returns a DataFrame with derived ratings for each player:
    - goal_threat: based on goals per game relative to squad average
    - reliability: based on attendance rate
    - ability: composite of points percentage and goal contribution,
               weighted by sample size confidence
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

    # --- Goal Threat Rating ---
    # Total goals scored with minimum matches threshold
    # Players below threshold get 0 (scales to 1 after MinMaxScaler)
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

    # --- Ability Rating ---
    # Weighted by sample size confidence - players with fewer than MIN_MATCHES
    # get proportionally lower scores to avoid small sample size bias
    career_stats['ability_raw'] = career_stats.apply(
        lambda row: (
            (row['points_percentage'] / 100 * 0.7 +
            min(row['goals_per_game'], 1.0) * 0.3)
            if row['total_matches'] >= MIN_MATCHES_FOR_RATINGS
            else 0.0  # hard floor for insufficient data
        ),
        axis=1
    )

    # Scale all ratings to 1-10
    scaler = MinMaxScaler(feature_range=(1, 10))

    for col, raw_col in [
        ('goal_threat', 'goal_threat_raw'),
        ('reliability', 'reliability_raw'),
        ('ability', 'ability_raw'),
    ]:
        values = career_stats[[raw_col]].values
        career_stats[col] = scaler.fit_transform(values).round(1)

    result = career_stats.merge(
        all_players[['id', 'name', 'position', 'active']],
        left_on='player_id',
        right_on='id',
        how='left'
    )

    return result[[
        'player_id', 'name', 'position', 'active',
        'total_matches', 'total_wins', 'total_draws', 'total_losses',
        'total_goals', 'points_percentage', 'goals_per_game',
        'goal_threat', 'reliability', 'ability'
    ]]