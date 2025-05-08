from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from api_endpoints.main_operations import drone_bp
from api_endpoints.test_runner import test_runner_bp
from api_endpoints.basic_operations import basic_ops_bp
from api_endpoints.media_operations import media_ops_bp
from api_endpoints.sequence_operations import sequence_ops_bp
from api_endpoints.streaming_operations import streaming_ops_bp
from config import API_HOST, API_PORT
import os

# Create Flask app with templates directory
app = Flask(__name__, 
           template_folder=os.path.join(os.path.dirname(__file__), 'templates'))

# Configure CORS with more specific settings
CORS(app, resources={r"/*": {"origins": "*"}})

# Additional CORS handling middleware
@app.after_request
def after_request(response):
    # For streaming responses that may not get CORS headers properly
    if 'multipart/x-mixed-replace' in response.mimetype:
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response

# Register blueprints without /api prefix
app.register_blueprint(drone_bp, url_prefix='/drone')
app.register_blueprint(test_runner_bp, url_prefix='/tests')

# Register all blueprints
app.register_blueprint(basic_ops_bp, url_prefix='/api/basic')
app.register_blueprint(media_ops_bp, url_prefix='/api/media')
app.register_blueprint(sequence_ops_bp, url_prefix='/api/sequence')
app.register_blueprint(streaming_ops_bp, url_prefix='/api/streaming')

@app.route('/')
def index():
    return jsonify({
        "status": "running",
        "endpoints": {
            "streaming": "/api/streaming/stream",
            "basic_operations": "/api/basic",
            "media_operations": "/api/media",
            "sequence_operations": "/api/sequence"
        }
    })

if __name__ == '__main__':
    print(f"Starting Flask server at http://{API_HOST}:{API_PORT}")
    app.run(debug=True, host=API_HOST, port=API_PORT, threaded=True)
