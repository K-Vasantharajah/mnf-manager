"""
Metrics for comparing rating models.

Two questions matter, and they're different:

  1. Does the model predict match outcomes better than knowing nothing?
  2. Are individual player ratings stable enough to publish?

A model can do well on the first and badly on the second: predicting that a
team of strong players wins is easy, but that doesn't mean the model has
correctly apportioned credit among them.
"""

import numpy as np
import pandas as pd


def _overall(ratings: pd.DataFrame) -> pd.Series:
    """A model's own overall rating if it has one, otherwise attack + defence.

    Production blends attack and defence by position, so summing them would
    rank players differently from the table people actually see.
    """
    if "overall" in ratings.columns:
        return ratings["overall"]
    return ratings["attack"] + ratings["defence"]


def goal_error(
    predictions: list[tuple[float, float]], actuals: list[tuple[int, int]]
) -> dict:
    """Mean absolute error on predicted goals, across both teams."""
    errors = [
        abs(pa - aa) + abs(pb - ab) for (pa, pb), (aa, ab) in zip(predictions, actuals)
    ]
    return {
        "mae_goals": round(float(np.mean(errors)) / 2, 3),
    }


def result_accuracy(predicted: list[str], actual: list[str]) -> dict:
    """How often the predicted result matched, and how often each result was called."""
    correct = sum(p == a for p, a in zip(predicted, actual))
    return {
        "result_accuracy": round(correct / len(actual), 3),
        "predicted_draws": sum(p == "DRAW" for p in predicted),
        "actual_draws": sum(a == "DRAW" for a in actual),
    }


def to_result(expected_a: float, expected_b: float, draw_margin: float = 0.2) -> str:
    """Convert expected goals to a predicted result."""
    diff = expected_a - expected_b
    if abs(diff) <= draw_margin:
        return "DRAW"
    return "A" if diff > 0 else "B"


def rank_stability(
    model_class,
    match_ids: frozenset[int],
    eligible: set[int] | None = None,
    n_samples: int = 30,
    fraction: float = 0.8,
    seed: int = 42,
) -> pd.DataFrame:
    """Refit on random subsamples of matches and measure how much each rank moves.

    Each sample drops a random (1 - fraction) of matches without replacement.
    A true bootstrap would need duplicated matches, which neither a match-id
    set nor a recency-weighted model can represent sensibly.

    `eligible` restricts ranking to a fixed set of players, so models that rate
    different numbers of people are compared over the same field. Without it,
    a model that rates more players shows larger rank swings for that reason alone.

    A player whose rank swings widely across samples is not confidently
    estimated, however precise their displayed rating looks.
    """
    rng = np.random.default_rng(seed)
    ids = sorted(match_ids)
    size = int(len(ids) * fraction)
    ranks: dict[int, list[int]] = {}

    for _ in range(n_samples):
        sample = frozenset(rng.choice(ids, size=size, replace=False).tolist())
        model = model_class()
        model.fit(sample)
        r = model.ratings()
        if r.empty:
            continue
        if eligible is not None:
            r = r[r["player_id"].isin(eligible)]
        r = r.assign(overall=_overall(r))
        r = r.sort_values("overall", ascending=False).reset_index(drop=True)
        for position, player_id in enumerate(r["player_id"], start=1):
            ranks.setdefault(int(player_id), []).append(position)

    rows = [
        {
            "player_id": pid,
            "samples": len(positions),
            "median_rank": int(np.median(positions)),
            "rank_sd": round(float(np.std(positions)), 1),
            "rank_range": int(np.max(positions) - np.min(positions)),
        }
        for pid, positions in ranks.items()
        if len(positions) >= n_samples // 2
    ]
    return pd.DataFrame(rows).sort_values("median_rank").reset_index(drop=True)


def stability_summary(stability: pd.DataFrame) -> dict:
    """One-line summary of a stability table, for comparing models side by side."""
    if stability.empty:
        return {"players": 0, "median_rank_sd": None, "max_rank_range": None}
    return {
        "players": len(stability),
        "median_rank_sd": round(float(stability["rank_sd"].median()), 1),
        "max_rank_range": int(stability["rank_range"].max()),
    }


def teammate_correlation(
    model, lineups: pd.DataFrame, match_ids: frozenset[int]
) -> dict:
    """Correlation between a player's rating and their teammates' average rating.

    High correlation suggests the model is measuring who someone played with
    rather than how they played — the identification problem, quantified.
    """
    ratings = model.ratings()
    if ratings.empty:
        return {"teammate_correlation": None}

    lookup = (
        ratings.assign(overall=_overall(ratings))
        .set_index("player_id")["overall"]
        .to_dict()
    )

    relevant = lineups[lineups["match_id"].isin(match_ids)]
    own, mates = [], []

    for (match_id, team), group in relevant.groupby(["match_id", "team"]):
        players = group["player_id"].tolist()
        rated = [p for p in players if p in lookup]
        if len(rated) < 2:
            continue
        for player in rated:
            others = [lookup[p] for p in rated if p != player]
            own.append(lookup[player])
            mates.append(float(np.mean(others)))

    if len(own) < 3:
        return {"teammate_correlation": None}

    return {"teammate_correlation": round(float(np.corrcoef(own, mates)[0, 1]), 3)}
