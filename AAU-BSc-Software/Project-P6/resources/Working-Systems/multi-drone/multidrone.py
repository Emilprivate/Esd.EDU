import json
from geo_utils import create_local_projection, calculate_grid_size
from path_optimizer import optimize_tsp_path
from shapely.geometry import Polygon
import math

def assign_grids_to_drones(grid_data, drone_starts):
    """
    Assigns grids in strict vertical strips (columns) for each drone,
    and sorts them in a serpentine pattern to avoid collisions.
    """
    num_drones = len(drone_starts)
    # Find longitude bounds of the entire area
    min_lon = min(grid["center"][1] for grid in grid_data)
    max_lon = max(grid["center"][1] for grid in grid_data)
    column_width = (max_lon - min_lon) / num_drones

    # Assign grids to drones based on longitude (vertical columns)
    columns = [[] for _ in range(num_drones)]
    for i, grid in enumerate(grid_data):
        lon = grid["center"][1]
        col_idx = min(int((lon - min_lon) / column_width), num_drones - 1)
        columns[col_idx].append((i, grid))

    # Sort grids within each column by latitude (serpentine pattern)
    assignments = []
    for idx, col in enumerate(columns):
        # Sort by latitude (descending for even columns, ascending for odd)
        reverse = idx % 2 == 0
        col_sorted = sorted(col, key=lambda x: x[1]["center"][0], reverse=reverse)
        assignments.append([i for i, _ in col_sorted])
    return assignments

def calculate_grid_placement(coordinates, altitude, overlap_percent, coverage):
    if len(coordinates) < 3:
        raise ValueError("At least 3 coordinates are required")
    if not (0 <= overlap_percent <= 100):
        raise ValueError("Overlap percentage must be between 0 and 100")
    lats = [coord[0] for coord in coordinates]
    lons = [coord[1] for coord in coordinates]
    center_lat = sum(lats) / len(lats)
    center_lon = sum(lons) / len(lons)
    to_local, to_wgs84 = create_local_projection(center_lat, center_lon)
    local_coords = [to_local(lon, lat) for lat, lon in coordinates]
    polygon = Polygon(local_coords)
    minx, miny, maxx, maxy = polygon.bounds
    grid_width, grid_height = calculate_grid_size(altitude)
    step_x = grid_width * (1 - overlap_percent / 100)
    step_y = grid_height * (1 - overlap_percent / 100)
    num_x = math.ceil((maxx - minx) / step_x)
    num_y = math.ceil((maxy - miny) / step_y)
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
            if polygon.intersects(grid_polygon):
                intersection = polygon.intersection(grid_polygon)
                intersection_area = intersection.area
                grid_area = grid_polygon.area
                coverage_ratio = intersection_area / grid_area
                if coverage_ratio >= min_coverage_threshold:
                    candidate_grids.append({
                        "center_local": (center_x, center_y),
                        "corners_local": local_corners,
                        "grid_polygon": grid_polygon,
                        "intersection_area": intersection_area,
                        "coverage": coverage_ratio
                    })
    candidate_grids.sort(key=lambda x: x["coverage"], reverse=True)
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

def main():
    lat0, lon0 = 55.0, 12.0
    polygon_coords = [
        (lat0, lon0),
        (lat0, lon0 + 0.0045),
        (lat0 + 0.0036, lon0 + 0.0045),
        (lat0 + 0.0036, lon0)
    ]
    num_drones = 3
    drone_starts = [
        (55.004, 12.0006),
        (55.004, 12.0008),
        (55.004, 12.001)
    ]
    altitude = 40
    overlap = 0
    coverage = 0.7

    grid_data = calculate_grid_placement(polygon_coords, altitude, overlap, coverage)
    assignments = assign_grids_to_drones(grid_data, drone_starts)

    drone_paths = []
    for i, grid_idxs in enumerate(assignments):
        drone_grids = [grid_data[j] for j in grid_idxs]
        if not drone_grids:
            drone_paths.append({"grids": [], "waypoints": [], "metrics": {}})
            continue
        # No TSP: just follow the serpentine sorted order
        waypoints = [g["center"] for g in drone_grids]
        metrics = {"num_grids": len(drone_grids)}
        drone_paths.append({
            "grids": drone_grids,
            "waypoints": waypoints,
            "metrics": metrics,
            "start": drone_starts[i]
        })

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
