from flask import Blueprint
from .basic_operations import basic_ops_bp
from .sequence_operations import sequence_ops_bp
from .media_operations import media_ops_bp

drone_bp = Blueprint('drone', __name__)

# Make sure these prefixes match what the frontend expects
drone_bp.register_blueprint(basic_ops_bp, url_prefix='/basic')
drone_bp.register_blueprint(sequence_ops_bp, url_prefix='/sequence')
drone_bp.register_blueprint(media_ops_bp, url_prefix='/media')
