import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import contextily as ctx
from pyproj import Transformer

def plot_multi_drone(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    colors = ['tab:blue', 'tab:orange', 'tab:green', 'tab:red', 'tab:purple', 'tab:brown', 'tab:pink', 'tab:gray']
    marker_styles = ['o', 's', '^', 'D', 'P', '*', 'X', 'v']

    # Transformer for lat/lon to Web Mercator
    transformer = Transformer.from_crs("epsg:4326", "epsg:3857", always_xy=True)

    plt.figure(figsize=(12, 8))
    ax = plt.gca()

    all_x = []
    all_y = []

    for i, drone in enumerate(data["drones"]):
        color = colors[i % len(colors)]
        marker = marker_styles[i % len(marker_styles)]

        # Plot grids
        for grid in drone["grids"]:
            corners = np.array(grid["corners"])
            # corners: [[lat, lon], ...]
            lons = corners[:,1]
            lats = corners[:,0]
            xs, ys = transformer.transform(lons, lats)
            poly = patches.Polygon(np.column_stack([xs, ys]), closed=True, facecolor=color, alpha=0.2, edgecolor=color)
            ax.add_patch(poly)
            all_x.extend(xs)
            all_y.extend(ys)

        # Plot path
        waypoints = drone["waypoints"]
        path_lats = [wp["lat"] for wp in waypoints]
        path_lons = [wp["lon"] for wp in waypoints]
        path_xs, path_ys = transformer.transform(path_lons, path_lats)
        plt.plot(path_xs, path_ys, color=color, linewidth=2, label=f"Drone {i} path")
        all_x.extend(path_xs)
        all_y.extend(path_ys)

        # Add arrows to indicate direction
        for j in range(len(path_xs) - 1):
            dx = path_xs[j+1] - path_xs[j]
            dy = path_ys[j+1] - path_ys[j]
            plt.quiver(
                path_xs[j], path_ys[j], dx, dy,
                angles='xy', scale_units='xy', scale=1, width=0.003, color=color, alpha=0.7
            )

        # Plot start/endpoints
        start_x, start_y = path_xs[0], path_ys[0]
        end_x, end_y = path_xs[-1], path_ys[-1]
        plt.scatter(start_x, start_y, color=color, marker=marker, s=120, edgecolor='black', label=f"Drone {i} start")
        plt.scatter(end_x, end_y, color=color, marker=marker, s=120, edgecolor='white', label=f"Drone {i} end", alpha=0.7)

    # Set extent for map tiles
    if all_x and all_y:
        margin = 200  # meters
        min_x, max_x = min(all_x)-margin, max(all_x)+margin
        min_y, max_y = min(all_y)-margin, max(all_y)+margin
        ax.set_xlim(min_x, max_x)
        ax.set_ylim(min_y, max_y)
        # Use satellite imagery as basemap
        ctx.add_basemap(ax, crs="epsg:3857", source=ctx.providers.Esri.WorldImagery)

    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.title("Multi-Drone Grid Assignment and Paths")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    plot_multi_drone("multi_drone_grid_assignment.json")
