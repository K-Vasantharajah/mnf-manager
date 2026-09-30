"""
Candidate rating models, each fittable on a subset of matches.

Every model implements the same interface so the harness can compare them:

    model = SomeModel()
    model.fit(train_match_ids)
    model.predict(team_a_ids, team_b_ids)  -> (expected_a, expected_b)
    model.ratings()                        -> DataFrame[player_id, attack, defence]

Models must never look at matches outside the ids they were fitted on.
"""

from abc import ABC, abstractmethod

import numpy as np
import pandas as pd
from sqlalchemy import text

from data.loader import get_engine, load_all_players
from models.impact import fit_impact_model

# Average goals per team per match at MNF, used as the prediction baseline.
BASELINE_GOALS = 3.0


class RatingModel(ABC):
    name: str

    @abstractmethod
    def fit(self, match_ids: frozenset[int]) -> None: ...

    @abstractmethod
    def predict(self, team_a: list[int], team_b: list[int]) -> tuple[float, float]:
        """Expected goals for each team."""

    @abstractmethod
    def ratings(self) -> pd.DataFrame:
        """One row per player: player_id, attack, defence."""


class BaselineModel(RatingModel):
    """Predicts the average score for both teams, always a draw.

    Any model worth keeping must beat this. If it doesn't, the ratings are
    adding nothing beyond knowing the average MNF scoreline.
    """

    name = "baseline"

    def fit(self, match_ids: frozenset[int]) -> None:
        self._mean = BASELINE_GOALS

    def predict(self, team_a: list[int], team_b: list[int]) -> tuple[float, float]:
        return self._mean, self._mean

    def ratings(self) -> pd.DataFrame:
        return pd.DataFrame(columns=["player_id", "attack", "defence"])


class ImpactModel(RatingModel):
    """The current production model: ridge regression adjusted plus-minus."""

    name = "impact (current)"

    def fit(self, match_ids: frozenset[int]) -> None:
        impact = fit_impact_model(match_ids=set(match_ids))
        self._lookup = impact.set_index("player_id")[
            ["attack_impact", "defence_impact"]
        ].to_dict(orient="index")
        self._impact = impact

    def _strength(self, player_ids: list[int]) -> tuple[float, float]:
        attack = np.mean(
            [self._lookup.get(p, {}).get("attack_impact", 0.0) for p in player_ids]
        )
        defence = np.mean(
            [self._lookup.get(p, {}).get("defence_impact", 0.0) for p in player_ids]
        )
        return attack, defence

    def predict(self, team_a: list[int], team_b: list[int]) -> tuple[float, float]:
        a_att, a_def = self._strength(team_a)
        b_att, b_def = self._strength(team_b)
        return (
            max(0.0, BASELINE_GOALS + a_att - b_def),
            max(0.0, BASELINE_GOALS + b_att - a_def),
        )

    def ratings(self) -> pd.DataFrame:
        return self._impact.rename(
            columns={"attack_impact": "attack", "defence_impact": "defence"}
        )[["player_id", "attack", "defence"]]


def _load_player_match_stats(match_ids: frozenset[int]) -> pd.DataFrame:
    """Per-player totals over the given matches: appearances, goals, goals conceded, points."""
    query = """
        SELECT
            mp.player_id,
            COUNT(*) AS appearances,
            SUM(CASE WHEN mp.team = 'A' THEN m.score_a ELSE m.score_b END) AS goals_for,
            SUM(CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END) AS goals_against,
            SUM(
                CASE
                    WHEN m.is_draw THEN 1
                    WHEN (m.winner_id = m.captain_a_id AND mp.team = 'A')
                      OR (m.winner_id = m.captain_b_id AND mp.team = 'B') THEN 3
                    ELSE 0
                END
            ) AS points,
            COALESCE(SUM(gs.goals), 0) AS goals_scored
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        LEFT JOIN goal_scorers gs
               ON gs.match_id = mp.match_id
              AND gs.player_id = mp.player_id
              AND gs.is_own_goal = false
        WHERE mp.match_id = ANY(:ids)
        GROUP BY mp.player_id
    """
    with get_engine().connect() as conn:
        return pd.read_sql(text(query), conn, params={"ids": list(match_ids)})


class PositionPercentileModel(RatingModel):
    """Arif's approach: rank each player against others in their position group.

    Attack comes from goals per game, defence from goals conceded per game,
    both as percentiles within the player's position group. Points percentage
    contributes to both, since it reflects overall team success.
    """

    name = "position percentile"

    GROUPS = {
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

    def fit(self, match_ids: frozenset[int]) -> None:
        stats = _load_player_match_stats(match_ids)
        players = load_all_players()
        stats = stats.merge(
            players[["id", "position"]], left_on="player_id", right_on="id", how="left"
        )
        stats["group"] = stats["position"].map(self.GROUPS).fillna("MID")

        stats["goals_per_game"] = stats["goals_scored"] / stats["appearances"]
        stats["conceded_per_game"] = stats["goals_against"] / stats["appearances"]
        stats["points_pct"] = stats["points"] / (stats["appearances"] * 3)

        # Percentile within position group; conceding fewer is better, so invert
        def pct(series):
            return series.rank(pct=True)

        stats["goals_pct"] = stats.groupby("group")["goals_per_game"].transform(pct)
        stats["conceded_pct"] = 1 - stats.groupby("group")[
            "conceded_per_game"
        ].transform(pct)
        stats["points_rank"] = stats.groupby("group")["points_pct"].transform(pct)

        stats["attack"] = 0.6 * stats["goals_pct"] + 0.4 * stats["points_rank"]
        stats["defence"] = 0.6 * stats["conceded_pct"] + 0.4 * stats["points_rank"]

        self._stats = stats
        self._lookup = stats.set_index("player_id")[["attack", "defence"]].to_dict(
            orient="index"
        )

    def _strength(self, player_ids: list[int]) -> tuple[float, float]:
        # Percentiles centre on 0.5, so subtract it to get a signed contribution
        attack = np.mean(
            [self._lookup.get(p, {}).get("attack", 0.5) - 0.5 for p in player_ids]
        )
        defence = np.mean(
            [self._lookup.get(p, {}).get("defence", 0.5) - 0.5 for p in player_ids]
        )
        return attack, defence

    def predict(self, team_a: list[int], team_b: list[int]) -> tuple[float, float]:
        a_att, a_def = self._strength(team_a)
        b_att, b_def = self._strength(team_b)
        # Scale factor converts percentile differences to a goals-like range
        scale = 4.0
        return (
            max(0.0, BASELINE_GOALS + scale * (a_att - b_def)),
            max(0.0, BASELINE_GOALS + scale * (b_att - a_def)),
        )

    def ratings(self) -> pd.DataFrame:
        return self._stats[["player_id", "attack", "defence"]]


class ChallengerModel(RatingModel):
    """Predicts the challenging captain's team wins.

    The challenger picks first, so if first pick is a real advantage this
    should beat the draw baseline. Any rating model needs to beat this before
    its ratings can claim to be measuring players rather than draft position.
    """

    name = "challenger wins"

    def fit(self, match_ids: frozenset[int]) -> None:
        pass

    def predict_with_context(self, challenger_team: str | None) -> tuple[float, float]:
        if challenger_team == "A":
            return BASELINE_GOALS + 1.0, BASELINE_GOALS
        if challenger_team == "B":
            return BASELINE_GOALS, BASELINE_GOALS + 1.0
        return BASELINE_GOALS, BASELINE_GOALS

    def predict(self, team_a: list[int], team_b: list[int]) -> tuple[float, float]:
        return BASELINE_GOALS, BASELINE_GOALS

    def ratings(self) -> pd.DataFrame:
        return pd.DataFrame(columns=["player_id", "attack", "defence"])


CANDIDATES = [BaselineModel, ChallengerModel, ImpactModel, PositionPercentileModel]
