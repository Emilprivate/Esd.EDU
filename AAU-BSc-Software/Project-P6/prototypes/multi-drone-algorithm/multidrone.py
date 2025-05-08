import json
# Remove duplicate and failing import of calculate_grid_placement
from geo_utils import create_local_projection, calculate_grid_size
from path_optimizer import optimize_tsp_path
import numpy as np
from shapely.geometry import Polygon
import math

def assign_grids_to_drones(grid_data, drone_starts):
    """
    Assigns grids to drones based on proximity to their start points.
    Ensures each grid is assigned to only one drone and tries to balance the number of grids.
    """
    num_drones = len(drone_starts)
    num_grids = len(grid_data)
    assignments = [[] for _ in range(num_drones)]
    assigned = set()

    # Compute distance from each grid to each drone start
    grid_centers = np.array([grid["center"] for grid in grid_data])
    drone_starts_np = np.array(drone_starts)
    dists = np.linalg.norm(
        grid_centers[:, None, :] - drone_starts_np[None, :, :], axis=2
    )  # shape: (num_grids, num_drones)

    # Assign grids greedily to closest drone, but balance the number of grids
    grid_indices = list(range(num_grids))
    drone_grid_counts = [0] * num_drones
    max_per_drone = math.ceil(num_grids / num_drones)

    # Sort grids by minimum distance to any drone (to assign "obvious" ones first)
    grid_priority = sorted(grid_indices, key=lambda i: dists[i].min())

    for i in grid_priority:
        # Find the closest drone that still has capacity
        drone_order = np.argsort(dists[i])
        for d in drone_order:
            if drone_grid_counts[d] < max_per_drone:
                assignments[d].append(i)
                drone_grid_counts[d] += 1
                assigned.add(i)
                break

    return assignments

# Add the calculate_grid_placement function here if it's not available in geo_utils.py
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
                coverage_ratio = intersection_area / grid_area
                
                # Only include grids with significant coverage
                if coverage_ratio >= min_coverage_threshold:
                    candidate_grids.append({
                        "center_local": (center_x, center_y),
                        "corners_local": local_corners,
                        "grid_polygon": grid_polygon,
                        "intersection_area": intersection_area,
                        "coverage": coverage_ratio
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
    
    return grid_data

def haversine(lat1, lon1, lat2, lon2):
    # Returns distance in meters between two lat/lon points
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def global_deconflict_paths(drone_paths, min_sep_meters=10):
    """
    Simulate all drones step-by-step and delay drones to avoid collisions.
    Each drone's path is a list of waypoints (lat, lon).
    Returns: list of (lat, lon, t) for each drone, where t is the timestep.
    """
    # Prepare step-by-step positions for each drone
    step_size = 1  # meters per step
    drone_steps = []
    for path in drone_paths:
        waypoints = [(wp["lat"], wp["lon"]) for wp in path["waypoints"]]
        steps = []
        for i in range(len(waypoints)-1):
            lat1, lon1 = waypoints[i]
            lat2, lon2 = waypoints[i+1]
            dist = haversine(lat1, lon1, lat2, lon2)
            n_steps = max(1, int(dist // step_size))
            for s in range(n_steps):
                frac = s / n_steps
                lat = lat1 + frac * (lat2 - lat1)
                lon = lon1 + frac * (lon2 - lon1)
                steps.append((lat, lon))
        steps.append(waypoints[-1])
        drone_steps.append(steps)

    # Simulate time steps
    max_len = max(len(steps) for steps in drone_steps)
    indices = [0] * len(drone_steps)
    safe_paths = [[] for _ in drone_steps]
    for t in range(max_len):
        positions = []
        for d, steps in enumerate(drone_steps):
            idx = min(indices[d], len(steps)-1)
            positions.append(steps[idx])
        # Check for collisions
        collision = False
        for i in range(len(positions)):
            for j in range(i+1, len(positions)):
                dist = haversine(*positions[i], *positions[j])
                if dist < min_sep_meters:
                    collision = True
                    # Delay the drone with the higher index
                    indices[j] = max(indices[j]-1, 0)
        # Advance all drones
        for d in range(len(indices)):
            if indices[d] < len(drone_steps[d])-1:
                indices[d] += 1
            safe_paths[d].append((*positions[d], t))
    return safe_paths

def main():
    # Example input (replace with your own)
    lat0, lon0 = 55.0, 12.0
    polygon_coords = [
        (lat0, lon0),
        (lat0, lon0 + 0.0045),         # ~300m east
        (lat0 + 0.0036, lon0 + 0.0045),# ~400m north-east
        (lat0 + 0.0036, lon0)          # ~400m north
    ]
    num_drones = 3
    drone_starts = [
        (55.004, 12.0006),
        (55.004, 12.0008),
        (55.004, 12.001)
    ]
    altitude = 40
    overlap = 0
    coverage = 0.7  # 70%

    # Calculate grid
    grid_data = calculate_grid_placement(polygon_coords, altitude, overlap, coverage)

    # Assign grids to drones
    assignments = assign_grids_to_drones(grid_data, drone_starts)

    # For each drone, optimize its path
    drone_paths = []
    for i, grid_idxs in enumerate(assignments):
        drone_grids = [grid_data[j] for j in grid_idxs]
        if not drone_grids:
            drone_paths.append({"grids": [], "waypoints": [], "metrics": {}, "start": drone_starts[i]})
            continue
        from path_optimizer import optimize_tsp_path
        optimized_grids, waypoints, metrics = optimize_tsp_path(drone_grids, drone_starts[i])
        drone_paths.append({
            "grids": optimized_grids,
            "waypoints": waypoints,
            "metrics": metrics,
            "start": drone_starts[i]
        })

    # --- GLOBAL DECONFLICTION ---
    # This will create safe_paths with no collisions (minimum separation enforced)
    safe_paths = global_deconflict_paths(drone_paths, min_sep_meters=10)
    # You can save or plot safe_paths as needed

    # Save to JSON (original output, not the step-by-step safe_paths)
    output = {
        "drones": [
            {
                "drone_id": i,
                "start": drone_paths[i]["start"],
                "grids": drone_paths[i]["grids"],
                "waypoints": drone_paths[i]["waypoints"],
                "metrics": drone_paths[i]["metrics"]
            }
            for i in range(num_drones)
        ]
    }
    with open("multi_drone_grid_assignment.json", "w") as f:
        json.dump(output, f, indent=2)

if __name__ == "__main__":
    main()
