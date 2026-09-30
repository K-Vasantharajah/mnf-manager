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
from data.loader import load_match_compositions_with_scores, load_all_players

_impact_cache = None

# Regularisation strength for ridge regression — higher = more shrinkage toward zero,
# prevents overfitting on small datasets. Tuned for ~57 matches.
RIDGE_ALPHA = 50.0


def build_design_matrix(match_ids: set[int] | None = None):
    """Build binary player presence matrix and outcome vectors.

    match_ids limits the fit to a subset of matches, which the evaluation
    harness uses to train on earlier weeks and test on later ones.
    """
    comps = load_match_compositions_with_scores()
    if match_ids is not None:
        comps = comps[comps["match_id"].isin(match_ids)].copy()
    comps["team_instance"] = comps["match_id"].astype(str) + "_" + comps["team"]

    X = pd.crosstab(comps["team_instance"], comps["player_id"])
    X = (X > 0).astype(int)

    outcomes = (
        comps.groupby("team_instance")[["goals_for", "goals_against"]]
        .first()
        .reindex(X.index)
    )

    appearances = X.sum(axis=0)

    return X, outcomes["goals_for"], outcomes["goals_against"], appearances


def fit_impact_model(force_refresh: bool = False, match_ids: set[int] | None = None):
    global _impact_cache
    # Never cache a subset fit — the cache is for the full model only
    if match_ids is None and _impact_cache is not None and not force_refresh:
        return _impact_cache

    X, goals_for, goals_against, appearances = build_design_matrix(match_ids)

    # Attack model: predict goals FOR — only credits players whose team scored
    attack_model = Ridge(alpha=RIDGE_ALPHA, fit_intercept=True)
    attack_model.fit(X.values, goals_for.values)

    # Defence model: predict goals AGAINST — penalises players whose team concedes
    defence_model = Ridge(alpha=RIDGE_ALPHA, fit_intercept=True)
    defence_model.fit(X.values, goals_against.values)

    impact = pd.DataFrame(
        {
            "player_id": X.columns,
            "attack_impact": attack_model.coef_,
            "defence_impact": -defence_model.coef_,
            "appearances": appearances.values,
        }
    )

    impact["total_impact"] = impact["attack_impact"] + impact["defence_impact"]

    players = load_all_players()
    impact = impact.merge(
        players[["id", "name", "position", "active"]],
        left_on="player_id",
        right_on="id",
        how="left",
    ).drop(columns=["id"])

    result = impact.sort_values("total_impact", ascending=False).reset_index(drop=True)

    if match_ids is None:
        _impact_cache = result

    return result
