"""
Print the ratings table under different parameter settings, so the effect of
each lever can be seen rather than guessed at.

    python -m evaluation.tune
"""

import pandas as pd

from models import ratings as R

pd.set_option("display.width", 250)

COLUMNS = [
    "name",
    "position",
    "appearances",
    "goals_per_game",
    "conceded_per_game",
    "points_percentage",
    "attack_rating",
    "defence_rating",
    "overall_rating",
]

# Players worth watching, because the arguments are about them
WATCH = ["Jag", "Aqib", "Sahi", "Syed", "Akshay", "Ibrahim", "Finlay", "Kobi", "Arif"]


def with_settings(**overrides) -> pd.DataFrame:
    """Recalculate ratings with temporary parameter overrides."""
    original = {key: getattr(R, key) for key in overrides}
    try:
        for key, value in overrides.items():
            setattr(R, key, value)
        return R.calculate_derived_ratings(force_refresh=True)
    finally:
        for key, value in original.items():
            setattr(R, key, value)


def summarise(label: str, df: pd.DataFrame) -> None:
    spread = df["overall_rating"].max() - df["overall_rating"].min()
    counts = df["overall_rating"].value_counts().sort_index()
    distribution = "  ".join(f"{rating}:{count}" for rating, count in counts.items())

    watched = df[df["name"].isin(WATCH)][["name", "overall_rating"]]
    watched = "  ".join(
        f"{row['name']} {row['overall_rating']}" for _, row in watched.iterrows()
    )

    print(f"\n{label}")
    print(f"  spread {spread}   distribution  {distribution}")
    print(f"  {watched}")


def main() -> None:
    print("Current settings:")
    print(
        f"  SHRINKAGE_WEIGHT={R.SHRINKAGE_WEIGHT}  "
        f"RECENCY_HALF_LIFE={R.RECENCY_HALF_LIFE}  "
        f"GOALS_WEIGHT={R.GOALS_WEIGHT}  POINTS_WEIGHT={R.POINTS_WEIGHT}"
    )

    summarise("baseline (current settings)", with_settings())

    for weight in (5.0, 10.0, 15.0):
        summarise(f"SHRINKAGE_WEIGHT={weight}", with_settings(SHRINKAGE_WEIGHT=weight))

    for half_life in (40.0, 60.0):
        summarise(
            f"RECENCY_HALF_LIFE={half_life}", with_settings(RECENCY_HALF_LIFE=half_life)
        )

    for goals, points in ((0.4, 0.6), (0.3, 0.7)):
        summarise(
            f"GOALS_WEIGHT={goals} POINTS_WEIGHT={points}",
            with_settings(
                GOALS_WEIGHT=goals, CONCEDED_WEIGHT=goals, POINTS_WEIGHT=points
            ),
        )

    # A combination worth trying: less shrinkage, longer memory, points-led
    combined = with_settings(
        SHRINKAGE_WEIGHT=15.0,
        RECENCY_HALF_LIFE=40.0,
        GOALS_WEIGHT=0.4,
        CONCEDED_WEIGHT=0.4,
        POINTS_WEIGHT=0.6,
    )
    summarise("combined: shrinkage 10, half-life 40, points-led", combined)

    print("\nFull table under the combined settings:\n")
    print(combined[COLUMNS].round(2).to_string())


if __name__ == "__main__":
    main()
