"""
Match data and train/test splits for evaluating rating models.

MNF plays one match a week, so the natural evaluation is a rolling holdout:
train on every match up to week N, predict week N+1, then move forward. That
mirrors how the ratings are actually used — you only ever know the past.
"""

from dataclasses import dataclass

import pandas as pd
from sqlalchemy import text

from data.loader import get_engine

# Matches needed before the first prediction. Below this the model has too
# little to say anything, and early predictions would add noise rather than signal.
MIN_TRAIN_MATCHES = 20


@dataclass(frozen=True)
class Split:
    """One step of the rolling holdout: everything before, and the match to predict."""

    train_ids: frozenset[int]
    test_id: int
    test_row: pd.Series


def load_matches() -> pd.DataFrame:
    """Competitive matches in chronological order, with team compositions attached."""
    query = """
        SELECT
            m.id AS match_id,
            m.season_year,
            m.game_week,
            m.score_a,
            m.score_b,
            m.is_draw,
            m.captain_a_id,
            m.captain_b_id,
            m.winner_id
        FROM matches m
        WHERE m.is_exhibition = false
        ORDER BY m.id
    """
    with get_engine().connect() as conn:
        return pd.read_sql(text(query), conn)


def load_lineups() -> pd.DataFrame:
    """Which players were on which team, for every competitive match."""
    query = """
        SELECT mp.match_id, mp.player_id, mp.team
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        WHERE m.is_exhibition = false
        ORDER BY mp.match_id
    """
    with get_engine().connect() as conn:
        return pd.read_sql(text(query), conn)


def lineup_for(lineups: pd.DataFrame, match_id: int) -> tuple[list[int], list[int]]:
    """Return (team A player ids, team B player ids) for one match."""
    rows = lineups[lineups["match_id"] == match_id]
    team_a = rows[rows["team"] == "A"]["player_id"].tolist()
    team_b = rows[rows["team"] == "B"]["player_id"].tolist()
    return team_a, team_b


def rolling_splits(matches: pd.DataFrame, min_train: int = MIN_TRAIN_MATCHES):
    """Yield a Split for each match after the first `min_train`.

    Train sets are cumulative: predicting match 30 uses matches 1-29.
    """
    ordered = matches.sort_values("match_id").reset_index(drop=True)
    for i in range(min_train, len(ordered)):
        train_ids = frozenset(ordered.loc[: i - 1, "match_id"].tolist())
        yield Split(
            train_ids=train_ids,
            test_id=int(ordered.loc[i, "match_id"]),
            test_row=ordered.loc[i],
        )


def actual_result(row: pd.Series) -> str:
    """The recorded outcome of a match, from team A's perspective."""
    if row["is_draw"]:
        return "DRAW"
    return "A" if row["score_a"] > row["score_b"] else "B"

def with_challenger(matches: pd.DataFrame) -> pd.DataFrame:
    """Label which team the challenging captain led.

    The winning captain retains captaincy, so the challenger is whichever
    captain did not win the previous match. Team A and B in the database
    reflect data entry order rather than draft position, so this has to be
    derived rather than read.

    Returns the frame with a `challenger_team` column: 'A', 'B', or None
    where it can't be determined (after a draw, or the first match of a season).
    """
    ordered = matches.sort_values("match_id").reset_index(drop=True)
    previous_winner = ordered["winner_id"].shift(1)

    challenger = []
    for i, row in ordered.iterrows():
        winner = previous_winner.iloc[i]
        if pd.isna(winner):
            challenger.append(None)
        elif row["captain_a_id"] == winner:
            challenger.append("B")
        elif row["captain_b_id"] == winner:
            challenger.append("A")
        else:
            challenger.append(None)

    ordered["challenger_team"] = challenger
    return ordered