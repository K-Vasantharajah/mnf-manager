"""
Draft routes — captain preference recommendations, match outcome prediction,
and captain rotation suggestions for the draft simulator.
"""

from flask import Blueprint, jsonify, request
from models.draft import get_captain_preferences, predict_match_outcome
from data.loader import load_captain_history, load_all_players

draft_bp = Blueprint("draft", __name__)


@draft_bp.route("/preferences/<int:captain_id>", methods=["POST"])
def captain_preferences(captain_id):
    """
    Get ranked player preferences for a captain given available players.

    Body: { "availablePlayerIds": [1, 2, 3, ...] }
    """
    try:
        data = request.get_json()
        available_ids = data.get("availablePlayerIds", [])

        if not isinstance(available_ids, list) or not all(
            isinstance(i, int) for i in available_ids
        ):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "availablePlayerIds must be a list of integers",
                    }
                ),
                400,
            )

        if not available_ids:
            return (
                jsonify(
                    {"status": "error", "message": "No available players provided"}
                ),
                400,
            )

        preferences = get_captain_preferences(captain_id, available_ids)
        return jsonify(
            {"status": "success", "captainId": captain_id, "preferences": preferences}
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@draft_bp.route("/predict", methods=["POST"])
def predict():
    """
    Predict match outcome given two team compositions.

    Body: { "teamAIds": [1, 2, ...], "teamBIds": [3, 4, ...] }
    """
    try:
        data = request.get_json()
        team_a = data.get("teamAIds", [])
        team_b = data.get("teamBIds", [])

        if not isinstance(team_a, list) or not isinstance(team_b, list):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "teamAIds and teamBIds must be lists",
                    }
                ),
                400,
            )

        if not team_a or not team_b:
            return jsonify({"status": "error", "message": "Both teams required"}), 400

        prediction = predict_match_outcome(team_a, team_b)
        return jsonify({"status": "success", "prediction": prediction})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@draft_bp.route("/captain-recommendations", methods=["POST"])
def captain_recommendations():
    """
    Recommend captains from available squad ordered by:
    1. Never captained this season
    2. Captained least recently this season

    Body: { "availablePlayerIds": [1, 2, 3, ...] }
    """
    try:
        data = request.get_json()
        available_ids = data.get("availablePlayerIds", [])

        if not isinstance(available_ids, list) or not all(
            isinstance(i, int) for i in available_ids
        ):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "availablePlayerIds must be a list of integers",
                    }
                ),
                400,
            )

        captain_history = load_captain_history()
        all_players = load_all_players()

        available_players = all_players[all_players["id"].isin(available_ids)].copy()

        # Merge with captain history
        result = available_players.merge(
            captain_history[
                ["player_id", "times_captained_this_season", "last_match_id_captained"]
            ],
            left_on="id",
            right_on="player_id",
            how="left",
        )

        # Fill NaN — players who haven't captained this season
        result["times_captained_this_season"] = result[
            "times_captained_this_season"
        ].fillna(0)
        result["last_match_id_captained"] = result["last_match_id_captained"].fillna(0)

        # Sort: never captained first, then least recently
        result = result.sort_values(
            ["times_captained_this_season", "last_match_id_captained"],
            ascending=[True, True],
        )

        return jsonify(
            {
                "status": "success",
                "recommendations": result[
                    [
                        "id",
                        "name",
                        "position",
                        "times_captained_this_season",
                        "last_match_id_captained",
                    ]
                ]
                .rename(columns={"id": "player_id"})
                .to_dict(orient="records"),
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
