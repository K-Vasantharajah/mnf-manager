"""
Chemistry analysis — identifies player pairs who consistently
win or lose together.

For each pair of players who have played on the same team,
we calculate:
- matches_together: how many times they played on the same team
- wins_together: how many of those matches they won
- win_rate_together: wins / matches as a percentage
- chemistry_score: win_rate vs each player's individual win_rate
  positive = they perform better together than apart
  negative = they perform worse together than apart
"""

import pandas as pd
import numpy as np
from data.loader import load_team_compositions, load_all_players
from itertools import combinations

# Minimum matches two players must have played together to be included
MIN_MATCHES_TOGETHER = 5

_chemistry_cache = None


def chemistry_from(
    comps: pd.DataFrame, min_matches: int = MIN_MATCHES_TOGETHER
) -> pd.DataFrame:
    """Pairwise chemistry scores from a set of team compositions.

    Pure calculation, no loading or caching, so the evaluation code can run it
    on altered data.
    """
    individual = (
        comps.groupby("player_id")
        .agg(
            total_matches=("match_id", "nunique"),
            wins=("result", lambda x: (x == "WIN").sum()),
        )
        .reset_index()
    )
    individual["individual_win_rate"] = (
        individual["wins"] / individual["total_matches"] * 100
    ).round(1)

    team_matches = (
        comps.groupby(["match_id", "team"])["player_id"].apply(list).reset_index()
    )
    team_results = comps[["match_id", "team", "result"]].drop_duplicates()
    team_matches = team_matches.merge(team_results, on=["match_id", "team"], how="left")

    pair_results = [
        {"player_a": p1, "player_b": p2, "match_id": row.match_id, "result": row.result}
        for row in team_matches.itertuples()
        for p1, p2 in combinations(sorted(row.player_id), 2)
    ]
    pairs_df = pd.DataFrame(pair_results)
    if pairs_df.empty:
        return pd.DataFrame()

    chemistry = (
        pairs_df.groupby(["player_a", "player_b"])
        .agg(
            matches_together=("match_id", "nunique"),
            wins_together=("result", lambda x: (x == "WIN").sum()),
            draws_together=("result", lambda x: (x == "DRAW").sum()),
        )
        .reset_index()
    )
    chemistry["win_rate_together"] = (
        chemistry["wins_together"] / chemistry["matches_together"] * 100
    ).round(1)
    chemistry = chemistry[chemistry["matches_together"] >= min_matches].copy()

    rates = individual.set_index("player_id")["individual_win_rate"]
    chemistry["win_rate_a"] = chemistry["player_a"].map(rates)
    chemistry["win_rate_b"] = chemistry["player_b"].map(rates)
    chemistry["expected_win_rate"] = (
        chemistry["win_rate_a"] + chemistry["win_rate_b"]
    ) / 2
    chemistry["chemistry_score"] = (
        chemistry["win_rate_together"] - chemistry["expected_win_rate"]
    ).round(1)

    return chemistry


def calculate_chemistry(force_refresh: bool = False):
    """
    Calculate pairwise chemistry scores for all player combinations.
    Returns DataFrame sorted by chemistry score descending.
    """
    global _chemistry_cache
    if _chemistry_cache is not None and not force_refresh:
        return _chemistry_cache

    chemistry = chemistry_from(load_team_compositions())
    if chemistry.empty:
        return chemistry

    players_dict = load_all_players().set_index("id")["name"].to_dict()
    chemistry["player_a_name"] = chemistry["player_a"].map(players_dict)
    chemistry["player_b_name"] = chemistry["player_b"].map(players_dict)

    _chemistry_cache = (
        chemistry[
            [
                "player_a",
                "player_a_name",
                "player_b",
                "player_b_name",
                "matches_together",
                "wins_together",
                "draws_together",
                "win_rate_together",
                "expected_win_rate",
                "chemistry_score",
            ]
        ]
        .sort_values("chemistry_score", ascending=False)
        .reset_index(drop=True)
    )
    return _chemistry_cache


def get_player_chemistry(player_id: int, min_matches: int = MIN_MATCHES_TOGETHER):
    """Get chemistry scores for a specific player with all teammates."""
    chemistry = calculate_chemistry()
    if chemistry.empty:
        return []

    player_chem = chemistry[
        (chemistry["player_a"] == player_id) | (chemistry["player_b"] == player_id)
    ].copy()

    # Normalise so the player is always in player_a column
    player_chem["partner_id"] = np.where(
        player_chem["player_a"] == player_id,
        player_chem["player_b"],
        player_chem["player_a"],
    )
    player_chem["partner_name"] = np.where(
        player_chem["player_a"] == player_id,
        player_chem["player_b_name"],
        player_chem["player_a_name"],
    )

    return (
        player_chem[
            [
                "partner_id",
                "partner_name",
                "matches_together",
                "wins_together",
                "win_rate_together",
                "chemistry_score",
            ]
        ]
        .sort_values("chemistry_score", ascending=False)
        .to_dict(orient="records")
    )
