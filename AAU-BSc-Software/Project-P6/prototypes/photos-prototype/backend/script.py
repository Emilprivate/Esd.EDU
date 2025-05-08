# ====== Imports ======
from flask import Flask
from flask_socketio import SocketIO
import olympe
import time, math, datetime, threading, os, sys
import numpy as np
from shapely.geometry import Polygon
from olympe.messages.ardrone3.PilotingState import PositionChanged, FlyingStateChanged, moveToChanged, MotionState
from olympe.messages.ardrone3.Piloting import TakeOff, Landing, moveTo, moveBy
from olympe.messages.ardrone3.GPSSettingsState import GPSFixStateChanged
from olympe.messages.common.CommonState import BatteryStateChanged
from olympe.enums.ardrone3.Piloting import MoveTo_Orientation_mode
from olympe.enums.ardrone3.PilotingState import MoveToChanged_Status
import eventlet
import eventlet.wsgi
import asyncio
import gc
from olympe.messages.camera import (
                    take_photo,
                    photo_progress
                )
import os
import queue
from olympe.messages.camera import set_camera_mode
from olympe.enums.camera import camera_mode

# ====== Configuration ======
DRONE_IP = "10.202.0.1"
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"

# ====== Flask & SocketIO Setup ======
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

global_state = {
    'drone': None,
    'connected': False,
    'gps_ready': False,
    'gps_data': {'latitude':0, 'longitude':0, 'altitude':0},
    'gps_changed': False,
    'motion_state': 'unknown',
    'battery': 0
}

event_queue = queue.Queue()

# ====== FlightListener ======
class FlightListener(olympe.EventListener):
    @olympe.listen_event(PositionChanged(_policy='wait'))
    def on_position(self, event, scheduler):
        args = event.args
        lat, lon, alt = args['latitude'], args['longitude'], args['altitude']

        valid = (
            isinstance(lat, (int, float)) and isinstance(lon, (int, float)) and isinstance(alt, (int, float))
            and math.isfinite(lat) and math.isfinite(lon) and math.isfinite(alt)
            and -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
        )
        if not valid:
            if global_state['gps_ready']:
                global_state['gps_ready'] = False
                print("Invalid GPS coordinates received, dropping update")
            return

        prev = global_state['gps_data']
        if (prev['latitude'] != lat or prev['longitude'] != lon or prev['altitude'] != alt):
            global_state['gps_data']    = {'latitude': lat, 'longitude': lon, 'altitude': alt}
            global_state['gps_ready']   = True
            global_state['gps_changed'] = True

    @olympe.listen_event(MotionState(_policy='wait'))
    def on_motion(self, event, scheduler):
        state = str(event.args['state']).split('.')[-1].lower()
        global_state['motion_state'] = state

    @olympe.listen_event(BatteryStateChanged(_policy='wait'))
    def on_battery(self, event, scheduler):
        global_state['battery'] = event.args['percent']

    @olympe.listen_event(GPSFixStateChanged(_policy='wait'))
    def on_gps_fix(self, event, scheduler):
        if event.args['fixed']:
            global_state['gps_ready'] = True

# ====== FlightControl ======
class FlightControl:
    def __init__(self):
        self.drone = None

    def _initialize_states(self):
        try:
            battery_state = self.drone.get_state(BatteryStateChanged)
            if battery_state and "percent" in battery_state:
                global_state['battery'] = battery_state["percent"]
                print(f"Initial battery level: {global_state['battery']}%")
        except Exception as be:
            print(f"Could not get initial battery state: {be}")

        try:
            motion_state = self.drone.get_state(MotionState)
            if motion_state and "state" in motion_state:
                raw = str(motion_state["state"])
                global_state['motion_state'] = raw.split('.')[-1].lower()
                print(f"Initial motion state: {global_state['motion_state']}")
        except Exception as me:
            print(f"Could not get initial motion state: {me}")

    def connect(self):
        if not global_state['connected']:
            self.drone = olympe.Drone(DRONE_IP)
            self.drone.connect()
            self._initialize_states()
            self.listener = FlightListener(self.drone)
            self.listener.__enter__()
            global_state['connected'] = True
            return {'success':True}

    def disconnect(self):
        if self.drone:
            self.listener.__exit__(None,None,None)
            self.drone.disconnect()
            global_state['connected'] = False
            global_state['gps_ready'] = False
            return {'success':True}

    def execute_plan(self, waypoints, altitude, mode='stable'):
        log=[]; success=False
        try:
            if mode=='stable': self._stable(waypoints, altitude)
            else: self._rapid(waypoints, altitude)
            success=True
        except Exception as e:
            log.append({'error':str(e)})
        return {'success':success,'log':log,'mode':mode}

    def _stable(self, wps, alt):
        d=self.drone; log=[]
        d(TakeOff()>>FlyingStateChanged(state='hovering',_timeout=5)).wait()
        d(moveBy(0,0,-alt,0)>>FlyingStateChanged(state='hovering',_timeout=10)).wait()
        for wp in wps:
            d(moveTo(wp['lat'],wp['lon'],alt,MoveTo_Orientation_mode.TO_TARGET,0.0)
              >>moveToChanged(status=MoveToChanged_Status.DONE,_timeout=30)).wait()
            if wp['type']=='grid_center': 
                                # Take a photo at grid center
                # Create photos directory if it doesn't exist
                os.makedirs("photos", exist_ok=True)

                # Generate a unique filename with timestamp
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"photos/grid_photo_{timestamp}.jpg"
                d(set_camera_mode(cam_id=0, value="photo")).wait()

                # Take the photo and wait for completion
                photo_result = d(take_photo(cam_id=0) >> 
                                photo_progress(result="photo_saved", _timeout=10)
                              ).wait()

                if photo_result.success():
                    print(f"Photo taken at grid center, saving to {filename}")
                    # Get the media info to download the photo
                    media_id = photo_result.received_events()[-1].args["media_id"]
                
                    for i in range(1000):
                        print(f"KURWAA!!!!!!{media_id}")
                    d.download_media(media_id, filename)
                    log.append({"photo": filename})
                else:
                    log.append({"error": "Failed to take photo"})

        d(Landing()>>FlyingStateChanged(state='landed',_timeout=10)).wait()

    def _rapid(self, wps, alt):
        d=self.drone
        d(TakeOff()>>FlyingStateChanged(state='hovering',_timeout=5)).wait()
        d(moveBy(0,0,-alt,0)>>FlyingStateChanged(state='hovering',_timeout=10)).wait()
        for wp in wps:
            d(moveTo(wp['lat'],wp['lon'],alt,MoveTo_Orientation_mode.TO_TARGET,0.0))
            if wp['type']=='grid_center': time.sleep(0.1)
        d(moveTo(wps[0]['lat'],wps[0]['lon'],alt,MoveTo_Orientation_mode.TO_TARGET,0.0)
          >>moveToChanged(status=MoveToChanged_Status.DONE,_timeout=30)).wait()
        d(Landing()>>FlyingStateChanged(state='landed',_timeout=10)).wait()

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

def calculate_grid_plan(coordinates, altitude, overlap, coverage, start_point=None):
    """Main function to calculate grid and flight path"""
    coverage = (1 - coverage) / 100
    
    if not coordinates or len(coordinates) < 3:
        raise ValueError("At least 3 coordinates are required")
    if altitude <= 0 or altitude > 40:
        raise ValueError("Altitude must be between 0 and 40 meters")
    if not (0 <= overlap <= 100):
        raise ValueError("Overlap percentage must be between 0 and 100")

    grid_data = calculate_grid_placement(coordinates, altitude, overlap, coverage)
    
    optimized_grid_data, waypoints, path_metrics = optimize_tsp_path(grid_data, start_point)

    
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
            "created_at": datetime.datetime.now().isoformat(),
        }
    }

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

# ====== SocketIO Routes ======
flight = FlightControl()
@socketio.on('connect')
def on_connect(): socketio.emit('drone_status',{'connected':global_state['connected'],'gps_ready':global_state['gps_ready']})

@socketio.on('connect_drone')
def connect_drone(data): r=flight.connect(); socketio.emit('drone_status',{'connected':global_state['connected'],'gps_ready':global_state['gps_ready']}); return r

@socketio.on('disconnect_drone')
def disconnect_drone(data): r=flight.disconnect(); socketio.emit('drone_status',{'connected':global_state['connected'],'gps_ready':global_state['gps_ready']}); return r

@socketio.on('get_position')
def get_position(data):
    if not global_state['gps_ready']:
        return {'error': 'Drone is not ready. Wait for valid GPS coordinates.'}
    gd = global_state['gps_data']
    socketio.emit('gps_update', {**gd, 'motion_state': global_state['motion_state']})
    return {'position': gd, 'motion': global_state['motion_state']}

@socketio.on('calculate_grid')
def calc_grid(data):
    if not global_state['gps_ready']:
        return {'error': 'Drone is not ready. Wait for valid GPS coordinates before calculating grid.'}
    return calculate_grid_plan(data['coordinates'],float(data['altitude']),float(data['overlap']),float(data['coverage']),data.get('start_point'))

@socketio.on('execute_flight')
def exec_flight(data):
    if not global_state['gps_ready']:
        event_queue.put(('flight_log', {
            'action': 'Error',
            'message': 'Drone is not ready. Wait for valid GPS coordinates before executing flight.',
            'timestamp': datetime.datetime.now().isoformat()
        }))
        return {'error':'Drone is not ready. Wait for valid GPS coordinates before executing flight.'}

    threading.Thread(
        target=_async_execute_flight,
        args=(data,),
        daemon=True
    ).start()
    return {'success': True}

def _async_execute_flight(data):
    mode = data.get('flight_mode', 'stable')
    start_time = datetime.datetime.now()
    
    event_queue.put(('flight_log', {
        'action': 'Start',
        'message': f'Beginning flight in {mode} mode',
        'mode': mode,
        'timestamp': start_time.isoformat()
    }))
    
    print(f"Starting flight in {mode} mode")
    
    try:
        res = flight.execute_plan(data['waypoints'], float(data['altitude']), mode)
        success_status = res.get('success', False)
        print(f"Flight execution finished: success={success_status}")
        
        complete_result = {
            'success': success_status,
            'log': res.get('log', []),
            'mode': mode
        }
        
    except Exception as e:
        print(f"Exception in flight execution: {e}")
        complete_result = {'success': False, 'log': [{'error': str(e)}], 'mode': mode}
    
    for entry in complete_result.get('log', []):
        if isinstance(entry, dict) and 'error' in entry:
            event_queue.put(('flight_log', {
                'action': 'Error',
                'message': entry['error'],
                'timestamp': datetime.datetime.now().isoformat()
            }))
        else:
            event_queue.put(('flight_log', {
                'action': 'Log',
                'message': str(entry),
                'timestamp': datetime.datetime.now().isoformat()
            }))

    completion_time = datetime.datetime.now()
    success_status = complete_result.get("success", False)

    event_queue.put(('flight_success', {
        'success': success_status,
        'timestamp': completion_time.isoformat()
    }))
    
    event_queue.put(('flight_log', {
        'action': 'Complete',
        'message': f'Flight {"succeeded" if success_status else "failed"}',
        'success': success_status,
        'timestamp': completion_time.isoformat()
    }))
    
    time.sleep(0.5)
    gc.collect()

@socketio.on('get_drone_status')
def get_drone_status(data):
    return {'connected': global_state['connected'], 'gps_ready': global_state['gps_ready']}

@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected')

# ====== Background Tasks ======
def background_loop():
    while True:
        if global_state['connected']:
            if global_state['gps_ready'] and global_state['gps_changed']:
                socketio.emit('gps_update', global_state['gps_data'])
                global_state['gps_changed'] = False
            socketio.emit('motion_update', {'motion_state': global_state['motion_state']})
            socketio.emit('battery_update', {'battery_percent':global_state['battery']})
        socketio.sleep(0.2)

eventlet.spawn_n(background_loop)

def process_event_queue():
    while True:
        try:
            event_type, event_data = event_queue.get(block=True, timeout=0.1)
            
            if event_type == 'flight_log':
                socketio.emit('flight_log', event_data)
            elif event_type == 'flight_success':
                socketio.emit('flight_success', event_data)
            elif event_type == 'gps_update':
                socketio.emit('gps_update', event_data)
        except queue.Empty:
            pass
        except Exception as e:
            print(f"Error processing event: {e}")
        
        socketio.sleep(0.05)

eventlet.spawn(process_event_queue)

# ====== Main ======
if __name__=='__main__':
    print(f"Starting Flask-SocketIO server on {DEFAULT_HOST}:{DEFAULT_PORT}")
    socketio.run(app, host=DEFAULT_HOST, port=DEFAULT_PORT)