"""
Draft simulator — predicts captain pick preferences and recommends captains for the draft simulator.

Captain preferences are inferred from historical team co-occurrence:
a player appearing on a captain's team in 80% of matches is a near-certain
early pick. This works around the confidentiality of actual draft order.

Match outcome prediction uses the fitted ridge regression impact model
to estimate the score differential between two teams.
"""

import pandas as pd
from data.loader import load_captain_cooccurrence, load_all_players

def get_captain_preferences(captain_id: int, available_player_ids: list) -> list:
    """
    Given a captain and a pool of available players, return ranked pick
    recommendations based on historical co-occurrence.

    Returns list of dicts sorted by preference (highest first).
    """
    cooccurrence = load_captain_cooccurrence()
    all_players = load_all_players()

    captain_data = cooccurrence[cooccurrence["captain_id"] == captain_id].copy()

    available = captain_data[
        captain_data["player_id"].isin(available_player_ids)
    ].copy()

    # Players with no co-occurrence history get a neutral score
    seen_ids = set(available["player_id"].tolist())
    missing_ids = [pid for pid in available_player_ids if pid not in seen_ids]

    if missing_ids:
        missing_players = all_players[all_players["id"].isin(missing_ids)].copy()
        missing_players["captain_id"] = captain_id
        missing_players["captain_name"] = ""
        missing_players["player_id"] = missing_players["id"]
        missing_players["player_name"] = missing_players["name"]
        missing_players["appearances_together"] = 0
        missing_players["cooccurrence_rate"] = 0.0
        available = pd.concat(
            [available, missing_players[available.columns]], ignore_index=True
        )

    available = available.sort_values("cooccurrence_rate", ascending=False)

    return available[
        ["player_id", "player_name", "appearances_together", "cooccurrence_rate"]
    ].to_dict(orient="records")
