"""
Data loader — SQL queries for loading match, player, and season data
from the PostgreSQL database into pandas DataFrames for use by the ML models.
"""

import pandas as pd
from sqlalchemy import create_engine, text

import os

DB_URL = os.getenv(
    "DATABASE_URL", "postgresql://mnf:mnf_local_password@localhost:5432/mnfmanager"
)

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DB_URL)
    return _engine


def load_all_players():
    """Load all players."""
    engine = get_engine()
    query = "SELECT id, name, position, active FROM players ORDER BY name"
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_team_compositions():
    """Load each match's team compositions with outcomes."""
    engine = get_engine()
    query = """
        SELECT
            m.id as match_id,
            mp.player_id,
            mp.team,
            CASE 
                WHEN m.is_draw THEN 'DRAW'
                WHEN (m.winner_id = m.captain_a_id AND mp.team = 'A') 
                  OR (m.winner_id = m.captain_b_id AND mp.team = 'B') 
                THEN 'WIN'
                ELSE 'LOSS'
            END as result
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        WHERE m.is_exhibition = false
        ORDER BY m.id, mp.player_id
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_match_compositions_with_scores():
    """
    Load team compositions with goals scored and conceded.
    Used by the impact model (ridge regression).
    """
    engine = get_engine()
    query = """
        SELECT
            m.id as match_id,
            mp.team,
            mp.player_id,
            CASE WHEN mp.team = 'A' THEN m.score_a ELSE m.score_b END as goals_for,
            CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END as goals_against
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        WHERE m.is_exhibition = false
        ORDER BY m.id, mp.team, mp.player_id
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_match_count():
    """Return the total number of competitive matches played."""
    engine = get_engine()
    query = "SELECT COUNT(*) FROM matches WHERE is_exhibition = false"
    with engine.connect() as conn:
        return conn.execute(text(query)).scalar()
