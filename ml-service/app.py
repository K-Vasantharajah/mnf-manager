from flask import Flask
from flask_cors import CORS
from routes.ratings import ratings_bp
from routes.predictions import predictions_bp
from routes.draft import draft_bp
from routes.chemistry import chemistry_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(ratings_bp, url_prefix='/api/ratings')
app.register_blueprint(predictions_bp, url_prefix='/api/predictions')
app.register_blueprint(draft_bp, url_prefix='/api/draft')
app.register_blueprint(chemistry_bp, url_prefix='/api/chemistry')

@app.route('/health')
def health():
    return {'status': 'ok', 'service': 'mnf-ml'}

if __name__ == '__main__':
    app.run(port=5000, debug=True)