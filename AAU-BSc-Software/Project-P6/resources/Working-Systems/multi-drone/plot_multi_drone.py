import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

def plot_multi_drone(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    colors = ['tab:blue', 'tab:orange', 'tab:green', 'tab:red', 'tab:purple', 'tab:brown', 'tab:pink', 'tab:gray']
    marker_styles = ['o', 's', '^', 'D', 'P', '*', 'X', 'v']

    plt.figure(figsize=(12, 8))
    ax = plt.gca()

    for i, drone in enumerate(data["drones"]):
        color = colors[i % len(colors)]
        marker = marker_styles[i % len(marker_styles)]

        # Plot grids
        for grid in drone["grids"]:
            corners = np.array(grid["corners"])
            poly = patches.Polygon(corners[:, [1,0]], closed=True, facecolor=color, alpha=0.2, edgecolor=color)
            ax.add_patch(poly)

        # Plot path
        waypoints = drone["waypoints"]
        path_lats = [wp["lat"] for wp in waypoints]
        path_lons = [wp["lon"] for wp in waypoints]
        plt.plot(path_lons, path_lats, color=color, linewidth=2, label=f"Drone {i} path")

        # Add arrows to indicate direction
        for j in range(len(path_lats) - 1):
            dx = path_lons[j+1] - path_lons[j]
            dy = path_lats[j+1] - path_lats[j]
            plt.quiver(
                path_lons[j], path_lats[j], dx, dy,
                angles='xy', scale_units='xy', scale=1, width=0.003, color=color, alpha=0.7
            )

        # Plot start/endpoints
        start_wp = waypoints[0]
        end_wp = waypoints[-1]
        plt.scatter(start_wp["lon"], start_wp["lat"], color=color, marker=marker, s=120, edgecolor='black', label=f"Drone {i} start")
        plt.scatter(end_wp["lon"], end_wp["lat"], color=color, marker=marker, s=120, edgecolor='white', label=f"Drone {i} end", alpha=0.7)

    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.title("Multi-Drone Grid Assignment and Paths")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    plot_multi_drone("multi_drone_grid_assignment.json")
