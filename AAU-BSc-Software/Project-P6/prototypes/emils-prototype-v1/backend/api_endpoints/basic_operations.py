from flask import Blueprint, jsonify, request
from controllers.main_controller import DroneController

basic_ops_bp = Blueprint('basic_operations', __name__)
drone_controller = DroneController()

@basic_ops_bp.route('/takeoff', methods=['POST'])
def takeoff():
    try:
        result = drone_controller.takeoff()
        return jsonify({"success": result, "message": "Takeoff command executed"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@basic_ops_bp.route('/land', methods=['POST'])
def land():
    try:
        result = drone_controller.land()
        return jsonify({"success": result, "message": "Landing command executed"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@basic_ops_bp.route('/move', methods=['POST'])
def move():
    try:
        data = request.json
        x = data.get('x', 0)
        y = data.get('y', 0)
        z = data.get('z', 0)
        angle = data.get('angle', 0)
        
        result = drone_controller.move_by(x, y, z, angle)
        return jsonify({"success": result, "message": "Move command executed"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
