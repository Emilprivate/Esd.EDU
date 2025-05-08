import os
import sys
import importlib
import subprocess
from flask import Blueprint, jsonify, request

# Create the Blueprint object
test_runner_bp = Blueprint('test_runner', __name__)

def find_test_modules():
    """Find all available test modules"""
    tests_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tests")
    available_tests = []

    # Find all test files
    for root, _, files in os.walk(tests_dir):
        for file in files:
            if file.startswith("test_") and file.endswith(".py"):
                rel_dir = os.path.relpath(root, os.path.dirname(os.path.dirname(__file__)))
                module_path = os.path.join(rel_dir, file[:-3]).replace(os.sep, ".")
                
                # Get test description
                description = get_test_description(module_path)
                
                # Categorize test based on directory structure
                category = "Unknown"
                if "integration_tests" in module_path:
                    if "basic_operations" in module_path:
                        category = "Physical Drone - Basic Operations"
                    elif "sequence_operations" in module_path:
                        category = "Physical Drone - Sequences"
                    else:
                        category = "Physical Drone - Other"
                elif "api_tests" in module_path:
                    if "test_endpoints" in module_path:
                        category = "API - Endpoints"
                    elif "test_controllers" in module_path:
                        category = "API - Controllers"
                    else:
                        category = "API - Other"
                
                # Get a user-friendly name
                name = get_friendly_test_name(file[5:-3], module_path)
                    
                available_tests.append({
                    "id": module_path,
                    "name": name,
                    "category": category,
                    "description": description,
                    "module_path": module_path,
                    "requires_drone": "Physical Drone" in category
                })

    # Sort tests by category and name
    return sorted(available_tests, key=lambda x: (x["category"], x["name"]))

def get_friendly_test_name(base_name, module_path):
    """Generate a user-friendly test name based on the file name and path"""
    name = base_name.replace("_", " ").title()
    
    # Add context based on the path
    if "basic_operations" in module_path:
        if "movement" in base_name:
            name = "Basic Movement Commands"
        elif "takeoff_land" in base_name:
            name = "Basic Takeoff & Landing"
    elif "sequence_operations" in module_path:
        if "flight_sequences" in base_name:
            name = "Complex Flight Sequences"
    elif "api_tests" in module_path:
        if "endpoints" in base_name:
            name = "API Endpoint Tests"
        elif "controllers" in base_name:
            name = "Controller Unit Tests"
    
    return name

def get_test_description(module_path):
    """Extract docstring from test module as description"""
    try:
        module = importlib.import_module(module_path)
        return module.__doc__ or "No description available"
    except:
        return "Unable to load test description"

@test_runner_bp.route('/list', methods=['GET'])
def list_tests():
    try:
        # Mock test data - replace with actual test discovery logic
        tests = [
            {
                "id": "test1",
                "name": "Basic Flight Test",
                "description": "Tests basic takeoff and landing"
            },
            {
                "id": "test2",
                "name": "Square Pattern Test",
                "description": "Tests flying in a square pattern"
            }
        ]
        return jsonify(tests)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@test_runner_bp.route('/run/<test_id>', methods=['POST'])
def run_test(test_id):
    try:
        # Mock test execution - replace with actual test running logic
        result = {
            "test_id": test_id,
            "status": "success",
            "message": f"Test {test_id} completed successfully"
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
