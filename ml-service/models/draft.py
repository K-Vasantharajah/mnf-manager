"""
Draft simulator support: how often each available player has been on a
captain's team.

This describes past drafts, not preferences. Early picks follow a fairly fixed
order, so a captain's record with the top players mostly reflects how often
they picked first, and late picks split roughly evenly between sides.
"""

from data.loader import load_all_players, load_captain_cooccurrence

# Captaincies needed with a player available before a rate is shown.
# Below this, counts only.
MIN_CAPTAINCIES_WITH_PLAYER = 5


def get_captain_preferences(captain_id: int, available_player_ids: list) -> list:
    """How often each available player has been on this captain's team.

    Players with enough captaincies come first, ordered by rate; the rest
    follow, ordered by how many captaincies they've been available for.
    """
    history = load_captain_cooccurrence(captain_id).set_index("player_id")
    names = load_all_players().set_index("id")["name"]

    rows = []
    for player_id in available_player_ids:
        if player_id in history.index:
            captaincies = int(history.at[player_id, "captaincies_with_player"])
            picked = int(history.at[player_id, "picked_for_captain"])
        else:
            captaincies = picked = 0

        rate = (
            round(picked / captaincies * 100, 1)
            if captaincies >= MIN_CAPTAINCIES_WITH_PLAYER
            else None
        )

        rows.append(
            {
                "player_id": player_id,
                "player_name": names.get(player_id, ""),
                "picked_for_captain": picked,
                "captaincies_with_player": captaincies,
                "together_rate": rate,
            }
        )

    rows.sort(
        key=lambda r: (
            r["together_rate"] is None,
            -(r["together_rate"] or 0),
            -r["captaincies_with_player"],
        )
    )
    return rows
