"""
Player ratings derived from adjusted plus-minus impact coefficients.

Attack and defence ratings come from ridge regression over team compositions,
which controls for teammate quality. Reliability remains attendance-based.

Players below MIN_APPEARANCES receive no rating — a null is honest about
missing data in a way that a floor value is not.
"""

import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from data.loader import load_player_stats, load_match_count
from models.impact import fit_impact_model

# Players below this threshold receive no rating — null is more honest than a floor value
MIN_APPEARANCES = 10

# Centred rating scale: the group average sits at RATING_CENTRE and each
# standard deviation of impact moves the rating by RATING_SPREAD points.
# Unlike MinMax, one player's extreme result doesn't rescale everyone else.
RATING_CENTRE = 5.5
RATING_SPREAD = 1.5
RATING_FLOOR = 3
RATING_CEILING = 10

# Gentle position weights (attack_weight, defence_weight). Extreme weights
# manufacture differences the evidence doesn't support.
POSITION_WEIGHTS = {
    "ST": (0.65, 0.35),
    "LW": (0.65, 0.35),
    "RW": (0.65, 0.35),
    "CAM": (0.575, 0.425),
    "CM": (0.50, 0.50),
    "CDM": (0.425, 0.575),
    "LB": (0.35, 0.65),
    "RB": (0.35, 0.65),
    "CB": (0.35, 0.65),
    "GK": (0.35, 0.65),
}

_ratings_cache = None


def get_position_weights(position: str):
    return POSITION_WEIGHTS.get(position, (0.50, 0.50))


def to_centred_rating(values: pd.Series, mean: float, std: float) -> pd.Series:
    """Convert raw impact values to the centred rating scale."""
    if std == 0:
        return pd.Series(RATING_CENTRE, index=values.index)
    z = (values - mean) / std
    return (RATING_CENTRE + RATING_SPREAD * z).clip(RATING_FLOOR, RATING_CEILING)


def calculate_derived_ratings(force_refresh: bool = False):
    """
    Returns one row per rateable player with attack, defence, overall
    and reliability ratings.
    """
    global _ratings_cache
    if _ratings_cache is not None and not force_refresh:
        return _ratings_cache

    impact = fit_impact_model(force_refresh=force_refresh)
    player_stats = load_player_stats()
    total_matches = load_match_count()

    rateable = impact[impact["appearances"] >= MIN_APPEARANCES].copy()

    # Pool attack and defence impacts so both share one scale — an 8 in
    # attack represents the same magnitude of contribution as an 8 in defence.
    pooled = pd.concat([rateable["attack_impact"], rateable["defence_impact"]])
    pooled_mean = pooled.mean()
    pooled_std = pooled.std()

    attack_raw = to_centred_rating(rateable["attack_impact"], pooled_mean, pooled_std)
    defence_raw = to_centred_rating(rateable["defence_impact"], pooled_mean, pooled_std)

    rateable["attack_rating"] = attack_raw.round(0).astype(int)
    rateable["defence_rating"] = defence_raw.round(0).astype(int)

    # Overall uses the unrounded values so rounding errors don't compound
    weights = rateable["position"].map(get_position_weights)
    rateable["overall_rating"] = (
        (weights.str[0] * attack_raw + weights.str[1] * defence_raw)
        .clip(RATING_FLOOR, RATING_CEILING)
        .round(0)
        .astype(int)
    )

    # Reliability stays attendance-based and scaled independently,
    # since it measures availability rather than on-pitch contribution.
    appearances_all = player_stats.groupby("player_id")["matches_played"].sum()
    rateable["attendance_rate"] = (
        rateable["player_id"].map(appearances_all / total_matches).fillna(0).clip(0, 1)
    )

    reliability_scaler = MinMaxScaler(feature_range=(RATING_FLOOR, RATING_CEILING))
    rateable["reliability_rating"] = (
        reliability_scaler.fit_transform(rateable[["attendance_rate"]].values)
        .round(0)
        .astype(int)
    )

    _ratings_cache = (
        rateable[
            [
                "player_id",
                "name",
                "position",
                "active",
                "appearances",
                "attack_impact",
                "defence_impact",
                "attack_rating",
                "defence_rating",
                "overall_rating",
                "reliability_rating",
            ]
        ]
        .sort_values("overall_rating", ascending=False)
        .reset_index(drop=True)
    )

    return _ratings_cache
