import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import L from "leaflet";
import throttle from "lodash.throttle";

// This component now handles updating the drone's visual representation and clearing the trail
function DroneTracker({ map, resetKey }) {
  const { socket } = useSocket();
  const droneMarkerRef = useRef(null);
  const pathLayerRef = useRef(null);
  const positionsRef = useRef([]);
  const isMountedRef = useRef(true);
  const lastPositionRef = useRef(null); // Store last position to preserve drone marker position

  // Define icon within the component scope, ensure it's stable
  const droneIcon = useRef(
    L.icon({
      iconUrl: "/drone.svg",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      className: "drone-position-icon",
    })
  ).current;

  // Throttled marker update function
  const throttledUpdateMarkerPosition = useCallback(
    throttle(
      (position) => {
        if (droneMarkerRef.current) {
          droneMarkerRef.current.setLatLng(position);
          // Store last known position when we update the marker
          lastPositionRef.current = position;
        }
      },
      100,
      { leading: true, trailing: true }
    ),
    []
  );

  // Function to clear the drone trail but preserve the drone marker
  const clearDroneTrail = useCallback(() => {
    console.log("DroneTracker: Clearing drone trail (preserving drone marker)");

    // Reset the positions array but keep the last position if available
    if (lastPositionRef.current) {
      positionsRef.current = [lastPositionRef.current];
    } else {
      positionsRef.current = [];
    }

    // Reset the path layer if it exists
    if (pathLayerRef.current && map) {
      // If we have a last position, set the path to just that point
      // so it's ready for the next position update
      if (lastPositionRef.current) {
        pathLayerRef.current.setLatLngs([lastPositionRef.current]);
      } else {
        pathLayerRef.current.setLatLngs([]);
      }
    }

    // Don't remove the drone marker - just keep it where it is
  }, [map]);

  // Effect to clear trail when resetKey changes
  useEffect(() => {
    if (resetKey > 0) {
      clearDroneTrail();
    }
  }, [resetKey, clearDroneTrail]);

  useEffect(() => {
    isMountedRef.current = true;
    console.log("DroneTracker Effect: map=", !!map, "socket=", !!socket);

    if (!map || !socket) {
      console.log("DroneTracker Effect: Waiting for map and socket.");
      return;
    }

    console.log(
      "DroneTracker Effect: Map and socket ready. Setting up layers and listener."
    );

    // Initialize or ensure path layer exists
    if (!pathLayerRef.current) {
      pathLayerRef.current = L.polyline([], {
        color: "#fff", // Changed from "#ff4444" to white
        weight: 3,
        opacity: 0.7,
        dashArray: "5, 5",
      }).addTo(map);
      console.log("DroneTracker: Path layer created.");
    }

    const handleGpsUpdate = (data) => {
      if (!isMountedRef.current) return;

      const { latitude, longitude } = data;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        (latitude === 0 && longitude === 0)
      ) {
        return;
      }

      const position = [latitude, longitude];
      // Always update the last position reference
      lastPositionRef.current = position;

      // Create marker if it doesn't exist
      if (!droneMarkerRef.current) {
        console.log("DroneTracker: Creating drone marker at", position);
        droneMarkerRef.current = L.marker(position, { icon: droneIcon })
          .bindTooltip("Drone")
          .addTo(map);
      } else {
        // Use the throttled function to update position
        throttledUpdateMarkerPosition(position);
      }

      // Update path
      const lastPosition =
        positionsRef.current[positionsRef.current.length - 1];
      if (
        !lastPosition ||
        position[0] !== lastPosition[0] ||
        position[1] !== lastPosition[1]
      ) {
        positionsRef.current.push(position);
        if (pathLayerRef.current) {
          pathLayerRef.current.setLatLngs(positionsRef.current);
        }
      }
    };

    console.log("DroneTracker: Attaching gps_update listener.");
    socket.on("gps_update", handleGpsUpdate);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      console.log(
        "DroneTracker Cleanup: Removing gps_update listener and layers."
      );
      socket.off("gps_update", handleGpsUpdate);

      // Cancel any pending throttled calls on unmount
      throttledUpdateMarkerPosition.cancel();

      // Only remove layers when component unmounts completely
      if (droneMarkerRef.current && map) {
        map.removeLayer(droneMarkerRef.current);
        droneMarkerRef.current = null;
      }
      if (pathLayerRef.current && map) {
        map.removeLayer(pathLayerRef.current);
        pathLayerRef.current = null;
      }
    };
  }, [map, socket, droneIcon, throttledUpdateMarkerPosition]);

  return null;
}

export default DroneTracker;
