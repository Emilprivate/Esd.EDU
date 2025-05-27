# Flight Planner API

A simple API for generating drone flight plans for photogrammetry.

## Setup

1. Install the required dependencies:

```
pip install -r requirements.txt
```

2. Run the API server:

```
python main.py api
```

The server will start at http://localhost:8000

## API Usage

### Plan a Flight

**Endpoint:** `POST /api/plan-flight`

**Request Body:**

```json
{
  "coordinates": [
    [57.012722, 9.972037],
    [57.014961, 9.972057],
    [57.014928, 9.976627],
    [57.012684, 9.976727]
  ],
  "altitude": 50,
  "overlap": 20
}
```

- `coordinates`: Array of [lat, lon] pairs defining the polygon to survey (minimum 3 points)
- `altitude`: Flight altitude in meters
- `overlap`: Desired image overlap percentage (optional, default: 20)

**Response:**

```json
{
  "metadata": {
    "waypoint_count": 42,
    "created_at": "2023-04-12T14:25:36.789123",
    "altitude": 50,
    "overlap_percent": 20
  },
  "waypoints": [
    {
      "lat": 57.012345,
      "lon": 9.973456,
      "alt": 50,
      "action": "take_photo"
    },
    ...
  ]
}
```

### Health Check

**Endpoint:** `GET /health`

Returns a simple status check to verify the API is running.

## Example

You can also run the script directly to see an example:

```
python main.py
```

This will generate a flight plan for a sample area and save it to the `flight_plans` directory.
