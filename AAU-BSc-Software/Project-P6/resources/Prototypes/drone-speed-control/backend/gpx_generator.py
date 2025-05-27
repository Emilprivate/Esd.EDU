import datetime
import os
import logging

def save_to_gpx(waypoints, altitude, filename=None):
    """Save waypoints to a GPX file in an organized directory structure"""
    timestamp = datetime.datetime.now()
    date_str = timestamp.strftime("%Y-%m-%d")
    time_str = timestamp.strftime("%H-%M-%S")
    
    # Create base missions directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    missions_dir = os.path.join(base_dir, 'missions')
    
    # Create date-based directory structure
    date_dir = os.path.join(missions_dir, date_str)
    
    # Create directories if they don't exist
    os.makedirs(date_dir, exist_ok=True)
    
    # Generate filename if not provided
    if filename is None:
        filename = f"mission_{time_str}.gpx"
    
    filepath = os.path.join(date_dir, filename)
    
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
    return os.path.relpath(filepath, base_dir)  # Return relative path from project root
