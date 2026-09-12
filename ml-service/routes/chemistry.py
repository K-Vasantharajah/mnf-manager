from flask import Blueprint, jsonify, request
from models.chemistry import calculate_chemistry, get_player_chemistry

chemistry_bp = Blueprint('chemistry', __name__)

@chemistry_bp.route('/', methods=['GET'])
def all_chemistry():
    """Get top chemistry pairs across all players."""
    try:
        df = calculate_chemistry()
        if df.empty:
            return jsonify({'status': 'success', 'pairs': []})
        
        top = df.head(20).to_dict(orient='records')
        bottom = df.tail(10).to_dict(orient='records')
        
        return jsonify({
            'status': 'success',
            'best_pairs': top,
            'worst_pairs': bottom,
            'total_pairs': len(df)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@chemistry_bp.route('/player/<int:player_id>', methods=['GET'])
def player_chemistry(player_id):
    """Get chemistry scores for a specific player."""
    try:
        pairs = get_player_chemistry(player_id)
        return jsonify({
            'status': 'success',
            'player_id': player_id,
            'pairs': pairs
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@chemistry_bp.route('/team', methods=['POST'])
def team_chemistry():
    """
    Calculate average chemistry score for a set of players.
    Body: { "playerIds": [1, 2, 3, ...] }
    """
    try:
        data = request.get_json()
        player_ids = data.get('playerIds', [])
        
        if len(player_ids) < 2:
            return jsonify({'status': 'error', 'message': 'Need at least 2 players'}), 400

        df = calculate_chemistry()
        if df.empty:
            return jsonify({'status': 'success', 'teamChemistryScore': 0, 'pairs': []})

        # Filter pairs where both players are in the team
        team_pairs = df[
            df['player_a'].isin(player_ids) & df['player_b'].isin(player_ids)
        ]

        avg_chemistry = team_pairs['chemistry_score'].mean() if not team_pairs.empty else 0

        return jsonify({
            'status': 'success',
            'teamChemistryScore': round(float(avg_chemistry), 1),
            'pairsAnalysed': len(team_pairs),
            'pairs': team_pairs.to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500