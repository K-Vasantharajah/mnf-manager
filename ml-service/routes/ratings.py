from flask import Blueprint, jsonify
from models.ratings import calculate_derived_ratings

ratings_bp = Blueprint('ratings', __name__)

@ratings_bp.route('/', methods=['GET'])
def get_ratings():
    """Get derived ratings for all players."""
    try:
        df = calculate_derived_ratings()
        ratings = df.to_dict(orient='records')
        return jsonify({
            'status': 'success',
            'count': len(ratings),
            'ratings': ratings
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@ratings_bp.route('/player/<int:player_id>', methods=['GET'])
def get_player_rating(player_id):
    """Get derived rating for a specific player."""
    try:
        df = calculate_derived_ratings()
        player = df[df['player_id'] == player_id]
        if player.empty:
            return jsonify({'status': 'error', 'message': 'Player not found'}), 404
        return jsonify({
            'status': 'success',
            'rating': player.to_dict(orient='records')[0]
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500