"""
Draft simulator — predicts captain pick preferences and match outcome.

Captain preferences are inferred from historical team co-occurrence:
a player appearing on a captain's team in 80% of matches is a near-certain
early pick. This works around the confidentiality of actual draft order.

Match outcome prediction uses the fitted ridge regression impact model
to estimate the score differential between two teams.
"""

import pandas as pd
import numpy as np
from data.loader import load_captain_cooccurrence, load_all_players
from models.impact import fit_impact_model


def get_captain_preferences(captain_id: int, available_player_ids: list) -> list:
    """
    Given a captain and a pool of available players, return ranked pick
    recommendations based on historical co-occurrence.

    Returns list of dicts sorted by preference (highest first).
    """
    cooccurrence = load_captain_cooccurrence()
    all_players = load_all_players()

    captain_data = cooccurrence[cooccurrence['captain_id'] == captain_id].copy()

    available = captain_data[
        captain_data['player_id'].isin(available_player_ids)
    ].copy()

    # Players with no co-occurrence history get a neutral score
    seen_ids = set(available['player_id'].tolist())
    missing_ids = [pid for pid in available_player_ids if pid not in seen_ids]

    if missing_ids:
        missing_players = all_players[all_players['id'].isin(missing_ids)].copy()
        missing_players['captain_id'] = captain_id
        missing_players['captain_name'] = ''
        missing_players['player_id'] = missing_players['id']
        missing_players['player_name'] = missing_players['name']
        missing_players['appearances_together'] = 0
        missing_players['cooccurrence_rate'] = 0.0
        available = pd.concat([
            available,
            missing_players[available.columns]
        ], ignore_index=True)

    available = available.sort_values('cooccurrence_rate', ascending=False)

    return available[[
        'player_id', 'player_name', 'appearances_together', 'cooccurrence_rate'
    ]].to_dict(orient='records')


def predict_match_outcome(team_a_ids: list, team_b_ids: list) -> dict:
    """
    Given two team compositions, predict the likely score and win probability.

    Uses the fitted ridge regression coefficients to estimate each team's
    attacking and defensive strength, then calculates expected goals.
    """
    impact = fit_impact_model()
    impact_dict = impact.set_index('player_id')[
        ['attack_impact', 'defence_impact']
    ].to_dict(orient='index')

    def team_strength(player_ids):
        attack = np.mean([
            impact_dict.get(pid, {}).get('attack_impact', 0.0)
            for pid in player_ids
        ])
        defence = np.mean([
            impact_dict.get(pid, {}).get('defence_impact', 0.0)
            for pid in player_ids
        ])
        return attack, defence

    a_attack, a_defence = team_strength(team_a_ids)
    b_attack, b_defence = team_strength(team_b_ids)

    # Expected goals: team attack vs opponent defence
    # Baseline is average MNF score (~3 goals per team per match)
    baseline = 3.0
    a_expected = max(0, baseline + a_attack - b_defence)
    b_expected = max(0, baseline + b_attack - a_defence)

    score_diff = a_expected - b_expected

    # Convert score diff to win probability using sigmoid
    win_prob_a = 1 / (1 + np.exp(-score_diff * 1.5))

    return {
        'teamAExpectedGoals': round(a_expected, 1),
        'teamBExpectedGoals': round(b_expected, 1),
        'teamAWinProbability': round(win_prob_a * 100, 1),
        'teamBWinProbability': round((1 - win_prob_a) * 100, 1),
        'predictedResult': 'A' if score_diff > 0.2 else 'B' if score_diff < -0.2 else 'DRAW'
    }