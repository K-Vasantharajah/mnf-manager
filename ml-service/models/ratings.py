"""
Player ratings derived from adjusted plus-minus impact coefficients.

Attack and defence ratings come from ridge regression over team compositions,
which controls for teammate quality. Reliability remains attendance-based.

Players below MIN_APPEARANCES receive no rating — a null is honest about
missing data in a way that a floor value of 1 is not.
"""

import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from data.loader import load_player_stats, load_match_data, load_all_players
from models.impact import fit_impact_model

MIN_APPEARANCES = 10


def calculate_derived_ratings():
    """
    Returns one row per rateable player with attack, defence, overall
    and reliability ratings on a 1-10 scale.
    """
    impact = fit_impact_model()
    match_data = load_match_data()
    player_stats = load_player_stats()

    total_matches = match_data['match_id'].nunique()

    rateable = impact[impact['appearances'] >= MIN_APPEARANCES].copy()

    # Scale attack and defence on a shared range so an 8 for attack means
    # the same magnitude of contribution as an 8 for defence.
    shared = pd.concat([rateable['attack_impact'], rateable['defence_impact']])
    scaler = MinMaxScaler(feature_range=(1, 10))
    scaler.fit(shared.values.reshape(-1, 1))

    rateable['attack_rating'] = scaler.transform(
        rateable[['attack_impact']].values
    ).round(0).astype(int)

    rateable['defence_rating'] = scaler.transform(
        rateable[['defence_impact']].values
    ).round(0).astype(int)

    rateable['overall_rating'] = (
        (rateable['attack_rating'] + rateable['defence_rating']) / 2
    ).round(0).astype(int)

    # Reliability stays attendance-based and is scaled independently,
    # since it measures availability rather than on-pitch contribution.
    appearances_all = player_stats.groupby('player_id')['matches_played'].sum()
    rateable['attendance_rate'] = rateable['player_id'].map(
        appearances_all / total_matches
    ).fillna(0).clip(0, 1)

    reliability_scaler = MinMaxScaler(feature_range=(1, 10))
    rateable['reliability_rating'] = reliability_scaler.fit_transform(
        rateable[['attendance_rate']].values
    ).round(0).astype(int)

    return rateable[[
        'player_id', 'name', 'position', 'active', 'appearances',
        'attack_impact', 'defence_impact',
        'attack_rating', 'defence_rating', 'overall_rating',
        'reliability_rating',
    ]].sort_values('overall_rating', ascending=False).reset_index(drop=True)