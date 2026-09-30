"""
Player ratings from recorded match statistics.

Each player is compared against others in their position group rather than
against the whole squad, so a defender's goals aren't judged against a
striker's. Four recorded statistics feed the ratings, weighted differently
by position: points percentage, goals per game, clean sheet rate, and goals
conceded per game.

Recent appearances count for more, and evidence from players who stopped
turning up decays over time, so a rating reflects current form rather than
a career average.

Ratings are shrunk toward the group average in proportion to how little is
known about a player, so thin evidence produces a middling rating rather
than a confident one.

This measures recorded outcomes, not ability. A player can have a good night
on a losing team and the statistics won't see it.
"""

import pandas as pd
from sqlalchemy import text

from data.loader import get_engine, load_all_players, load_match_count

# Below this many appearances, a player gets no rating at all
MIN_APPEARANCES = 20

# Appearances ago at which a match counts half as much as the most recent one
RECENCY_HALF_LIFE = 40.0

# Match weeks elapsed at which a match counts half as much, regardless of
# whether the player was there. Keeps stale ratings from looking confident.
STALENESS_HALF_LIFE = 60.0

# Weighted appearances at which a rating is taken at roughly face value
SHRINKAGE_WEIGHT = 15.0

# FIFA-style scale: nobody's card reads as a verdict on them
RATING_CENTRE = 75
RATING_SPREAD = 20
RATING_FLOOR = 60
RATING_CEILING = 95

# Component weights by position group. Goals matter four times as much for an
# attacker as a defender; clean sheets don't count for attackers at all.
COMPONENT_WEIGHTS = {
    "ATT": {"points": 0.50, "goals": 0.40, "clean_sheet": 0.00, "conceded": 0.10},
    "MID": {"points": 0.50, "goals": 0.20, "clean_sheet": 0.15, "conceded": 0.15},
    "DEF": {"points": 0.50, "goals": 0.10, "clean_sheet": 0.20, "conceded": 0.20},
}

POSITION_GROUPS = {
    "GK": "DEF",
    "CB": "DEF",
    "LB": "DEF",
    "RB": "DEF",
    "CDM": "MID",
    "CM": "MID",
    "CAM": "MID",
    "LW": "ATT",
    "RW": "ATT",
    "ST": "ATT",
}

# Gentle weights: stronger splits manufacture differences the data can't support
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


def load_player_appearances() -> pd.DataFrame:
    """One row per player per competitive match, with that match's outcome.

    Includes each match's overall position in MNF history (`match_index`), so
    recency can account for calendar time as well as a player's own appearances.
    """
    query = """
        WITH ordered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS match_index
            FROM matches
            WHERE is_exhibition = false
        )
        SELECT
            mp.player_id,
            m.id AS match_id,
            o.match_index,
            CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END AS conceded,
            CASE
                WHEN (CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END) = 0
                THEN 1 ELSE 0
            END AS clean_sheet,
            CASE
                WHEN m.is_draw THEN 1
                WHEN (m.winner_id = m.captain_a_id AND mp.team = 'A')
                  OR (m.winner_id = m.captain_b_id AND mp.team = 'B') THEN 3
                ELSE 0
            END AS points,
            COALESCE((
                SELECT SUM(gs.goals)
                FROM goal_scorers gs
                WHERE gs.match_id = m.id
                  AND gs.player_id = mp.player_id
                  AND gs.is_own_goal = false
            ), 0) AS goals
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        JOIN ordered o ON o.id = m.id
        WHERE m.is_exhibition = false
        ORDER BY mp.player_id, m.id
    """
    with get_engine().connect() as conn:
        return pd.read_sql(text(query), conn)


def weighted_totals(appearances: pd.DataFrame) -> pd.DataFrame:
    """Collapse per-match rows into recency-weighted per-player totals.

    Two decays apply. One is by a player's own appearances, so their recent
    form counts for more than their early matches. The other is by match weeks
    elapsed, so someone who stopped turning up months ago is rated on evidence
    the model treats as stale rather than current.
    """
    df = appearances.sort_values(["player_id", "match_id"]).copy()
    latest_match = df["match_index"].max()

    # 0 for a player's most recent appearance, increasing into the past
    df["appearances_ago"] = df.groupby("player_id").cumcount(ascending=False)
    form_weight = 0.5 ** (df["appearances_ago"] / RECENCY_HALF_LIFE)

    # How many MNF matches have been played since, whether or not they were there
    df["weeks_ago"] = latest_match - df["match_index"]
    staleness_weight = 0.5 ** (df["weeks_ago"] / STALENESS_HALF_LIFE)

    df["weight"] = form_weight * staleness_weight

    for column in ("goals", "conceded", "points", "clean_sheet"):
        df[f"w_{column}"] = df[column] * df["weight"]

    totals = (
        df.groupby("player_id")
        .agg(
            appearances=("match_id", "count"),
            weighted_appearances=("weight", "sum"),
            last_match_index=("match_index", "max"),
            w_goals=("w_goals", "sum"),
            w_conceded=("w_conceded", "sum"),
            w_points=("w_points", "sum"),
            w_clean_sheet=("w_clean_sheet", "sum"),
        )
        .reset_index()
    )

    totals["matches_since_last_played"] = latest_match - totals["last_match_index"]
    totals["goals_per_game"] = totals["w_goals"] / totals["weighted_appearances"]
    totals["conceded_per_game"] = totals["w_conceded"] / totals["weighted_appearances"]
    totals["clean_sheet_rate"] = (
        totals["w_clean_sheet"] / totals["weighted_appearances"]
    )
    totals["points_percentage"] = totals["w_points"] / (
        totals["weighted_appearances"] * 3
    )

    return totals


def get_position_weights(position: str):
    return POSITION_WEIGHTS.get(position, (0.50, 0.50))


def to_rating(percentile: pd.Series, weighted_appearances: pd.Series) -> pd.Series:
    """Convert a 0-1 percentile to a rating, shrunk toward the centre.

    Shrinkage scales with evidence: with little weighted history a player sits
    close to average regardless of their percentile.
    """
    confidence = weighted_appearances / (weighted_appearances + SHRINKAGE_WEIGHT)
    centred = (percentile - 0.5) * confidence
    return (RATING_CENTRE + RATING_SPREAD * 2 * centred).clip(
        RATING_FLOOR, RATING_CEILING
    )


def component_score(row: pd.Series, components: tuple[str, ...]) -> float:
    """Blend percentile components using this player's position weights.

    Weights are renormalised across whichever components apply, so attack and
    defence each use the full range even though they draw on different stats.
    """
    weights = COMPONENT_WEIGHTS[row["group"]]
    total = sum(weights[c] for c in components)
    if total == 0:
        return 0.5
    return sum(weights[c] * row[f"{c}_pct"] for c in components) / total


def calculate_derived_ratings(force_refresh: bool = False):
    """One row per rateable player: attack, defence, overall and reliability."""
    global _ratings_cache
    if _ratings_cache is not None and not force_refresh:
        return _ratings_cache

    totals = weighted_totals(load_player_appearances())
    players = load_all_players()
    total_matches = load_match_count()

    df = totals.merge(
        players[["id", "name", "position", "active"]],
        left_on="player_id",
        right_on="id",
        how="left",
    ).drop(columns=["id"])

    # Threshold uses raw appearances, so it stays easy to explain
    df = df[df["appearances"] >= MIN_APPEARANCES].copy()
    df["group"] = df["position"].map(POSITION_GROUPS).fillna("MID")

    # Percentile within position group. Conceding fewer is better, so invert.
    by_group = df.groupby("group")
    df["goals_pct"] = by_group["goals_per_game"].rank(pct=True)
    df["conceded_pct"] = 1 - by_group["conceded_per_game"].rank(pct=True)
    df["points_pct"] = by_group["points_percentage"].rank(pct=True)
    df["clean_sheet_pct"] = by_group["clean_sheet_rate"].rank(pct=True)

    attack_score = df.apply(
        lambda row: component_score(row, ("points", "goals")), axis=1
    )
    defence_score = df.apply(
        lambda row: component_score(row, ("points", "conceded", "clean_sheet")), axis=1
    )

    attack_raw = to_rating(attack_score, df["weighted_appearances"])
    defence_raw = to_rating(defence_score, df["weighted_appearances"])

    df["attack_rating"] = attack_raw.round(0).astype(int)
    df["defence_rating"] = defence_raw.round(0).astype(int)

    weights = df["position"].map(get_position_weights)
    df["overall_rating"] = (
        (weights.str[0] * attack_raw + weights.str[1] * defence_raw)
        .clip(RATING_FLOOR, RATING_CEILING)
        .round(0)
        .astype(int)
    )

    # Reliability is availability, not football — scaled on its own
    attendance = (df["appearances"] / total_matches).clip(0, 1)
    df["reliability_rating"] = (
        (RATING_FLOOR + attendance * (RATING_CEILING - RATING_FLOOR))
        .round(0)
        .astype(int)
    )

    _ratings_cache = (
        df[
            [
                "player_id",
                "name",
                "position",
                "active",
                "appearances",
                "weighted_appearances",
                "matches_since_last_played",
                "goals_per_game",
                "conceded_per_game",
                "clean_sheet_rate",
                "points_percentage",
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
