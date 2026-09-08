import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from data.loader import load_player_stats, load_match_data, load_all_players

def calculate_derived_ratings():
    """
    Calculate objective player ratings from match data.
    
    Returns a DataFrame with derived ratings for each player:
    - goal_threat: based on goals per game relative to squad average
    - reliability: based on attendance rate
    - ability: composite of points percentage and goal contribution
    """
    player_stats = load_player_stats()
    match_data = load_match_data()
    all_players = load_all_players()

    # Calculate total matches in the dataset
    total_matches = match_data['match_id'].nunique()

    # Aggregate stats across all seasons per player
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
    # Normalise goals per game relative to squad average
    squad_avg_gpg = career_stats['goals_per_game'].mean()
    squad_std_gpg = career_stats['goals_per_game'].std()

    if squad_std_gpg > 0:
        career_stats['goal_threat_raw'] = (
            (career_stats['goals_per_game'] - squad_avg_gpg) / squad_std_gpg
        )
    else:
        career_stats['goal_threat_raw'] = 0

    # --- Reliability Rating ---
    # Matches attended / total matches available
    career_stats['reliability_raw'] = (
        career_stats['total_matches'] / total_matches
    ).clip(0, 1)

    # --- Ability Rating ---
    # Composite of points percentage and goal contribution
    career_stats['ability_raw'] = (
        career_stats['points_percentage'] / 100 * 0.7 +
        career_stats['goals_per_game'].clip(0, 1) * 0.3
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

    # Merge with player names
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