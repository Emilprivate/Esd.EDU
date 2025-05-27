import numpy as np
from typing import List, Tuple, Dict
import math
import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

class DroneCamera:
    """Class representing the drone's camera specifications"""
    def __init__(self):
        # Using the rectilinear lens specs: 16MP (4608x3456) / 4:3 / 75.5° HFOV
        self.resolution_width = 4608  # pixels
        self.resolution_height = 3456  # pixels
        self.hfov = 75.5  # horizontal field of view in degrees
        self.aspect_ratio = self.resolution_width / self.resolution_height
        # Calculate vertical FOV based on horizontal FOV and aspect ratio
        self.vfov = 2 * math.atan(math.tan(math.radians(self.hfov) / 2) / self.aspect_ratio)
        self.vfov = math.degrees(self.vfov)

    def get_ground_coverage(self, altitude: float) -> Tuple[float, float]:
        """
        Calculate the ground coverage dimensions at a given altitude
        
        Args:
            altitude: Flight altitude in meters
            
        Returns:
            Tuple of (width, height) in meters covered by the camera
        """
        # Calculate the width and height of the ground area covered by the camera
        width = 2 * altitude * math.tan(math.radians(self.hfov / 2))
        height = 2 * altitude * math.tan(math.radians(self.vfov / 2))
        return width, height

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth
    
    Args:
        lat1, lon1: Latitude and longitude of point 1 in decimal degrees
        lat2, lon2: Latitude and longitude of point 2 in decimal degrees
        
    Returns:
        Distance in meters
    """
    # Earth's radius in meters
    R = 6371000
    
    # Convert decimal degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def latlon_to_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> Tuple[float, float]:
    """
    Convert the difference in lat/lon to distances in meters
    
    Args:
        lat1, lon1: Reference latitude and longitude
        lat2, lon2: Target latitude and longitude
        
    Returns:
        x, y: Distances in meters (east-west, north-south)
    """
    # Distance in the north-south direction
    y = haversine_distance(lat1, lon1, lat2, lon1)
    if lat2 < lat1:
        y = -y
        
    # Distance in the east-west direction
    x = haversine_distance(lat1, lon1, lat1, lon2)
    if lon2 < lon1:
        x = -x
        
    return x, y

def meters_to_latlon(lat_ref: float, lon_ref: float, x_meters: float, y_meters: float) -> Tuple[float, float]:
    """
    Convert meters offsets to latitude and longitude
    
    Args:
        lat_ref, lon_ref: Reference latitude and longitude
        x_meters, y_meters: Distances in meters (east-west, north-south)
        
    Returns:
        lat, lon: Resulting latitude and longitude
    """
    # Earth's radius in meters
    R = 6371000
    
    # Convert latitude offset
    lat = lat_ref + math.degrees(y_meters / R)
    
    # Convert longitude offset, accounting for latitude
    lon = lon_ref + math.degrees(x_meters / (R * math.cos(math.radians(lat_ref))))
    
    return lat, lon

def generate_flight_path(coordinates: List[Tuple[float, float]], altitude: float, overlap_percent: float = 20) -> List[Dict]:
    """
    Generate an optimized flight path with waypoints for image capture
    
    Args:
        coordinates: List of (latitude, longitude) coordinates defining the area to cover
        altitude: Flight altitude in meters
        overlap_percent: Desired image overlap percentage
        
    Returns:
        List of waypoints as dictionaries with lat, lon, alt, and action
    """
    # Initialize the drone camera
    camera = DroneCamera()
    
    # Calculate the ground coverage at the specified altitude
    width_coverage, height_coverage = camera.get_ground_coverage(altitude)
    
    # Calculate step sizes based on overlap
    step_width = width_coverage * (1 - overlap_percent / 100)
    step_height = height_coverage * (1 - overlap_percent / 100)
    
    # Find the bounding box of the polygon
    lats = [coord[0] for coord in coordinates]
    lons = [coord[1] for coord in coordinates]
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    
    # Calculate the centroid of the polygon
    centroid_lat = sum(lats) / len(lats)
    centroid_lon = sum(lons) / len(lons)
    
    # Calculate the principal axis of the polygon to align flight lines
    # This helps optimize flight direction based on polygon shape
    cov_matrix = np.cov(lats, lons)
    eigenvalues, eigenvectors = np.linalg.eig(cov_matrix)
    principal_axis = eigenvectors[:, np.argmax(eigenvalues)]
    
    # Calculate rotation angle to align with principal axis
    rotation_angle = math.atan2(principal_axis[1], principal_axis[0])
    
    # Use the minimum coordinates as a reference point
    ref_lat, ref_lon = min_lat, min_lon
    
    # Calculate the width and height of the bounding box in meters
    width_meters, _ = latlon_to_meters(ref_lat, ref_lon, ref_lat, max_lon)
    _, height_meters = latlon_to_meters(ref_lat, ref_lon, max_lat, ref_lon)
    
    # Add a minimal buffer zone around the polygon
    # Using a smaller, adaptive buffer based on polygon size
    buffer_distance = min(step_width, step_height) * 0.3
    
    # Expand the bounding box to ensure full coverage
    width_meters += buffer_distance * 2
    height_meters += buffer_distance * 2
    
    # Recalculate number of rows and columns
    num_cols = math.ceil(width_meters / step_width)
    num_rows = math.ceil(height_meters / step_height)
    
    # Offset the reference point by the buffer distance
    ref_lat, ref_lon = meters_to_latlon(ref_lat, ref_lon, -buffer_distance, -buffer_distance)
    
    # Initialize empty waypoints list
    waypoints = []
    
    # Determine if we should rotate the grid based on polygon shape
    use_rotated_grid = abs(rotation_angle) > math.pi/8 and abs(rotation_angle) < 7*math.pi/8
    
    # Compute the rotated coordinates if needed
    rotated_coordinates = []
    if use_rotated_grid:
        # Rotate polygon coordinates around centroid
        for lat, lon in coordinates:
            x, y = latlon_to_meters(centroid_lat, centroid_lon, lat, lon)
            # Apply rotation
            x_rot = x * math.cos(-rotation_angle) - y * math.sin(-rotation_angle)
            y_rot = x * math.sin(-rotation_angle) + y * math.cos(-rotation_angle)
            lat_rot, lon_rot = meters_to_latlon(centroid_lat, centroid_lon, x_rot, y_rot)
            rotated_coordinates.append((lat_rot, lon_rot))
        
        # Recalculate bounding box of rotated polygon
        rot_lats = [coord[0] for coord in rotated_coordinates]
        rot_lons = [coord[1] for coord in rotated_coordinates]
        rot_min_lat, rot_max_lat = min(rot_lats), max(rot_lats)
        rot_min_lon, rot_max_lon = min(rot_lons), max(rot_lons)
        
        # Update reference point
        ref_lat, ref_lon = rot_min_lat, rot_min_lon
        
        # Recalculate width and height
        width_meters, _ = latlon_to_meters(ref_lat, ref_lon, ref_lat, rot_max_lon)
        _, height_meters = latlon_to_meters(ref_lat, ref_lon, rot_max_lat, ref_lon)
        
        # Add buffer
        width_meters += buffer_distance * 2
        height_meters += buffer_distance * 2
        
        # Recalculate grid dimensions
        num_cols = math.ceil(width_meters / step_width)
        num_rows = math.ceil(height_meters / step_height)
        
        # Offset reference point
        ref_lat, ref_lon = meters_to_latlon(ref_lat, ref_lon, -buffer_distance, -buffer_distance)
    
    # Adaptive zigzag pattern based on polygon shape
    # Determine which dimension is longer to minimize turns
    if width_meters > height_meters:
        # Fly along the longer dimension (horizontal)
        for row in range(num_rows):
            row_y = row * step_height
            
            # Alternate direction for each row
            if row % 2 == 0:
                col_range = range(num_cols)
            else:
                col_range = range(num_cols - 1, -1, -1)
                
            for col in col_range:
                col_x = col * step_width
                
                # Convert from meters offset to lat/lon
                lat, lon = meters_to_latlon(ref_lat, ref_lon, col_x, row_y)
                
                # If using rotated grid, rotate point back
                if use_rotated_grid:
                    x, y = latlon_to_meters(centroid_lat, centroid_lon, lat, lon)
                    # Apply inverse rotation
                    x_orig = x * math.cos(rotation_angle) - y * math.sin(rotation_angle)
                    y_orig = x * math.sin(rotation_angle) + y * math.cos(rotation_angle)
                    lat, lon = meters_to_latlon(centroid_lat, centroid_lon, x_orig, y_orig)
                
                # Check if point is inside or near polygon
                is_inside = point_in_polygon((lat, lon), coordinates)
                
                # Use a more efficient proximity check for edge points
                include_point = is_inside
                
                if not is_inside:
                    # Check distance to polygon edges more efficiently
                    min_distance = float('inf')
                    for i in range(len(coordinates)):
                        p1 = coordinates[i]
                        p2 = coordinates[(i + 1) % len(coordinates)]
                        
                        # Calculate distance to line segment
                        dist = point_to_line_distance((lat, lon), p1, p2)
                        min_distance = min(min_distance, dist)
                    
                    # Include point if it's close to an edge (within half a step)
                    include_point = min_distance < min(step_width, step_height) / 2
                
                if include_point:
                    waypoint = {
                        "lat": lat,
                        "lon": lon,
                        "alt": altitude,
                        "action": "take_photo"
                    }
                    waypoints.append(waypoint)
    else:
        # Fly along the longer dimension (vertical)
        for col in range(num_cols):
            col_x = col * step_width
            
            # Alternate direction for each column
            if col % 2 == 0:
                row_range = range(num_rows)
            else:
                row_range = range(num_rows - 1, -1, -1)
                
            for row in row_range:
                row_y = row * step_height
                
                # Convert from meters offset to lat/lon
                lat, lon = meters_to_latlon(ref_lat, ref_lon, col_x, row_y)
                
                # If using rotated grid, rotate point back
                if use_rotated_grid:
                    x, y = latlon_to_meters(centroid_lat, centroid_lon, lat, lon)
                    # Apply inverse rotation
                    x_orig = x * math.cos(rotation_angle) - y * math.sin(rotation_angle)
                    y_orig = x * math.sin(rotation_angle) + y * math.cos(rotation_angle)
                    lat, lon = meters_to_latlon(centroid_lat, centroid_lon, x_orig, y_orig)
                
                # Check if point is inside or near polygon
                is_inside = point_in_polygon((lat, lon), coordinates)
                
                # Use a more efficient proximity check for edge points
                include_point = is_inside
                
                if not is_inside:
                    # Check distance to polygon edges more efficiently
                    min_distance = float('inf')
                    for i in range(len(coordinates)):
                        p1 = coordinates[i]
                        p2 = coordinates[(i + 1) % len(coordinates)]
                        
                        # Calculate distance to line segment
                        dist = point_to_line_distance((lat, lon), p1, p2)
                        min_distance = min(min_distance, dist)
                    
                    # Include point if it's close to an edge (within half a step)
                    include_point = min_distance < min(step_width, step_height) / 2
                
                if include_point:
                    waypoint = {
                        "lat": lat,
                        "lon": lon,
                        "alt": altitude,
                        "action": "take_photo"
                    }
                    waypoints.append(waypoint)
    
    return waypoints

def point_to_line_distance(point: Tuple[float, float], line_start: Tuple[float, float], line_end: Tuple[float, float]) -> float:
    """
    Calculate the distance from a point to a line segment
    
    Args:
        point: (latitude, longitude) tuple
        line_start: (latitude, longitude) tuple of line segment start
        line_end: (latitude, longitude) tuple of line segment end
        
    Returns:
        Distance in meters
    """
    # Convert to meters for accurate distance calculation
    px, py = latlon_to_meters(line_start[0], line_start[1], point[0], point[1])
    lx1, ly1 = 0, 0  # line_start is our reference point
    lx2, ly2 = latlon_to_meters(line_start[0], line_start[1], line_end[0], line_end[1])
    
    # Calculate line length squared
    line_length_sq = (lx2 - lx1)**2 + (ly2 - ly1)**2
    
    # If line is a point, return distance to that point
    if line_length_sq == 0:
        return math.sqrt(px**2 + py**2)
    
    # Calculate projection of point onto line
    t = max(0, min(1, ((px - lx1) * (lx2 - lx1) + (py - ly1) * (ly2 - ly1)) / line_length_sq))
    
    # Calculate closest point on line
    proj_x = lx1 + t * (lx2 - lx1)
    proj_y = ly1 + t * (ly2 - ly1)
    
    # Return distance to closest point
    return math.sqrt((px - proj_x)**2 + (py - proj_y)**2)


def point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """
    Check if a point is inside a polygon using ray casting algorithm
    
    Args:
        point: (latitude, longitude) tuple
        polygon: List of (latitude, longitude) tuples defining the polygon
        
    Returns:
        True if the point is inside the polygon, False otherwise
    """
    x, y = point
    n = len(polygon)
    inside = False
    
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    
    return inside

def plan_flight(coordinates: List[Tuple[float, float]], altitude: float) -> List[Dict]:
    """
    Main function to plan a flight with default parameters
    
    Args:
        coordinates: List of (latitude, longitude) coordinates
        altitude: Flight altitude in meters
        
    Returns:
        Flight path as a list of waypoints
    """
    return generate_flight_path(coordinates, altitude, overlap_percent=20)

def save_waypoints_to_json(waypoints: List[Dict], filename: str = None) -> str:
    """
    Save waypoints to a JSON file
    
    Args:
        waypoints: List of waypoint dictionaries
        filename: Optional filename, if None generates a timestamped name
        
    Returns:
        Path to the saved file
    """
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "flight_plans")
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename if not provided
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"flight_plan_{timestamp}.json"
    
    # Ensure .json extension
    if not filename.endswith(".json"):
        filename += ".json"
    
    filepath = os.path.join(output_dir, filename)
    
    # Create flight plan with metadata
    flight_plan = {
        "metadata": {
            "waypoint_count": len(waypoints),
            "created_at": datetime.now().isoformat(),
            "altitude": waypoints[0]["alt"] if waypoints else None,
        },
        "waypoints": waypoints
    }
    
    # Write to file
    with open(filepath, 'w') as f:
        json.dump(flight_plan, f, indent=2)
    
    return filepath

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/plan-flight', methods=['POST'])
def api_plan_flight():
    """API endpoint for flight planning"""
    try:
        data = request.get_json()
        
        # Validate input data
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        if 'coordinates' not in data or 'altitude' not in data:
            return jsonify({"error": "Missing required parameters 'coordinates' or 'altitude'"}), 400
            
        coordinates = data['coordinates']
        altitude = data['altitude']
        
        # Validate coordinates
        if not isinstance(coordinates, list) or len(coordinates) < 3:
            return jsonify({"error": "Coordinates must be a list with at least 3 points"}), 400
        
        for point in coordinates:
            if not isinstance(point, list) or len(point) != 2:
                return jsonify({"error": "Each coordinate must be a [lat, lon] pair"}), 400
        
        # Convert to expected format (list of tuples)
        coordinates = [tuple(point) for point in coordinates]
        
        # Validate altitude
        if not isinstance(altitude, (int, float)) or altitude <= 0:
            return jsonify({"error": "Altitude must be a positive number"}), 400
            
        # Optional parameter
        overlap = data.get('overlap', 20)  # Default to 20% if not specified
        
        # Generate flight path
        flight_path = generate_flight_path(coordinates, altitude, overlap_percent=overlap)
        
        # Return the flight path
        return jsonify({
            "metadata": {
                "waypoint_count": len(flight_path),
                "created_at": datetime.now().isoformat(),
                "altitude": altitude,
                "overlap_percent": overlap
            },
            "waypoints": flight_path
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "ok", "service": "flight-planner-api"})

# Example usage
if __name__ == "__main__":
    # When run directly, either start the API server or run the example
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        # Start API server when called with "python main.py api"
        app.run(host='0.0.0.0', port=5000, debug=True)  # Changed port from 6000 to 5000
    else:
        # Run the example with test coordinates
        test_coordinates = [
            (57.012722, 9.972037),  # Example coordinates in Odense, Denmark
            (57.014961, 9.972057),
            (57.014928, 9.976627),
            (57.012684, 9.976727)
        ]
        altitude = 50  # meters
        
        flight_path = plan_flight(test_coordinates, altitude)
        print(f"Generated {len(flight_path)} waypoints")
        print("First few waypoints:")
        for wp in flight_path[:5]:
            print(wp)
        
        # Save waypoints to JSON file
        saved_file = save_waypoints_to_json(flight_path)
        print(f"\nFlight plan saved to: {saved_file}")
        print("\nTo start the API server, run: python main.py api")