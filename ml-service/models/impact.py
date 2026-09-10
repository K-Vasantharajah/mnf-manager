"""
Adjusted plus-minus style impact model.

Each match produces two training rows (one per team). Features are binary
indicators for every player. Ridge regression solves for each player's
individual contribution to goals scored and goals conceded, controlling
for who else was on the pitch.

This separates individual contribution from team context in a way that
raw team stats (pt%, goals conceded) cannot.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from data.loader import load_team_compositions, load_all_players

RIDGE_ALPHA = 50.0


def build_design_matrix():
    comps = load_team_compositions()
    
    comps['team_instance'] = (
        comps['match_id'].astype(str) + '_' + comps['team']
    )

    # Player presence matrix
    X = pd.crosstab(comps['team_instance'], comps['player_id'])
    X = (X > 0).astype(int)

    outcomes = (
        comps.groupby('team_instance')[['goals_for', 'goals_against']]
        .first()
        .reindex(X.index)
    )

    appearances = X.sum(axis=0)

    return X, outcomes['goals_for'], outcomes['goals_against'], appearances


def fit_impact_model():
    X, goals_for, goals_against, appearances = build_design_matrix()

    # Attack model: predict goals FOR — only credits players whose team scored
    attack_model = Ridge(alpha=RIDGE_ALPHA, fit_intercept=True)
    attack_model.fit(X.values, goals_for.values)

    # Defence model: predict goals AGAINST — penalises players whose team concedes
    defence_model = Ridge(alpha=RIDGE_ALPHA, fit_intercept=True)
    defence_model.fit(X.values, goals_against.values)

    impact = pd.DataFrame({
        'player_id': X.columns,
        'attack_impact': attack_model.coef_,
        'defence_impact': -defence_model.coef_,
        'appearances': appearances.values,
    })

    impact['total_impact'] = impact['attack_impact'] + impact['defence_impact']

    players = load_all_players()
    impact = impact.merge(
        players[['id', 'name', 'position', 'active']],
        left_on='player_id',
        right_on='id',
        how='left',
    ).drop(columns=['id'])

    return impact.sort_values('total_impact', ascending=False).reset_index(drop=True)