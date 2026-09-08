from flask import Blueprint, jsonify

predictions_bp = Blueprint('predictions', __name__)

@predictions_bp.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Predictions engine coming soon'})