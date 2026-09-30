"""
Run every candidate model through the rolling holdout and print a comparison.

    python -m evaluation.run
"""

import pandas as pd

from data.loader import load_all_players
from evaluation.dataset import (
    actual_result,
    lineup_for,
    load_lineups,
    load_matches,
    rolling_splits,
    with_challenger,
)
from evaluation.metrics import (
    goal_error,
    rank_stability,
    result_accuracy,
    teammate_correlation,
    to_result,
)
from evaluation.models import CANDIDATES, ChallengerModel

# Models that produce no per-player ratings, so stability doesn't apply
NO_RATINGS = {"baseline", "challenger wins"}


def evaluate(model_class, matches, lineups) -> dict:
    predictions, actuals, predicted_results, actual_results = [], [], [], []

    for split in rolling_splits(matches):
        model = model_class()
        model.fit(split.train_ids)

        if isinstance(model, ChallengerModel):
            # Needs to know which side the challenger led, which isn't in the lineups
            expected_a, expected_b = model.predict_with_context(
                split.test_row["challenger_team"]
            )
        else:
            team_a, team_b = lineup_for(lineups, split.test_id)
            expected_a, expected_b = model.predict(team_a, team_b)

        predictions.append((expected_a, expected_b))
        actuals.append((int(split.test_row["score_a"]), int(split.test_row["score_b"])))
        predicted_results.append(to_result(expected_a, expected_b))
        actual_results.append(actual_result(split.test_row))

    results = {"model": model_class.name}
    results.update(goal_error(predictions, actuals))
    results.update(result_accuracy(predicted_results, actual_results))

    # Identification check, on a model fitted to everything
    full = frozenset(matches["match_id"].tolist())
    fitted = model_class()
    fitted.fit(full)
    results.update(teammate_correlation(fitted, lineups, full))

    return results


def challenger_summary(matches: pd.DataFrame) -> None:
    """How often the challenging captain actually wins, where it can be determined."""
    known = matches[matches["challenger_team"].notna()]
    if known.empty:
        print("No matches with a determinable challenger.\n")
        return

    wins = 0
    for _, row in known.iterrows():
        if row["is_draw"]:
            continue
        winner_is_a = row["score_a"] > row["score_b"]
        if (row["challenger_team"] == "A") == winner_is_a:
            wins += 1

    decisive = (~known["is_draw"]).sum()
    draws = known["is_draw"].sum()
    print(
        f"Challenger record: {wins} wins from {decisive} decisive matches "
        f"({wins / decisive:.1%}), plus {draws} draws. "
        f"{len(matches) - len(known)} matches undetermined.\n"
    )


def main() -> None:
    matches = with_challenger(load_matches())
    lineups = load_lineups()
    n_predictions = len(list(rolling_splits(matches)))

    print(f"{len(matches)} competitive matches, {n_predictions} rolling predictions\n")
    challenger_summary(matches)

    rows = [evaluate(cls, matches, lineups) for cls in CANDIDATES]
    print(pd.DataFrame(rows).to_string(index=False))

    print("\nRank stability (30 bootstrap resamples)\n")
    players = load_all_players().set_index("id")["name"].to_dict()
    full = frozenset(matches["match_id"].tolist())

    for cls in CANDIDATES:
        if cls.name in NO_RATINGS:
            continue
        stability = rank_stability(cls, full)
        stability["name"] = stability["player_id"].map(players)
        print(f"  {cls.name}")
        print(
            stability[["name", "median_rank", "rank_sd", "rank_range"]]
            .head(15)
            .to_string(index=False)
        )
        print()


if __name__ == "__main__":
    main()
