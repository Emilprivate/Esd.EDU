# Project-P6: Self Controlled Aerial Navigation (SCAN)

## Overview
The bachelor's project SCAN (Self-Controlled Aerial Navigation) focuses on developing an autonomous navigation system for drones. The system consists of:

- A backend server for computation and data transmission
- A user-friendly frontend interface for mission configuration and data visualization
- A drone to execute automated flight operations

Users can define regions on an interactive map, and the drone autonomously optimizes its flight path considering factors like camera field of view, elevation, and environmental parameters. It also includes person detection and location mapping within surveyed areas.

## Project Structure

- `src/backend`: Python backend application
- `src/frontend`: React + Vite frontend application

## Installation

- 1. Clone the repository:
- 2. Setup python environment and install dependencies:

```bash
cd src/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

- 3. Install frontend dependencies:

```bash
cd src/frontend
npm install
```

## Running the project

- 1. Start the backend server:

```bash
cd src
source .venv/bin/activate
python3 backend.py
```

- 2. Start the frontend server:

```bash
cd src/frontend
npm run dev
```
