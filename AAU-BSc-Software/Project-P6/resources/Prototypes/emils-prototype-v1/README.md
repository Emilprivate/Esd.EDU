# Drone Control System

This project implements an autonomous drone control system for Parrot Anafi drones.

## Requirements

- Node.js 18+ and npm
- **Python 3.10.13** (required by Parrot Olympe SDK)

## Installation

### Python 3.10.13 Installation

Before setting up the project, ensure you have Python 3.10.13 installed:

#### Arch Linux:
```bash
yay -S pyenv
pyenv install 3.10.13
pyenv local 3.10.13
```

#### macOS:
```bash
brew install pyenv
pyenv install 3.10.13
pyenv global 3.10.13
```

### Project Setup

Once Python 3.10.13 is installed:

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

## Development Scripts

- `npm run dev` - Start both frontend and backend servers
- `npm run frontend:dev` - Start only frontend development server
- `npm run backend:dev` - Start only backend server

## Backend API

The backend API is available at `http://localhost:5000/api/drone`.

### Endpoints:

- POST `/api/drone/takeoff` - Take off the drone
- POST `/api/drone/land` - Land the drone
- POST `/api/drone/test-flight` - Perform test flight (takeoff, hover, land)
- POST `/api/drone/move` - Move the drone (requires JSON body with x, y, z, angle parameters)

## Running Tests

### Physical Drone Tests (CAUTION)

⚠️ **IMPORTANT**: Physical drone tests should be run individually with caution.

#### Using the test runner script

```bash
# Make the script executable (first time only)
chmod +x run_test.py

# List available test modules
./run_test.py --list

# Run a specific test module
./run_test.py tests.drone_tests.test_takeoff_land
./run_test.py tests.drone_tests.test_movement
```

### API Tests (No Drone Hardware Required)

```bash
# Run API tests (when implemented)
npm run test:api
```

### Test Configuration

You can override the drone IP address for testing:

```bash
export DRONE_IP="192.168.42.1"
./run_test.py tests.drone_tests.test_takeoff_land
```
