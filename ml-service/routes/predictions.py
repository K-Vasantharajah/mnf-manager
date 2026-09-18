"""
Predictions routes — exposes ML-derived player ratings and model diagnostics.
"""

from flask import Blueprint, jsonify
from models.ratings import calculate_derived_ratings

predictions_bp = Blueprint('predictions', __name__)


@predictions_bp.route('/health', methods=['GET'])
def health():
    """Health check for the predictions engine."""
    return jsonify({'status': 'ok'})


@predictions_bp.route('/ratings', methods=['GET'])
def ratings():
    """Return current ML-derived ratings for all rateable players."""
    try:
        df = calculate_derived_ratings()
        return jsonify({
            'status': 'success',
            'ratings': df[[
                'player_id', 'name', 'position', 'active', 'appearances',
                'attack_rating', 'defence_rating', 'overall_rating', 'reliability_rating'
            ]].to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500