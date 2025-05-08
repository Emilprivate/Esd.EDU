from flask import Blueprint, jsonify, request
from controllers.media_controller import MediaDroneController
import logging

logger = logging.getLogger(__name__)
media_ops_bp = Blueprint('media_operations', __name__)
media_controller = MediaDroneController()

@media_ops_bp.route('/media-info', methods=['GET'])
def get_media_info():
    try:
        media_id = request.args.get('media_id', None)
        logger.debug(f"Received request for media-info with media_id: {media_id}")
        
        # Handle case where drone might not be accessible
        result = media_controller.get_media_info(media_id)
        
        if result is None or (isinstance(result, list) and len(result) == 0):
            return jsonify({
                "success": True,
                "data": [],
                "message": "No media found"
            })
            
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        logger.error(f"Error in get_media_info endpoint: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "message": f"Failed to get media info: {str(e)}",
            "error_type": type(e).__name__
        }), 500

@media_ops_bp.route('/resource-info', methods=['GET'])
def get_resource_info():
    try:
        media_id = request.args.get('media_id', None)
        resource_id = request.args.get('resource_id', None)
        result = media_controller.get_resource_info(media_id, resource_id)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
