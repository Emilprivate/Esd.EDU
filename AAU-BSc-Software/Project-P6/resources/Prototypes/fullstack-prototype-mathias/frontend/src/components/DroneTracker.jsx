import { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import L from "leaflet";

function DroneTracker({ map }) {
  const { socket, motionState, batteryPercent } = useSocket();
  const [gpsData, setGpsData] = useState({
    latitude: 0,
    longitude: 0,
    altitude: 0,
  });
  const droneMarkerRef = useRef(null);
  const pathLayerRef = useRef(null);
  const positionsRef = useRef([]);

  // Create custom drone icon
  const droneIcon = L.icon({
    iconUrl: "/drone.svg", // Use the SVG from public folder
    iconSize: [24, 24],    // Make it small
    iconAnchor: [12, 12],
    className: "drone-position-icon",
  });

  useEffect(() => {
    if (!map) return;
    if (!socket) return;

    // Initialize path layer
    pathLayerRef.current = L.polyline([], {
      color: "#ff4444",
      weight: 3,
      opacity: 0.7,
      dashArray: "5, 5",
    }).addTo(map);

    // Only use socket if it exists
    if (!socket) return;

    // Listen for GPS updates
    const handleGpsUpdate = (data) => {
      setGpsData(data);

      const { latitude, longitude } = data;

      // Only update if we have valid coordinates
      if (latitude === 0 && longitude === 0) return;

      const position = [latitude, longitude];

      // Create marker if it doesn't exist yet
      if (!droneMarkerRef.current) {
        droneMarkerRef.current = L.marker(position, { icon: droneIcon })
          .bindTooltip("Drone")
          .addTo(map);
      } else {
        // Update marker position
        droneMarkerRef.current.setLatLng(position);
      }

      // Update path if position has changed
      if (
        positionsRef.current.length === 0 ||
        position[0] !==
          positionsRef.current[positionsRef.current.length - 1][0] ||
        position[1] !== positionsRef.current[positionsRef.current.length - 1][1]
      ) {
        positionsRef.current.push(position);
        pathLayerRef.current.setLatLngs(positionsRef.current);
      }
    };

    socket.on("gps_update", handleGpsUpdate);

    return () => {
      socket.off("gps_update", handleGpsUpdate);

      // Clean up layers
      if (droneMarkerRef.current) {
        map.removeLayer(droneMarkerRef.current);
      }

      if (pathLayerRef.current) {
        map.removeLayer(pathLayerRef.current);
      }
    };
  }, [map, socket]);

  // Determine if GPS is valid
  const hasValidGps =
    gpsData &&
    typeof gpsData.latitude === "number" &&
    typeof gpsData.longitude === "number" &&
    typeof gpsData.altitude === "number" &&
    !(gpsData.latitude === 0 && gpsData.longitude === 0);

  // Display current GPS data and motion state
  return (
    <div className="drone-gps-info">
      <h4>Live Drone Position</h4>
      <div className="gps-coordinates">
        <p>
          <strong>Motion:</strong>{" "}
          {motionState
            ? motionState.charAt(0).toUpperCase() + motionState.slice(1)
            : "Unknown"}
        </p>
        <p>
          <strong>Battery:</strong>{" "}
          {batteryPercent !== null ? `${batteryPercent}%` : "Unknown"}
        </p>
        {hasValidGps ? (
          <>
            <p><strong>Latitude:</strong> {gpsData.latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> {gpsData.longitude.toFixed(6)}</p>
            <p><strong>Altitude:</strong> {gpsData.altitude.toFixed(2)}m</p>
          </>
        ) : (
          <p>Drone has no GPS signal</p>
        )}
      </div>
    </div>
  );
}

export default DroneTracker;
