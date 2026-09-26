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


def load_player_stats():
    """Load all player season stats with player info."""
    engine = get_engine()
    query = """
        SELECT 
            p.id as player_id,
            p.name,
            p.position,
            p.active,
            ps.season_year,
            ps.matches_played,
            ps.wins,
            ps.draws,
            ps.losses,
            ps.goals,
            ps.assists,
            CASE WHEN ps.matches_played > 0 
                THEN ROUND((ps.wins * 3.0 + ps.draws) / (ps.matches_played * 3.0) * 100, 1)
                ELSE 0 END as points_percentage,
            CASE WHEN ps.matches_played > 0 
                THEN ROUND(ps.goals::numeric / ps.matches_played, 2)
                ELSE 0 END as goals_per_game
        FROM players p
        JOIN player_season_stats ps ON ps.player_id = p.id
        ORDER BY p.name, ps.season_year
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_match_data():
    """Load all match data with player participation."""
    engine = get_engine()
    query = """
        SELECT 
            m.id as match_id,
            m.game_week,
            m.season_year,
            m.is_exhibition,
            m.score_a,
            m.score_b,
            m.is_draw,
            m.captain_a_id,
            m.captain_b_id,
            m.winner_id,
            mp.player_id,
            mp.team,
            COALESCE(gs.goals, 0) as goals_scored,
            COALESCE(gs.is_own_goal, false) as is_own_goal
        FROM matches m
        JOIN match_players mp ON mp.match_id = m.id
        LEFT JOIN goal_scorers gs ON gs.match_id = m.id 
            AND gs.player_id = mp.player_id
            AND gs.is_own_goal = false
        WHERE m.is_exhibition = false
        ORDER BY m.id, mp.player_id
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_all_players():
    """Load all players."""
    engine = get_engine()
    query = "SELECT id, name, position, active FROM players ORDER BY name"
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_defensive_stats():
    """Calculate goals conceded per player when defending."""
    engine = get_engine()
    query = """
        SELECT 
            mp.player_id,
            m.season_year,
            COUNT(*) as matches_defended,
            SUM(CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END) as goals_conceded,
            ROUND(
                SUM(CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END)::numeric / 
                COUNT(*), 2
            ) as goals_conceded_per_game
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        WHERE m.is_exhibition = false
        GROUP BY mp.player_id, m.season_year
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_captain_cooccurrence():
    """
    For each captain, calculate how often each player appears on their team.
    Returns co-occurrence rates: appearances_together / matches_captained
    """
    engine = get_engine()
    query = """
        SELECT 
            ca.id as captain_id,
            ca.name as captain_name,
            p.id as player_id,
            p.name as player_name,
            COUNT(*) as appearances_together,
            COUNT(*) * 100.0 / total.total_matches as cooccurrence_rate
        FROM matches m
        JOIN players ca ON ca.id = m.captain_a_id OR ca.id = m.captain_b_id
        JOIN match_players mp ON mp.match_id = m.id
        JOIN players p ON p.id = mp.player_id
        JOIN (
            SELECT 
                c.id as captain_id,
                COUNT(*) as total_matches
            FROM matches m2
            JOIN players c ON c.id = m2.captain_a_id OR c.id = m2.captain_b_id
            WHERE m2.is_exhibition = false
            GROUP BY c.id
        ) total ON total.captain_id = ca.id
        WHERE m.is_exhibition = false
        AND mp.player_id != ca.id
        AND (
            (m.captain_a_id = ca.id AND mp.team = 'A') OR
            (m.captain_b_id = ca.id AND mp.team = 'B')
        )
        GROUP BY ca.id, ca.name, p.id, p.name, total.total_matches
        ORDER BY ca.name, cooccurrence_rate DESC
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn)


def load_captain_history():
    """
    Returns each player's captaincy history - last match captained and total times captained this season.
    """
    engine = get_engine()
    current_year = pd.Timestamp.now().year
    query = """
        SELECT 
            p.id as player_id,
            p.name,
            COUNT(*) as times_captained_this_season,
            MAX(m.id) as last_match_id_captained
        FROM players p
        JOIN matches m ON m.captain_a_id = p.id OR m.captain_b_id = p.id
        WHERE m.is_exhibition = false
        AND m.season_year = :current_year
        GROUP BY p.id, p.name
        ORDER BY last_match_id_captained DESC
    """
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn, params={"current_year": current_year})


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
