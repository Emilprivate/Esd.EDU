import numpy as np
import math
from shapely.geometry import Polygon, Point
from flask import Flask, request, jsonify
import logging
import pyproj
from functools import partial
from shapely.ops import transform
from flask_cors import CORS
from python_tsp.exact import solve_tsp_dynamic_programming
from python_tsp.heuristics import solve_tsp_simulated_annealing
import networkx as nx
import datetime
import json
import os

# Set up Flask application
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Camera constants
WIDE_HFOV_DEGREES = 84  # Wide photo HFOV in degrees
WIDE_ASPECT_RATIO = 4/3  # 4:3 aspect ratio
RECTILINEAR_HFOV_DEGREES = 75.5  # Rectilinear photo HFOV

def create_local_projection(center_lat, center_lon):
    """Create a local projection centered at a specific latitude/longitude"""
    # Create a projection string for a Transverse Mercator projection centered at the given coordinates
    proj_str = f"+proj=tmerc +lat_0={center_lat} +lon_0={center_lon} +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs"
    local_proj = pyproj.Proj(proj_str)
    wgs84 = pyproj.Proj(init='epsg:4326')  # WGS84 coordinate system (lat/lon)
    
    # Create coordinate transformer functions
    to_local = partial(pyproj.transform, wgs84, local_proj)
    to_wgs84 = partial(pyproj.transform, local_proj, wgs84)
    
    return to_local, to_wgs84

def calculate_grid_size(altitude, hfov_degrees=WIDE_HFOV_DEGREES, aspect_ratio=WIDE_ASPECT_RATIO):
    """Calculate the ground footprint dimensions based on altitude and camera specs"""
    if altitude <= 0 or altitude > 40:
        raise ValueError("Altitude must be between 0 and 40 meters")
    
    # Convert FOV from degrees to radians
    hfov_radians = math.radians(hfov_degrees)
    
    # Calculate width of the footprint
    width = 2 * altitude * math.tan(hfov_radians / 2)
    
    # Calculate height based on aspect ratio
    height = width / aspect_ratio
    
    return width, height

def calculate_grid_placement(coordinates, altitude, overlap_percent, coverage):
    """Calculate optimal grid placement with improved efficiency"""
    if len(coordinates) < 3:
        raise ValueError("At least 3 coordinates are required")
    
    if not (0 <= overlap_percent <= 100):
        raise ValueError("Overlap percentage must be between 0 and 100")
    
    # Calculate center of the area to create local projection
    lats = [coord[0] for coord in coordinates]
    lons = [coord[1] for coord in coordinates]
    center_lat = sum(lats) / len(lats)
    center_lon = sum(lons) / len(lons)
    
    # Create local projection
    to_local, to_wgs84 = create_local_projection(center_lat, center_lon)
    
    # Transform geographic coordinates to local projection
    local_coords = [to_local(lon, lat) for lat, lon in coordinates]
    
    # Create polygon from local coordinates
    polygon = Polygon(local_coords)
    
    # Get bounding box
    minx, miny, maxx, maxy = polygon.bounds
    
    # Calculate grid size based on altitude
    grid_width, grid_height = calculate_grid_size(altitude)
    
    # Calculate step size with overlap
    step_x = grid_width * (1 - overlap_percent / 100)
    step_y = grid_height * (1 - overlap_percent / 100)
    
    # Calculate grid numbers
    num_x = math.ceil((maxx - minx) / step_x)
    num_y = math.ceil((maxy - miny) / step_y)
    
    # Generate candidate grids
    candidate_grids = []
    min_coverage_threshold = coverage
    
    for i in range(num_y):
        for j in range(num_x):
            center_x = minx + j * step_x + grid_width / 2
            center_y = miny + i * step_y + grid_height / 2
            
            local_corners = [
                (center_x - grid_width / 2, center_y - grid_height / 2),
                (center_x + grid_width / 2, center_y - grid_height / 2),
                (center_x + grid_width / 2, center_y + grid_height / 2),
                (center_x - grid_width / 2, center_y + grid_height / 2)
            ]
            
            grid_polygon = Polygon(local_corners)
            
            # Calculate intersection and coverage
            if polygon.intersects(grid_polygon):
                intersection = polygon.intersection(grid_polygon)
                intersection_area = intersection.area
                grid_area = grid_polygon.area
                coverage = intersection_area / grid_area
                
                # Only include grids with significant coverage
                if coverage >= min_coverage_threshold:
                    candidate_grids.append({
                        "center_local": (center_x, center_y),
                        "corners_local": local_corners,
                        "grid_polygon": grid_polygon,
                        "intersection_area": intersection_area,
                        "coverage": coverage
                    })
    
    # Sort candidates by coverage
    candidate_grids.sort(key=lambda x: x["coverage"], reverse=True)
    
    # Greedy algorithm to select grids that maximize coverage
    selected_grids = []
    covered_area = Polygon()  # Start with empty coverage
    
    # First pass: Add grids with high coverage
    for grid in candidate_grids:
        if grid["coverage"] > 0.6:  # Automatically include grids with >60% coverage
            selected_grids.append(grid)
            covered_area = covered_area.union(grid["grid_polygon"].intersection(polygon))
    
    # Second pass: Add grids that cover significant uncovered area
    for grid in candidate_grids:
        if grid not in selected_grids:
            # Calculate how much new area this grid would cover
            intersection = grid["grid_polygon"].intersection(polygon)
            new_area = intersection.difference(covered_area)
            
            if new_area.area > coverage * grid_width * grid_height:
                selected_grids.append(grid)
                covered_area = covered_area.union(intersection)
    
    # Convert selected grids to geographic coordinates
    grid_data = []
    for grid in selected_grids:
        center_x, center_y = grid["center_local"]
        geo_center = to_wgs84(center_x, center_y)
        geo_corners = [to_wgs84(x, y) for x, y in grid["corners_local"]]
        
        grid_data.append({
            "center": (geo_center[1], geo_center[0]),
            "corners": [(corner[1], corner[0]) for corner in geo_corners],
            "coverage": grid["coverage"]
        })
    
    return grid_data

def calculate_turn_cost(prev_direction, new_direction):
    """Calculate the cost of making a turn based on the angle"""
    if not prev_direction or not new_direction:
        return 0
        
    # Calculate the angle between two directions in degrees
    angle = math.degrees(math.acos(
        min(1.0, max(-1.0, 
            (prev_direction[0] * new_direction[0] + prev_direction[1] * new_direction[1]) / 
            (math.sqrt(prev_direction[0]**2 + prev_direction[1]**2) * 
             math.sqrt(new_direction[0]**2 + new_direction[1]**2))
        ))
    ))
    
    # Penalize turns proportionally to their angle
    return angle / 180.0

def improve_solution_with_lk(points, initial_tour, distances):
    """Improve tour using Lin-Kernighan heuristic"""
    n = len(points)
    best_tour = initial_tour.copy()
    best_distance = calculate_tour_distance(best_tour, distances)
    improved = True
    
    while improved:
        improved = False
        for i in range(n-2):
            for j in range(i+2, n):
                # Try 2-opt move
                new_tour = best_tour[:i+1] + list(reversed(best_tour[i+1:j+1])) + best_tour[j+1:]
                new_distance = calculate_tour_distance(new_tour, distances)
                
                if new_distance < best_distance:
                    best_tour = new_tour
                    best_distance = new_distance
                    improved = True
                    break
            if improved:
                break
            
            # Try 3-opt move if 2-opt didn't improve
            if not improved and j < n-1:
                for k in range(j+2, n):
                    # Try all possible 3-opt combinations
                    segments = [best_tour[:i+1], best_tour[i+1:j+1], best_tour[j+1:k+1], best_tour[k+1:]]
                    for seg1 in [segments[1], list(reversed(segments[1]))]:
                        for seg2 in [segments[2], list(reversed(segments[2]))]:
                            new_tour = segments[0] + seg1 + seg2 + segments[3]
                            new_distance = calculate_tour_distance(new_tour, distances)
                            
                            if new_distance < best_distance:
                                best_tour = new_tour
                                best_distance = new_distance
                                improved = True
                                break
                        if improved:
                            break
                    if improved:
                        break
            if improved:
                break
    
    return best_tour

def calculate_tour_distance(tour, distances):
    """Calculate total tour distance"""
    total = 0
    for i in range(len(tour) - 1):
        total += distances[tour[i]][tour[i+1]]
    total += distances[tour[-1]][tour[0]]  # Return to start
    return total

def optimize_tsp_path(grid_data, start_point=None):
    """Enhanced TSP solver using nearest neighbor + Lin-Kernighan improvement"""
    if len(grid_data) <= 1:
        return grid_data, [], {}

    # Extract centers
    centers = [grid["center"] for grid in grid_data]
    n = len(centers)

    # Create distance matrix
    distances = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                lat1, lon1 = centers[i]
                lat2, lon2 = centers[j]
                
                # Convert to radians
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                
                # Haversine formula
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distances[i][j] = 6371000 * c  # in meters

    # Find start index if start point provided
    start_idx = 0
    if start_point:
        min_dist = float('inf')
        for i, center in enumerate(centers):
            lat1, lon1 = start_point
            lat2, lon2 = center
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            distance = 6371000 * c
            if distance < min_dist:
                min_dist = distance
                start_idx = i

    # Generate initial solution using nearest neighbor
    current = start_idx
    unvisited = set(range(n))
    unvisited.remove(current)
    tour = [current]
    
    while unvisited:
        next_idx = min(unvisited, key=lambda x: distances[current][x])
        tour.append(next_idx)
        unvisited.remove(next_idx)
        current = next_idx

    # Improve solution using Lin-Kernighan heuristic
    improved_tour = improve_solution_with_lk(centers, tour, distances)

    # Create output
    waypoints = []
    optimized_grid_data = []

    # Add start point if provided
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": 0
        })

    # Add path waypoints
    for i, idx in enumerate(improved_tour):
        grid = grid_data[idx]
        waypoints.append({
            "lat": grid["center"][0],
            "lon": grid["center"][1],
            "type": "grid_center",
            "grid_id": idx,
            "order": i + (1 if start_point else 0)
        })
        optimized_grid_data.append(grid)

    # Add end point (return to start)
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": len(waypoints)
        })
    else:
        # Return to first grid if no start point
        first_grid = grid_data[improved_tour[0]]
        waypoints.append({
            "lat": first_grid["center"][0],
            "lon": first_grid["center"][1],
            "type": "grid_center",
            "grid_id": improved_tour[0],
            "order": len(waypoints)
        })

    # Calculate path metrics
    total_distance = 0
    for i in range(len(waypoints) - 1):
        lat1, lon1 = waypoints[i]["lat"], waypoints[i]["lon"]
        lat2, lon2 = waypoints[i + 1]["lat"], waypoints[i + 1]["lon"]
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        segment_distance = 6371000 * c
        total_distance += segment_distance

    path_metrics = {
        "total_distance": total_distance,
        "grid_count": len(optimized_grid_data),
        "estimated_flight_time": total_distance / 5.0  # assuming 5 m/s speed
    }

    return optimized_grid_data, waypoints, path_metrics

def save_to_gpx(waypoints, altitude, filename=None):
    """
    Save waypoints to a GPX file format
    
    Args:
        waypoints: List of waypoint dictionaries
        altitude: Flight altitude in meters
        filename: Optional custom filename
    """
    if filename is None:
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"mission_{timestamp}.gpx"
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(current_dir, filename)
    
    # Create GPX format
    gpx_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Flight Planner" xmlns="http://www.topografix.com/GPX/1/1">
    <metadata>
        <name>Drone Flight Path</name>
        <time>{datetime.datetime.now().isoformat()}</time>
    </metadata>
    <rte>
        <name>Flight Path</name>
"""
    
    # Add waypoints
    for wp in waypoints:
        action = "photo" if wp["type"] == "grid_center" else "move"
        gpx_content += f"""        <rtept lat="{wp['lat']}" lon="{wp['lon']}">
            <ele>{altitude}</ele>
            <name>WP-{wp.get('order', 0)}</name>
            <desc>{action}</desc>
        </rtept>\n"""
    
    # Close GPX file
    gpx_content += """    </rte>
</gpx>"""
    
    # Save to file
    with open(filepath, 'w') as f:
        f.write(gpx_content)
    
    logging.info(f"Saved GPX file to: {filepath}")
    return filepath

@app.route('/calculate_grid', methods=['POST'])
def api_calculate_grid():
    """API endpoint to calculate grid placement"""
    try:
        data = request.get_json()
        
        coordinates = data.get('coordinates')
        altitude = float(data.get('altitude'))
        overlap = float(data.get('overlap'))
        coverage = (1 - float(data.get('coverage'))) / 100
        start_point = data.get('start_point')  # [lat, lon]
        
        # Validate inputs
        if not coordinates or len(coordinates) < 3:
            return jsonify({"error": "At least 3 coordinates are required"}), 400
        
        if altitude <= 0 or altitude > 40:
            return jsonify({"error": "Altitude must be between 0 and 40 meters"}), 400
        
        if not (0 <= overlap <= 100):
            return jsonify({"error": "Overlap percentage must be between 0 and 100"}), 400
        
        # Calculate grid placement
        grid_data = calculate_grid_placement(coordinates, altitude, overlap, coverage)
        
        # Use true TSP optimization
        optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data, start_point)

        # Save to CPX file
        gpx_filepath = save_to_gpx(waypoints, altitude)
        
        # Add the CPX file information to the response
        response = {
            "grid_count": len(optimized_grid_data),
            "grids": [{
                "center": {"lat": grid["center"][0], "lon": grid["center"][1]},
                "corners": [{"lat": corner[0], "lon": corner[1]} for corner in grid["corners"]]
            } for grid in optimized_grid_data],
            "path": waypoints,
            "path_metrics": path_metrics,
            "metadata": {
                "altitude": altitude,
                "overlap_percent": overlap,
                "start_point": start_point,
                "created_at": datetime.datetime.now().isoformat(),
                "gpx_file": os.path.basename(gpx_filepath)  # Include the filename in response
            }
        }
        
        logging.info(f"Generated response with CPX file: {gpx_filepath}")
        
        return jsonify(response)
    
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
