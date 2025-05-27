# Project-P6: Self-Controlled Aerial Navigation (SCAN)

## Overview
SCAN is a bachelor's project focused on developing an autonomous drone navigation system for aerial surveying and person detection. The system consists of:

- **Backend**: Python server for mission computation, drone control, and data processing (including YOLO-based object detection).
- **Frontend**: React + Vite web interface for mission planning, drone status, and data visualization.
- **Drone**: Parrot drone (real or simulated) executing automated flight missions.

---

## Features

- Define survey regions on an interactive map.
- Automated flight path generation considering camera FOV, overlap, and coverage.
- Real-time drone telemetry and mission status.
- Person detection using YOLO with annotated photo results.
- Mission logging and replay.

---

## Project Structure

```
/backend    # Python backend (drone control, mission logic, detection)
/frontend   # React frontend (UI, mission planning, visualization)
/backend/models     # YOLO models for detection (inside backend)
/backend/missions   # Saved mission logs and images
```

## Demo
[Demo Video](https://youtu.be/bhyAKbZ0iPA)

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Configuration (`config.py`)

Edit `/backend/config.py` to match your environment:

```python
SIMULATION_MODE = True  # True for simulation, False for real drone
MODEL_NAME = "best.pt"  # YOLO model filename (must be in /backend/models)
DRONE_IP = "192.168.53.1"  # Real drone IP (via SkyController)
SIMULATION_IP = "10.202.0.1"  # Simulation IP (Sphinx simulator)
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 5000
OUTPUT_LOG = False  # Set True for verbose backend logging
```

- **SIMULATION_MODE**:
  - `True` to use Parrot Sphinx simulator (no real drone needed).
  - `False` to connect to a real drone via SkyController.
- **MODEL_NAME**:
  - Name of the YOLO model file to use for detection (see below).
- **DRONE_IP / SIMULATION_IP**:
  - Set according to your drone or simulator network.
- **OUTPUT_LOG**:
  - Enable for detailed backend logs (useful for debugging).

#### Adding Your Own YOLO Model

1. Download or train a YOLO model (`.pt` file).
2. Place the model file in `/backend/models/` (e.g., `yolov12n.pt`, `yolov12x.pt`, or your custom model).
3. Update `MODEL_NAME` in `config.py` to match your model filename.

> **Tip:** Lighter models (e.g., `yolov12n.pt`) are faster but less accurate. Use larger models for better detection if your hardware allows.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## Running the Project

### 1. Start the Backend Server

```bash
cd backend
source .venv/bin/activate
python3 backend.py
```

- The backend will listen on the port specified in `config.py` (default: 5000).
- Make sure your drone or simulator is running and accessible.

### 2. Start the Frontend Server

```bash
cd ../frontend
npm run dev
```

- The frontend will start on [http://localhost:5173](http://localhost:5173) by default.

---

## Usage

1. Open the frontend in your browser.
2. Connect to the drone (real or simulated).
3. Draw a region on the map and configure mission parameters (altitude, overlap, coverage).
4. Calculate the grid and review the generated flight path.
5. Start the mission. The drone will fly autonomously, take photos, and run YOLO detection.
6. View mission results, detected persons, and download logs/images.

---

## Advanced

### Mission Data & Logs

- Completed missions are saved in `/backend/missions/<timestamp>/`.
- Each mission folder contains:
  - `log.json`: Flight log (actions, timestamps, etc.)
  - `mission.json`: Mission parameters and metadata
  - Captured and detected images (`.jpg`)

### Troubleshooting

- If you encounter connection issues:
  - Check `SIMULATION_MODE` and IP addresses in `config.py`.
  - Ensure the drone or simulator is powered on and reachable.
- For YOLO errors:
  - Verify your model file exists in `/backend/models/` and is compatible with Ultralytics YOLO.
- For detailed logs, set `OUTPUT_LOG = True` in `config.py`.

---

## Requirements

- Python 3.8+
- Node.js 16+
- Parrot Olympe SDK (for real drone/simulator)
- Ultralytics YOLO (installed via `requirements.txt`)
- See `/backend/requirements.txt` and `/frontend/package.json` for full dependency lists.

---

## License

This project is for educational purposes. See LICENSE file for details.

---

## Acknowledgements

- [Parrot Olympe SDK](https://developer.parrot.com/docs/olympe/)
- [Ultralytics YOLO](https://docs.ultralytics.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
