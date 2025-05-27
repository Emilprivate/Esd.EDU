import math
import datetime
from shapely.geometry import Polygon
import random
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# ====== Grid & Path Utilities ======
def create_local_projection(center_lat, center_lon):
    """Create a local projection for converting between geographic and local coordinates"""

    earth_radius = 6371000
    lat_to_m = 111320
    
    lon_to_m = 111320 * math.cos(math.radians(center_lat))
    
    def to_local(lon, lat):
        x = (lon - center_lon) * lon_to_m
        y = (lat - center_lat) * lat_to_m
        return (x, y)
    
    def to_wgs84(x, y):
        lon = center_lon + (x / lon_to_m)
        lat = center_lat + (y / lat_to_m)
        return (lon, lat)
    
    return to_local, to_wgs84

def calculate_grid_size(altitude):
    """Calculate the grid size based on the altitude and camera parameters"""

    horizontal_fov = math.radians(69)
    vertical_fov = math.radians(49)
    
    width = 2 * altitude * math.tan(horizontal_fov / 2)
    height = 2 * altitude * math.tan(vertical_fov / 2)
    
    return width, height

def calculate_grid_placement(coordinates, altitude, overlap_percent, coverage):
    """Calculate optimal grid placement with improved efficiency"""
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
                coverage = intersection_area / grid_area
                
                if coverage >= min_coverage_threshold:
                    candidate_grids.append({
                        "center_local": (center_x, center_y),
                        "corners_local": local_corners,
                        "grid_polygon": grid_polygon,
                        "intersection_area": intersection_area,
                        "coverage": coverage
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

def optimize_tsp_path(grid_data, start_point=None):
    """Enhanced TSP solver using nearest neighbor + Lin-Kernighan improvement"""
    if len(grid_data) <= 1:
        return grid_data, [], {}

    centers = [grid["center"] for grid in grid_data]
    n = len(centers)

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

    current = start_idx
    unvisited = set(range(n))
    unvisited.remove(current)
    tour = [current]
    
    while unvisited:
        next_idx = min(unvisited, key=lambda x: distances[current][x])
        tour.append(next_idx)
        unvisited.remove(next_idx)
        current = next_idx

    improved_tour = improve_solution_with_lk(centers, tour, distances)

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
            "order": i + (1 if start_point else 0)
        })

    if start_point:
        waypoints.append({
            "lat": start_point[0],
            "lon": start_point[1],
            "type": "start_end",
            "order": len(waypoints)
        })

    total_distance = calculate_tour_distance(improved_tour, distances)
    path_metrics = {
        "total_distance": total_distance,
        "grid_count": len(optimized_grid_data),
        "estimated_flight_time": total_distance / 5.0
    }

    return optimized_grid_data, waypoints, path_metrics

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
    """Calculate total tour distance"""
    total = 0
    for i in range(len(tour) - 1):
        total += distances[tour[i]][tour[i+1]]
    total += distances[tour[-1]][tour[0]]
    return total

# ====== Multi-Drone Utilities ======
def split_grid_among_drones(grid_data, num_drones):
    """
    Splits grid_data into num_drones groups using a simple round-robin assignment.
    Returns a list of lists, each containing grid_data for one drone.
    """
    groups = [[] for _ in range(num_drones)]
    for idx, grid in enumerate(grid_data):
        groups[idx % num_drones].append(grid)
    return groups

def split_grid_sections(grid_data, num_drones):
    """
    Split the grid into contiguous sections (by longitude), so each drone covers a spatially distinct area.
    Returns a list of lists, each containing grid_data for one drone.
    """
    # Sort by longitude (east-west split)
    sorted_grids = sorted(grid_data, key=lambda g: g["center"][1])
    n = len(sorted_grids)
    section_size = n // num_drones
    groups = []
    for i in range(num_drones):
        start = i * section_size
        end = (i + 1) * section_size if i < num_drones - 1 else n
        groups.append(sorted_grids[start:end])
    return groups

def optimize_multi_drone_paths(grid_data, num_drones, start_points=None):
    """
    Splits grid_data among num_drones and optimizes a path for each.
    start_points: list of (lat, lon) tuples, one per drone (optional).
    Returns: list of dicts with keys: 'drone', 'waypoints', 'path_metrics'
    """
    groups = split_grid_among_drones(grid_data, num_drones)
    results = []
    for i, group in enumerate(groups):
        sp = start_points[i] if start_points and i < len(start_points) else None
        _, waypoints, path_metrics = optimize_tsp_path(group, sp)
        results.append({
            "drone": i + 1,
            "waypoints": waypoints,
            "path_metrics": path_metrics
        })
    return results

def optimize_multi_drone_paths_sections(groups, start_points=None):
    """
    For each group (section), optimize the path for that drone.
    """
    results = []
    for i, group in enumerate(groups):
        sp = start_points[i] if start_points and i < len(start_points) else None
        _, waypoints, path_metrics = optimize_tsp_path(group, sp)
        results.append({
            "drone": i + 1,
            "waypoints": waypoints,
            "path_metrics": path_metrics
        })
    return results

def plot_multi_drone_grid_paths(groups, multi_paths, title="Multi-Drone Grid Assignment"):
    """
    Plots the grid cells, their centers, and the drone routes.
    Each drone's grids and path are shown in a different color.
    """
    colors = plt.cm.get_cmap('tab10', len(groups))
    fig, ax = plt.subplots(figsize=(10, 8))

    for drone_idx, (group, result) in enumerate(zip(groups, multi_paths)):
        color = colors(drone_idx)
        # Plot grid cells
        for grid in group:
            corners = grid["corners"]
            xs = [c[1] for c in corners] + [corners[0][1]]
            ys = [c[0] for c in corners] + [corners[0][0]]
            ax.plot(xs, ys, color=color, linewidth=1)
            ax.fill(xs, ys, color=color, alpha=0.15)
        # Plot center points and path
        centers = [(wp["lat"], wp["lon"]) for wp in result["waypoints"] if wp["type"] == "grid_center"]
        if centers:
            xs = [lon for lat, lon in centers]
            ys = [lat for lat, lon in centers]
            ax.scatter(xs, ys, color=color, label=f"Drone {drone_idx+1} centers")
            ax.plot(xs, ys, color=color, linestyle='-', linewidth=2, alpha=0.7)
            for i, (lat, lon) in enumerate(centers):
                ax.annotate(f"{i+1}", (lon, lat), color=color, fontsize=8, weight='bold')
        # Plot start points if present and connect to first grid cell
        start_points = [(wp["lat"], wp["lon"]) for wp in result["waypoints"] if wp["type"] in ("start", "start_end")]
        if start_points:
            sx = [lon for lat, lon in start_points]
            sy = [lat for lat, lon in start_points]
            ax.scatter(sx, sy, color=color, marker='*', s=120, edgecolor='black', label=f"Drone {drone_idx+1} start(s)")
            for (lat, lon) in start_points:
                ax.annotate("START", (lon, lat), color=color, fontsize=9, weight='bold', xytext=(5,5), textcoords='offset points')
            # Draw line from start to first grid cell
            if centers:
                for (start_lat, start_lon) in start_points:
                    ax.plot([start_lon, centers[0][1]], [start_lat, centers[0][0]], color=color, linestyle='--', linewidth=1.5, alpha=0.8)

    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_title(title)
    ax.legend()
    ax.axis('equal')
    plt.tight_layout()
    plt.show()

def sweep_grid_path(group):
    """
    Returns a boustrophedon (zig-zag) sweep path through the grid cells in the group.
    Sorts by latitude (rows), then by longitude (columns) within each row.
    Alternates direction for each row to avoid path crossings.
    """
    # Group by rounded latitude (row)
    row_dict = {}
    for grid in group:
        lat = round(grid["center"][0], 7)
        row_dict.setdefault(lat, []).append(grid)
    # Sort rows by latitude (south to north)
    sorted_lats = sorted(row_dict.keys())
    path = []
    for i, lat in enumerate(sorted_lats):
        row = sorted(row_dict[lat], key=lambda g: g["center"][1])
        if i % 2 == 1:
            row = list(reversed(row))
        path.extend(row)
    return path

def optimize_multi_drone_paths_sweep(groups):
    """
    For each group (section), generate a sweep path for that drone.
    Returns: list of dicts with keys: 'drone', 'waypoints', 'path_metrics'
    """
    results = []
    for i, group in enumerate(groups):
        sweep_path = sweep_grid_path(group)
        waypoints = []
        for order, grid in enumerate(sweep_path):
            waypoints.append({
                "lat": grid["center"][0],
                "lon": grid["center"][1],
                "type": "grid_center",
                "grid_id": order,
                "order": order
            })
        # Simple path metrics: sum of distances between consecutive waypoints
        total_distance = 0
        for j in range(len(waypoints) - 1):
            lat1, lon1 = waypoints[j]["lat"], waypoints[j]["lon"]
            lat2, lon2 = waypoints[j+1]["lat"], waypoints[j+1]["lon"]
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            total_distance += 6371000 * c
        path_metrics = {
            "total_distance": total_distance,
            "grid_count": len(waypoints),
            "estimated_flight_time": total_distance / 5.0 if total_distance > 0 else 0
        }
        results.append({
            "drone": i + 1,
            "waypoints": waypoints,
            "path_metrics": path_metrics
        })
    return results

def assign_grids_to_drones_by_sweep(grid_data, num_drones, start_points):
    """
    Assigns grid cells to drones using a global sweep pattern, then splits the sweep path into num_drones contiguous segments.
    Each drone starts at its own start_point and covers its assigned segment.
    Returns: groups (list of grid lists), and a list of start_points.
    """
    sweep_path = sweep_grid_path(grid_data)
    n = len(sweep_path)
    base = n // num_drones
    remainder = n % num_drones
    groups = []
    idx = 0
    for i in range(num_drones):
        count = base + (1 if i < remainder else 0)
        groups.append(sweep_path[idx:idx+count])
        idx += count
    # start_points is now a list of (lat, lon) tuples, one per drone
    return groups, start_points

def optimize_multi_drone_paths_sweep_with_start(groups, start_points):
    """
    For each group (section), generate a sweep path for that drone, starting from the given start_point.
    The drone will go from the start_point to the first grid, then follow the sweep.
    """
    results = []
    for i, (group, sp) in enumerate(zip(groups, start_points)):
        sweep_path = sweep_grid_path(group)
        waypoints = []
        # Add start point as the first waypoint
        if sp:
            waypoints.append({
                "lat": sp[0],
                "lon": sp[1],
                "type": "start",
                "order": 0
            })
            order_offset = 1
        else:
            order_offset = 0
        for order, grid in enumerate(sweep_path):
            waypoints.append({
                "lat": grid["center"][0],
                "lon": grid["center"][1],
                "type": "grid_center",
                "grid_id": order,
                "order": order + order_offset
            })
        # Simple path metrics: sum of distances between consecutive waypoints
        total_distance = 0
        for j in range(len(waypoints) - 1):
            lat1, lon1 = waypoints[j]["lat"], waypoints[j]["lon"]
            lat2, lon2 = waypoints[j+1]["lat"], waypoints[j+1]["lon"]
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            total_distance += 6371000 * c
        path_metrics = {
            "total_distance": total_distance,
            "grid_count": len(waypoints) - order_offset,
            "estimated_flight_time": total_distance / 5.0 if total_distance > 0 else 0
        }
        results.append({
            "drone": i + 1,
            "waypoints": waypoints,
            "path_metrics": path_metrics
        })
    return results

def assign_grids_to_drones_by_proximity(grid_data, num_drones, start_points):
    """
    Assigns grid cells to drones by splitting the sweep path into contiguous segments,
    then assigning each segment to the drone whose start point is closest to it.
    Ensures each grid is only assigned once.
    Returns: groups (list of grid lists), and a list of start_points (unchanged).
    """
    sweep_path = sweep_grid_path(grid_data)
    n = len(sweep_path)
    base = n // num_drones
    remainder = n % num_drones
    # Split sweep path into contiguous segments
    segments = []
    idx = 0
    for i in range(num_drones):
        count = base + (1 if i < remainder else 0)
        segments.append(sweep_path[idx:idx+count])
        idx += count
    # Assign each segment to the closest drone start point (greedy, no repeats)
    assigned = [None] * num_drones
    used = set()
    for _ in range(num_drones):
        best_dist = float('inf')
        best_drone = None
        best_seg = None
        for drone_idx, sp in enumerate(start_points):
            if drone_idx in used:
                continue
            for seg_idx, seg in enumerate(segments):
                if seg is None:
                    continue
                # Distance from start point to first grid in segment
                grid = seg[0]
                dlat = math.radians(sp[0] - grid["center"][0])
                dlon = math.radians(sp[1] - grid["center"][1])
                a = math.sin(dlat/2)**2 + math.cos(math.radians(sp[0])) * math.cos(math.radians(grid["center"][0])) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                dist = 6371000 * c
                if dist < best_dist:
                    best_dist = dist
                    best_drone = drone_idx
                    best_seg = seg_idx
        assigned[best_drone] = segments[best_seg]
        used.add(best_drone)
        segments[best_seg] = None
    return assigned, start_points

def optimize_multi_drone_paths_sweep_with_start_and_return(groups, start_points):
    """
    For each group, generate a sweep path for that drone, starting and ending at the given start_point.
    The drone will go from the start_point to the first grid, follow the sweep, then return to start.
    """
    results = []
    for i, (group, sp) in enumerate(zip(groups, start_points)):
        sweep_path = sweep_grid_path(group)
        waypoints = []
        # Add start point as the first waypoint
        if sp:
            waypoints.append({
                "lat": sp[0],
                "lon": sp[1],
                "type": "start",
                "order": 0
            })
            order_offset = 1
        else:
            order_offset = 0
        for order, grid in enumerate(sweep_path):
            waypoints.append({
                "lat": grid["center"][0],
                "lon": grid["center"][1],
                "type": "grid_center",
                "grid_id": order,
                "order": order + order_offset
            })
        # Add return to start
        if sp:
            waypoints.append({
                "lat": sp[0],
                "lon": sp[1],
                "type": "end",
                "order": len(waypoints)
            })
        # Simple path metrics: sum of distances between consecutive waypoints
        total_distance = 0
        for j in range(len(waypoints) - 1):
            lat1, lon1 = waypoints[j]["lat"], waypoints[j]["lon"]
            lat2, lon2 = waypoints[j+1]["lat"], waypoints[j+1]["lon"]
            lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            total_distance += 6371000 * c
        path_metrics = {
            "total_distance": total_distance,
            "grid_count": len(waypoints) - order_offset - (1 if sp else 0),
            "estimated_flight_time": total_distance / 5.0 if total_distance > 0 else 0
        }
        results.append({
            "drone": i + 1,
            "waypoints": waypoints,
            "path_metrics": path_metrics
        })
    return results

# ====== Main Script ======
if __name__ == "__main__":
    # ====== MOCK DATA ======
    # Example polygon: simple rectangle (lat, lon)
    coordinates = [
        (57.013, 9.992),
        (57.013, 9.995),
        (57.015, 9.995),
        (57.015, 9.992),
        (57.013, 9.992)  # Closing the polygon
    ]
    altitude = 20
    overlap = 0
    coverage = 70  # 70% minimum coverage per grid
    num_drones = 3

    # Optionally, specify start points for each drone (otherwise None)
    # Here, just use the first grid center for each drone after splitting
    print("Generating grid...")
    grid_data = calculate_grid_placement(coordinates, altitude, overlap, (1 - coverage) / 100)
    print(f"Total grid cells: {len(grid_data)}")

    # Optionally, randomize grid order for more interesting splits
    random.shuffle(grid_data)

    # Assign start points (for demo, use the first grid center in each group)
    groups = split_grid_sections(grid_data, num_drones)
    start_points = [group[0]["center"] if group else None for group in groups]

    print(f"Splitting grid into {num_drones} spatial sections...")
    multi_paths = optimize_multi_drone_paths_sweep(groups)

    for result in multi_paths:
        print(f"\nDrone {result['drone']} path:")
        for wp in result["waypoints"]:
            print(f"  {wp}")
        print(f"  Path metrics: {result['path_metrics']}")

    # Comment out the next line if you only want to see the final plot:
    # plot_multi_drone_grid_paths(groups, multi_paths)

    # Compute bounding box of all grid centers
    all_lats = [g["center"][0] for g in grid_data]
    all_lons = [g["center"][1] for g in grid_data]
    min_lat, max_lat = min(all_lats), max(all_lats)
    min_lon, max_lon = min(all_lons), max(all_lons)

    # Place startpoints 10 meters underneath the grid area, with 1 meter between them
    meters_per_deg_lat = 111320
    avg_lat = sum(all_lats) / len(all_lats)
    meters_per_deg_lon = 111320 * math.cos(math.radians(avg_lat))
    start_lat = min_lat - (20 / meters_per_deg_lat)
    start_points = []
    for i in range(num_drones):
        lon = min_lon + (i * 5 / meters_per_deg_lon)
        start_points.append((start_lat, lon))

    # Assign grids to drones using proximity-based assignment
    groups, start_points = assign_grids_to_drones_by_proximity(grid_data, num_drones, start_points)

    print(f"Assigning grid cells to {num_drones} drones using proximity-based sweep split with unique start points outside the grid...")
    multi_paths = optimize_multi_drone_paths_sweep_with_start_and_return(groups, start_points)

    for result in multi_paths:
        print(f"\nDrone {result['drone']} path:")
        for wp in result["waypoints"]:
            print(f"  {wp}")
        print(f"  Path metrics: {result['path_metrics']}")

    plot_multi_drone_grid_paths(groups, multi_paths)
