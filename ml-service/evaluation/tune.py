"""
Print the ratings table under different parameter settings, so the effect of
each lever can be seen rather than guessed at.

This shows how the table moves, not whether it got better. Whether a setting
improves the ratings is a question for the evaluation harness:

    python -m evaluation.tune
    python -m evaluation.run
"""

import os

import pandas as pd

from models import ratings as R

pd.set_option("display.width", 250)

COLUMNS = [
    "name",
    "position",
    "appearances",
    "goals_per_game",
    "conceded_per_game",
    "clean_sheet_rate",
    "points_percentage",
    "attack_rating",
    "defence_rating",
    "overall_rating",
]

# Players to highlight in the summary, comma-separated, e.g. WATCH="Name1,Name2"
WATCH = [n.strip() for n in os.getenv("WATCH", "").split(",") if n.strip()]


def with_settings(**overrides) -> pd.DataFrame:
    """Recalculate ratings with temporary parameter overrides.

    Restores the original settings and clears the ratings cache afterwards,
    so nothing calculated under overridden settings outlives the call.
    """
    original = {key: getattr(R, key) for key in overrides}
    try:
        for key, value in overrides.items():
            setattr(R, key, value)
        return R.calculate_derived_ratings(force_refresh=True)
    finally:
        for key, value in original.items():
            setattr(R, key, value)
        R._ratings_cache = None


def points_weighted(points: float) -> dict:
    """Component weights with points set to `points` in every position group.

    The other components keep their relative proportions and share what's left,
    so only the balance between team results and individual stats changes.
    """
    adjusted = {}
    for group, weights in R.COMPONENT_WEIGHTS.items():
        others = {c: w for c, w in weights.items() if c != "points"}
        others_total = sum(others.values())
        scale = (1 - points) / others_total if others_total else 0
        adjusted[group] = {
            "points": points,
            **{c: w * scale for c, w in others.items()},
        }
    return adjusted


def summarise(label: str, df: pd.DataFrame) -> None:
    spread = df["overall_rating"].max() - df["overall_rating"].min()
    counts = df["overall_rating"].value_counts().sort_index()
    distribution = "  ".join(f"{rating}:{count}" for rating, count in counts.items())

    print(f"\n{label}")
    print(f"  {len(df)} rated   spread {spread}   distribution  {distribution}")

    if WATCH:
        watched = df[df["name"].isin(WATCH)][["name", "overall_rating"]]
        print(
            "  "
            + "  ".join(
                f"{row['name']} {row['overall_rating']}"
                for _, row in watched.iterrows()
            )
        )


def main() -> None:
    print("Current settings:")
    print(
        f"  MIN_APPEARANCES={R.MIN_APPEARANCES}  "
        f"SHRINKAGE_WEIGHT={R.SHRINKAGE_WEIGHT}  "
        f"RECENCY_HALF_LIFE={R.RECENCY_HALF_LIFE}  "
        f"STALENESS_HALF_LIFE={R.STALENESS_HALF_LIFE}"
    )
    for group, weights in R.COMPONENT_WEIGHTS.items():
        print(f"  {group}: " + "  ".join(f"{c}={w:.2f}" for c, w in weights.items()))

    current = with_settings()
    summarise("current settings", current)

    for weight in (5.0, 10.0, 25.0):
        summarise(f"SHRINKAGE_WEIGHT={weight}", with_settings(SHRINKAGE_WEIGHT=weight))

    for half_life in (20.0, 60.0):
        summarise(
            f"RECENCY_HALF_LIFE={half_life}", with_settings(RECENCY_HALF_LIFE=half_life)
        )

    for half_life in (30.0, 120.0):
        summarise(
            f"STALENESS_HALF_LIFE={half_life}",
            with_settings(STALENESS_HALF_LIFE=half_life),
        )

    for points in (0.35, 0.65):
        summarise(
            f"points weight {points} (other components rescaled)",
            with_settings(COMPONENT_WEIGHTS=points_weighted(points)),
        )

    for threshold in (10, 30):
        summarise(
            f"MIN_APPEARANCES={threshold}", with_settings(MIN_APPEARANCES=threshold)
        )

    print("\nFull table under current settings:\n")
    print(current[COLUMNS].round(2).to_string())


if __name__ == "__main__":
    main()
