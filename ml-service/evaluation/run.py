"""
Run every candidate model through the rolling holdout and print a comparison.

    python -m evaluation.run
"""

import numpy as np
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
    stability_summary,
    teammate_correlation,
    to_result,
)
from evaluation.models import CANDIDATES, ChallengerModel
from models import ratings as R

# Models that produce no per-player ratings, so stability doesn't apply
NO_RATINGS = {"baseline", "challenger wins"}

# Folds before this many training matches are excluded from the reported
# metrics: with MIN_APPEARANCES = 20, the production model rates almost
# nobody early on and collapses to the baseline by construction. Applied to
# every model so the comparison stays like-for-like.
REPORT_FROM = 40

# Subsampling settings for rank stability
STABILITY_SAMPLES = 30
STABILITY_FRACTION = 0.8


def scored_splits(matches: pd.DataFrame):
    """Rolling splits with enough training history to be worth scoring."""
    for split in rolling_splits(matches):
        if len(split.train_ids) >= REPORT_FROM:
            yield split


def evaluate(model_class, matches, lineups) -> dict:
    predictions, actuals, predicted_results, actual_results = [], [], [], []
    calibrations = []

    for split in scored_splits(matches):
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

        # Models that calibrate a rating-to-goals scale expose it as _k.
        # Near zero or flipping sign across folds means no predictive signal.
        if hasattr(model, "_k"):
            calibrations.append(model._k)

        predictions.append((expected_a, expected_b))
        actuals.append((int(split.test_row["score_a"]), int(split.test_row["score_b"])))
        predicted_results.append(to_result(expected_a, expected_b))
        actual_results.append(actual_result(split.test_row))

    results = {"model": model_class.name}
    results.update(goal_error(predictions, actuals))
    results.update(result_accuracy(predicted_results, actual_results))

    if calibrations:
        k = np.array(calibrations)
        results.update(
            {
                "k_mean": round(float(k.mean()), 3),
                "k_min": round(float(k.min()), 3),
                "k_max": round(float(k.max()), 3),
            }
        )

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


def eligible_players(lineups: pd.DataFrame) -> set[int]:
    """Players with enough appearances in the full data to be rated in production.

    Every model is ranked over this same set, so a model that rates more
    people doesn't show bigger rank swings just because the field is larger.
    """
    apps = lineups.groupby("player_id").size()
    return set(apps[apps >= R.MIN_APPEARANCES].index)


def main() -> None:
    pd.set_option("display.width", 250)

    matches = with_challenger(load_matches())
    lineups = load_lineups()
    scored = sum(1 for _ in scored_splits(matches))

    print(
        f"{len(matches)} competitive matches, {scored} scored predictions "
        f"(from {REPORT_FROM} training matches)\n"
    )
    if scored == 0:
        print("Not enough matches to score any predictions. Lower REPORT_FROM.")
        return

    challenger_summary(matches)

    rows = [evaluate(cls, matches, lineups) for cls in CANDIDATES]
    print(pd.DataFrame(rows).to_string(index=False))

    eligible = eligible_players(lineups)
    players = load_all_players().set_index("id")["name"].to_dict()
    full = frozenset(matches["match_id"].tolist())

    print(
        f"\nRank stability ({STABILITY_SAMPLES} subsamples at "
        f"{STABILITY_FRACTION:.0%}, {len(eligible)} eligible players)\n"
    )

    summary_rows = []
    for cls in CANDIDATES:
        if cls.name in NO_RATINGS:
            continue
        stability = rank_stability(
            cls,
            full,
            eligible=eligible,
            n_samples=STABILITY_SAMPLES,
            fraction=STABILITY_FRACTION,
        )
        summary_rows.append({"model": cls.name, **stability_summary(stability)})

        if stability.empty:
            print(f"  {cls.name}: no players rated in enough samples\n")
            continue

        stability["name"] = stability["player_id"].map(players)
        print(f"  {cls.name}")
        print(
            stability[["name", "median_rank", "rank_sd", "rank_range"]]
            .head(15)
            .to_string(index=False)
        )
        print()

    print("Stability summary\n")
    print(pd.DataFrame(summary_rows).to_string(index=False))


if __name__ == "__main__":
    main()
