import math
import shapely
import datetime
from shapely.geometry import Polygon
from shapely.affinity import rotate
from shapely import ops
from geo_utils import create_local_projection, calculate_grid_size

#############################
# Algorithm functionality
#############################

def grid_based_algorithm(coordinates, altitude, overlap, coverage, start_point=None, drone_start_point=None):
    """
    Main modular function to calculate grid and flight path.
    """

    # Calculate grid placement
    grid_data, polygon_area, not_searched_area, extra_area = calculate_grid_placement(
        coordinates, altitude, overlap, coverage
    )

    tsp_start = start_point if start_point else drone_start_point
    # Find the optimal path through the grids using TSP solver
    optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data, tsp_start)

    return {
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
            "drone_start_point": drone_start_point,
            "created_at": datetime.datetime.now().isoformat(),
            "polygon_area": polygon_area,
            "not_searched_area": not_searched_area,
            "extra_area": extra_area,
        }
    }

#############################
# Grid Calculator Functions
#############################

def calculate_grid_placement(coordinates, altitude, overlap_percent, coverage):
    """
    Calculate optimal grid placement with improved efficiency.
    """
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
                cov = intersection_area / grid_area
                # Only include grids with significant coverage
                if cov >= min_coverage_threshold:
                    candidate_grids.append({
                        "center_local": (center_x, center_y),
                        "corners_local": local_corners,
                        "grid_polygon": grid_polygon,
                        "intersection_area": intersection_area,
                        "coverage": cov
                    })
    # Sort candidates by coverage
    candidate_grids.sort(key=lambda x: x["coverage"], reverse=True)
    # Convert selected grids to geographic coordinates
    grid_data = []
    for grid in candidate_grids:
        center_x, center_y = grid["center_local"]
        geo_center = to_wgs84(center_x, center_y)
        geo_corners = [to_wgs84(x, y) for x, y in grid["corners_local"]]
        grid_data.append({
            "center": (geo_center[1], geo_center[0]),
            "corners": [(corner[1], corner[0]) for corner in geo_corners],
            "coverage": grid["coverage"]
        })
    polygon_area = polygon.area
    # Calculate area not searched (inside polygon but not covered by any grid)
    covered_area = sum([polygon.intersection(Polygon(grid["corners_local"])).area for grid in candidate_grids])
    not_searched_area = polygon_area - covered_area
    # Calculate extra area searched (area covered by grids outside the polygon)
    extra_area = sum([
        Polygon(grid["corners_local"]).area - polygon.intersection(Polygon(grid["corners_local"])).area
        for grid in candidate_grids
    ])
    print(f"Polygon area: {polygon_area:.2f} m^2")
    print(f"Area inside polygon NOT searched: {not_searched_area:.2f} m^2")
    print(f"Extra area searched outside polygon: {extra_area:.2f} m^2")

    if not grid_data:
        raise ValueError("No grids could be placed. Please enlarge the area or reduce minimum coverage.")
    return grid_data, polygon_area, not_searched_area, extra_area

#############################
# Path Optimizer Functions
#############################

def optimize_tsp_path(grid_data, start_point=None):
    """
    Enhanced TSP solver using nearest neighbor + Lin-Kernighan improvement.
    """
    if len(grid_data) == 1:
        # Only one grid, return it as the only waypoint
        grid = grid_data[0]
        waypoints = [{
            "lat": grid["center"][0],
            "lon": grid["center"][1],
            "type": "grid_center",
            "grid_id": 0,
            "order": 0,
            "rotation": grid.get("rotation", 0)
        }]
        path_metrics = {
            "total_distance": 0,
            "grid_count": 1,
            "estimated_flight_time": 0
        }
        return grid_data, waypoints, path_metrics
    if len(grid_data) == 0:
        return grid_data, [], {}
    centers = [grid["center"] for grid in grid_data]
    n = len(centers)
    # Create distance matrix
    distances = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                lat1, lon1 = centers[i]
                lat2, lon2 = centers[j]
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distances[i][j] = 6371000 * c
    # Find start index
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
    # Generate initial solution
    current = start_idx
    unvisited = set(range(n))
    unvisited.remove(current)
    tour = [current]
    while unvisited:
        next_idx = min(unvisited, key=lambda x: distances[current][x])
        tour.append(next_idx)
        unvisited.remove(next_idx)
        current = next_idx
    # Improve solution
    improved_tour = improve_solution_with_lk(centers, tour, distances)
    # Create output
    optimized_grid_data = [grid_data[i] for i in improved_tour]
    waypoints = []
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": 0
        })
    for i, idx in enumerate(improved_tour):
        grid = grid_data[idx]
        waypoints.append({
            "lat": grid["center"][0],
            "lon": grid["center"][1],
            "type": "grid_center",
            "grid_id": idx,
            "order": i + (1 if start_point else 0),
            "rotation": 0
        })
    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": len(waypoints)
        })
    # Calculate metrics
    total_distance = calculate_tour_distance(improved_tour, distances)
    # Improved estimated flight time calculation based on benchmarks:
    # Takeoff: 6s, Ascend: 0.5s/m, Waypoint: 20s each, Travel: 0.5s/m, Landing: 0.5s/m
    takeoff_time = 6.0
    altitude = 20
    ascend_time = 0.5 * altitude
    landing_time = 0.5 * altitude
    waypoint_time = len(optimized_grid_data) * 20.0
    travel_time = 0.5 * total_distance
    estimated_flight_time = takeoff_time + ascend_time + waypoint_time + travel_time + landing_time
    path_metrics = {
        "total_distance": total_distance,
        "grid_count": len(optimized_grid_data),
        "estimated_flight_time": estimated_flight_time
    }
    return optimized_grid_data, waypoints, path_metrics

def improve_solution_with_lk(points, initial_tour, distances):
    """
    Improve tour using Lin-Kernighan heuristic.
    """
    n = len(points)
    best_tour = initial_tour.copy()
    best_distance = calculate_tour_distance(best_tour, distances)
    improved = True
    while improved:
        improved = False
        for i in range(n-2):
            for j in range(i+2, n):
                new_tour = best_tour[:i+1] + list(reversed(best_tour[i+1:j+1])) + best_tour[j+1:]
                new_distance = calculate_tour_distance(new_tour, distances)
                if new_distance < best_distance:
                    best_tour = new_tour
                    best_distance = new_distance
                    improved = True
                    break
            if improved:
                break
    return best_tour

def calculate_tour_distance(tour, distances):
    """
    Calculate total tour distance.
    """
    total = 0
    for i in range(len(tour) - 1):
        total += distances[tour[i]][tour[i+1]]
    total += distances[tour[-1]][tour[0]]
    return total