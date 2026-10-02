"""
  Pairwise chemistry calculation, kept for the evaluation harness.

  The chemistry feature was removed after a permutation test
  (evaluation/chemistry_null.py) found pair scores indistinguishable from chance.
  """

import pandas as pd
from itertools import combinations

# Minimum matches two players must have played together to be included
MIN_MATCHES_TOGETHER = 5

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


