from flask import Blueprint, jsonify, request
from controllers.main_controller import DroneController

sequence_ops_bp = Blueprint('sequence_operations', __name__)
drone_controller = DroneController()

@sequence_ops_bp.route('/test-flight', methods=['POST'])
def test_flight():
    try:
        result = drone_controller.takeoff_and_land()
        return jsonify({"success": result, "message": "Test flight executed"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@sequence_ops_bp.route('/square-flight', methods=['POST'])
def square_flight():
    try:
        data = request.json
        side_length = data.get('side_length', 1.0)
        
        result = drone_controller.square_flight(side_length)
        return jsonify({
            "success": result, 
            "message": f"Square flight with side length {side_length}m executed"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
