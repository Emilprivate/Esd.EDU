import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import { generateOptimalRoute } from "./services/routePlanner";
import "leaflet/dist/leaflet.css";
import "./App.css";

interface Point {
  lat: number;
  lng: number;
}

interface RoutePoint extends Point {
  order: number;
}

interface Settings {
  maxPoints: number;
  polygonColor: string;
  opacity: number;
}

interface DroneSettings {
  altitude: number;
  fieldOfView: number;
  overlapPercentage: number;
}

function MapEvents({
  points,
  setPoints,
  settings,
}: {
  points: Point[];
  setPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  settings: Settings;
}) {
  useMapEvents({
    click: (e) => {
      if (points.length < settings.maxPoints) {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPoints([...points, newPoint]);
        console.log(`Point ${points.length + 1} placed:`, newPoint);
      }
      if (points.length === settings.maxPoints - 1) {
        setTimeout(() => {
          console.log("Polygon coordinates:", [...points, points[0]]);
        }, 100);
      }
    },
  });
  return null;
}

function TopMenu({
  settings,
  setSettings,
  onReset,
  droneSettings,
  setDroneSettings,
  onGenerateRoute,
}: {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  onReset: () => void;
  droneSettings: DroneSettings;
  setDroneSettings: (settings: DroneSettings) => void;
  onGenerateRoute: () => void;
}) {
  return (
    <div className="top-menu">
      <div className="menu-item">
        <label>Number of Points:</label>
        <input
          type="number"
          min="3"
          max="10"
          value={settings.maxPoints}
          onChange={(e) =>
            setSettings({ ...settings, maxPoints: parseInt(e.target.value) })
          }
        />
      </div>
      <div className="menu-item">
        <label>Color:</label>
        <input
          type="color"
          value={settings.polygonColor}
          onChange={(e) =>
            setSettings({ ...settings, polygonColor: e.target.value })
          }
        />
      </div>
      <div className="menu-item">
        <label>Opacity:</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.opacity}
          onChange={(e) =>
            setSettings({ ...settings, opacity: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="menu-item">
        <label>Drone Altitude (m):</label>
        <input
          type="number"
          min="10"
          max="120"
          value={droneSettings.altitude}
          onChange={(e) =>
            setDroneSettings({
              ...droneSettings,
              altitude: parseInt(e.target.value),
            })
          }
        />
      </div>
      <div className="menu-item">
        <label>Overlap (%):</label>
        <input
          type="number"
          min="0"
          max="50"
          value={droneSettings.overlapPercentage}
          onChange={(e) =>
            setDroneSettings({
              ...droneSettings,
              overlapPercentage: parseInt(e.target.value),
            })
          }
        />
      </div>
      <button onClick={onReset}>Reset Points</button>
      <button onClick={onGenerateRoute}>Generate Route</button>
    </div>
  );
}

function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [settings, setSettings] = useState<Settings>({
    maxPoints: 4,
    polygonColor: "#0000ff",
    opacity: 0.2,
  });
  const center: [number, number] = [57.0488, 9.9217];
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [droneSettings, setDroneSettings] = useState<DroneSettings>({
    altitude: 50, // meters
    fieldOfView: 25, // meters
    overlapPercentage: 10, // percent
  });

  const generateRoute = () => {
    if (points.length < 3) return;
    const route = generateOptimalRoute(points, droneSettings);
    setRoutePoints(route);
  };

  const handleReset = () => {
    setPoints([]);
    setRoutePoints([]);
  };

  return (
    <div className="app-container">
      <TopMenu
        settings={settings}
        setSettings={setSettings}
        onReset={handleReset}
        droneSettings={droneSettings}
        setDroneSettings={setDroneSettings}
        onGenerateRoute={generateRoute}
      />
      <div className="map-container">
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents
            points={points}
            setPoints={setPoints}
            settings={settings}
          />
          {points.length >= 3 && (
            <Polygon
              positions={[...points, points[0]]}
              pathOptions={{
                color: settings.polygonColor,
                fillColor: settings.polygonColor,
                fillOpacity: settings.opacity,
              }}
            />
          )}
          {routePoints.length > 0 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "red",
                weight: 2,
                dashArray: "5,10",
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
