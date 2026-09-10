from flask import Blueprint, jsonify, request
from models.draft import get_captain_preferences, predict_match_outcome

draft_bp = Blueprint('draft', __name__)

@draft_bp.route('/preferences/<int:captain_id>', methods=['POST'])
def captain_preferences(captain_id):
    """
    Get ranked player preferences for a captain given available players.
    
    Body: { "availablePlayerIds": [1, 2, 3, ...] }
    """
    try:
        data = request.get_json()
        available_ids = data.get('availablePlayerIds', [])
        
        if not available_ids:
            return jsonify({'status': 'error', 'message': 'No available players provided'}), 400

        preferences = get_captain_preferences(captain_id, available_ids)
        return jsonify({
            'status': 'success',
            'captainId': captain_id,
            'preferences': preferences
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@draft_bp.route('/predict', methods=['POST'])
def predict():
    """
    Predict match outcome given two team compositions.
    
    Body: { "teamAIds": [1, 2, ...], "teamBIds": [3, 4, ...] }
    """
    try:
        data = request.get_json()
        team_a = data.get('teamAIds', [])
        team_b = data.get('teamBIds', [])

        if not team_a or not team_b:
            return jsonify({'status': 'error', 'message': 'Both teams required'}), 400

        prediction = predict_match_outcome(team_a, team_b)
        return jsonify({
            'status': 'success',
            'prediction': prediction
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500