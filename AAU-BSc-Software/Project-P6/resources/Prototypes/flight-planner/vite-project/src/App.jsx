import { useState, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./App.css";
import MapComponent from "./components/MapComponent";
import FlightStatusDisplay from "./components/FlightStatusDisplay";
import ConnectionModal from "./components/ConnectionModal";
import { io } from "socket.io-client";

function App() {
  const [polygonPositions, setPolygonPositions] = useState([]);
  const [gridData, setGridData] = useState(null);
  const [altitude, setAltitude] = useState(20); // Default altitude in meters
  const [overlap, setOverlap] = useState(20); // Default overlap percentage
  const [coverage, setCoverage] = useState(80); // Default coverage percentage
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("draw-area"); // 'draw-area', 'calculate', 'execute'
  const [flightExecuting, setFlightExecuting] = useState(false);
  const [flightStatus, setFlightStatus] = useState(null);
  const [showFlightStatus, setShowFlightStatus] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [droneConnected, setDroneConnected] = useState(false);
  const [droneHasGpsFix, setDroneHasGpsFix] = useState(false);
  const [dronePosition, setDronePosition] = useState(null);
  const [liveImage, setLiveImage] = useState(null);
  const [gridImages, setGridImages] = useState({});
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [waitingForDrone, setWaitingForDrone] = useState(false);

  const mapRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });
    setSocket(newSocket);

    // Reset reconnect attempts counter
    let reconnectAttempts = 0;

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setSocketConnected(true);
      reconnectAttempts = 0;

      // Hide connection modal if it's showing
      setShowConnectionModal(false);
    });

    // Prevent showing connection error modal during normal operation
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);

      reconnectAttempts++;

      // Only show the modal after multiple failed attempts and if we're not in the middle of drawing
      if (reconnectAttempts > 5 && !isDrawingOrEditing()) {
        setConnectionError(
          "Could not connect to the server. Please check if the server is running."
        );
        setShowConnectionModal(true);
      }

      // Auto reconnect
      setTimeout(() => {
        if (newSocket) {
          console.log(
            `Attempting to reconnect (attempt ${reconnectAttempts})...`
          );
          newSocket.connect();
        }
      }, 1000);
    });

    // Improved disconnect handling to avoid showing the modal when switching tasks
    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setSocketConnected(false);

      // Auto reconnect after a short delay without showing the modal
      setTimeout(() => {
        if (newSocket) {
          console.log("Attempting to reconnect...");
          newSocket.connect();
        }
      }, 1000);
    });

    // Helper function to check if user is in the middle of an action
    const isDrawingOrEditing = () => {
      // Check if we're in drawing mode or other interactive states
      return document.querySelector(".control-active") !== null;
    };

    // Drone status updates
    newSocket.on("drone_status", (data) => {
      console.log("Drone status update:", data);
      setDroneConnected(data.connected);
      if (data.position) {
        setDronePosition({
          lat: data.position[0],
          lon: data.position[1],
          altitude: data.position[2],
        });
      }
      setDroneHasGpsFix(data.has_gps_fix);

      // Update waiting status
      if (
        data.connected &&
        step === "draw-area" &&
        polygonPositions.length >= 3
      ) {
        setWaitingForDrone(false);
        if (data.has_gps_fix) {
          setStep("calculate");
        }
      }
    });

    // Drone position updates
    newSocket.on("drone_position", (data) => {
      // Check if coordinates are the error values (500, 500, 500)
      if (data.lat === 500 && data.lon === 500 && data.altitude === 500) {
        // Use default coordinates instead
        setDronePosition({
          lat: 57.012633,
          lon: 9.991049,
          altitude: 0,
        });
      } else {
        setDronePosition({
          lat: data.lat,
          lon: data.lon,
          altitude: data.altitude,
        });
      }
    });

    // GPS fix status updates
    newSocket.on("drone_gps_status", (data) => {
      setDroneHasGpsFix(data.has_gps_fix);

      // Auto-advance to calculate step if we have GPS fix and are waiting for drone
      if (data.has_gps_fix && waitingForDrone && polygonPositions.length >= 3) {
        setWaitingForDrone(false);
        setStep("calculate");
      }
    });

    // Video feed
    newSocket.on("video_frame", (data) => {
      setLiveImage(data.image);
    });

    // Grid photos
    newSocket.on("grid_photo", (data) => {
      setGridImages((prev) => ({
        ...prev,
        [data.grid_id]: data.image,
      }));
    });

    // Flight status updates
    newSocket.on("flight_status", (data) => {
      console.log("Flight status update:", data);
      setFlightStatus((prev) => ({
        ...prev,
        status: data.message || data.status,
        logs: prev?.logs
          ? [
              ...prev.logs,
              {
                action: data.status,
                timestamp: data.timestamp,
                ...(data.grid_id && { grid_id: data.grid_id }),
                ...(data.waypoint && { waypoint_num: data.waypoint.number }),
              },
            ]
          : [
              {
                action: data.status,
                timestamp: data.timestamp,
                ...(data.grid_id && { grid_id: data.grid_id }),
                ...(data.waypoint && { waypoint_num: data.waypoint.number }),
              },
            ],
        success:
          data.status === "mission_completed"
            ? true
            : data.status === "error"
            ? false
            : null,
      }));
    });

    // Grid calculation result
    newSocket.on("calculation_result", (data) => {
      console.log("Grid calculation result:", data);
      setGridData(data);
      setLoading(false);
      // Automatically move to execute step when calculation is complete
      setStep("execute");
    });

    // Grid calculation error
    newSocket.on("calculation_error", (data) => {
      console.error("Grid calculation error:", data.error);
      alert(`Error calculating grid: ${data.error}`);
      setLoading(false);
    });

    // Flight execution result
    newSocket.on("execution_result", (data) => {
      console.log("Flight execution result:", data);
      setFlightExecuting(false);
    });

    // Flight execution error
    newSocket.on("execution_error", (data) => {
      console.error("Flight execution error:", data.error);
      alert(`Flight execution error: ${data.error}`);
      setFlightExecuting(false);
      setFlightStatus((prev) => ({
        ...prev,
        status: "Flight execution error: " + data.error,
        success: false,
      }));
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [polygonPositions, step, waitingForDrone]);

  const handlePolygonCreated = (positions) => {
    setPolygonPositions(positions);

    // Always move to calculate step after polygon is created with enough points
    if (positions.length >= 3) {
      setStep("calculate");
    }
  };

  const handleCalculateGrids = () => {
    if (polygonPositions.length < 3) {
      alert("Please draw an area with at least 3 points");
      return;
    }

    if (!droneConnected) {
      alert("Drone is not connected");
      return;
    }

    if (!droneHasGpsFix) {
      alert("Waiting for GPS fix");
      return;
    }

    setLoading(true);

    // Use socket to request grid calculation
    socket.emit("calculate_grid", {
      coordinates: polygonPositions,
      altitude: altitude,
      overlap: overlap,
      coverage: coverage,
    });
  };

  const handleExecuteFlight = () => {
    if (!gridData || !gridData.path || gridData.path.length < 2) {
      alert("Please calculate grid coverage first");
      return;
    }

    if (!droneConnected || !droneHasGpsFix) {
      alert(
        "Drone is not ready. Please ensure it's connected and has GPS fix."
      );
      return;
    }

    if (
      !confirm(
        "Are you sure you want to execute this flight plan? The drone will take off and follow the planned path."
      )
    ) {
      return;
    }

    setFlightExecuting(true);
    setFlightStatus({
      status: "Initiating flight...",
      logs: [],
      success: null,
    });
    setShowFlightStatus(true);

    // Reset grid images when starting a new flight
    setGridImages({});

    // Use socket to request flight execution
    socket.emit("execute_flight", {
      waypoints: gridData.path,
      altitude: altitude,
    });
  };

  const handleClearAll = () => {
    setPolygonPositions([]);
    setGridData(null);
    setStep("draw-area");
    setFlightStatus(null);
    setShowFlightStatus(false);
    setGridImages({});
    setWaitingForDrone(false);
  };

  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="app-container">
      <h1>Drone Flight Planner</h1>

      {/* Connection status indicator */}
      <div className="connection-status">
        <div
          className={`status-indicator ${
            socketConnected ? "connected" : "disconnected"
          }`}
        >
          Server: {socketConnected ? "Connected" : "Disconnected"}
        </div>
        <div
          className={`status-indicator ${
            droneConnected ? "connected" : "disconnected"
          }`}
        >
          Drone: {droneConnected ? "Connected" : "Disconnected"}
          {droneConnected && !droneHasGpsFix && (
            <button
              className="retry-gps-button"
              onClick={() => socket.emit("connect_drone")}
              title="Retry drone connection"
            >
              Retry
            </button>
          )}
        </div>
        <div
          className={`status-indicator ${
            droneHasGpsFix ? "connected" : "disconnected"
          }`}
        >
          GPS Fix: {droneHasGpsFix ? "Yes" : "No"}
        </div>
        {dronePosition && dronePosition.lat !== 500 && (
          <div className="drone-position">
            Position: {dronePosition.lat.toFixed(6)},{" "}
            {dronePosition.lon.toFixed(6)}
          </div>
        )}
      </div>

      <div className="steps-container">
        <div className={`step ${step === "draw-area" ? "active" : ""}`}>
          1. Draw Area
        </div>
        <div className={`step ${step === "calculate" ? "active" : ""}`}>
          2. Calculate Coverage
        </div>
        <div
          className={`step ${
            step === "execute" && !flightExecuting ? "active" : ""
          }`}
        >
          3. Execute Flight
        </div>
        <div className={`step ${flightExecuting ? "active" : ""}`}>
          Flight in Progress
        </div>
      </div>

      <div className="controls-container">
        {/* Controls for the calculate step */}
        {step === "calculate" && (
          <>
            <div className="control-group">
              <label>Altitude (m):</label>
              <input
                type="number"
                value={altitude}
                onChange={(e) => setAltitude(parseInt(e.target.value) || 0)}
                min="1"
                max="40"
              />
            </div>

            <div className="control-group">
              <label>Overlap (%):</label>
              <input
                type="number"
                value={overlap}
                onChange={(e) => setOverlap(parseInt(e.target.value) || 0)}
                min="0"
                max="90"
              />
            </div>

            <div className="control-group">
              <label>Minimum Coverage (%):</label>
              <input
                type="number"
                value={coverage}
                onChange={(e) => setCoverage(parseInt(e.target.value) || 0)}
                min="0"
                max="90"
              />
            </div>

            <button
              onClick={handleCalculateGrids}
              disabled={loading}
              className="calculate-btn"
            >
              {loading ? "Calculating..." : "Calculate Grid Coverage"}
            </button>

            {/* Add a continue button only after calculation is complete */}
            {gridData && (
              <button
                onClick={() => setStep("execute")}
                className="continue-btn"
              >
                Continue to Execution
              </button>
            )}
          </>
        )}

        {/* Controls for the execute step */}
        {step === "execute" && gridData && (
          <button
            onClick={handleExecuteFlight}
            disabled={flightExecuting || !droneConnected || !droneHasGpsFix}
            className="execute-flight-btn"
          >
            {flightExecuting ? "Flight in Progress..." : "Execute Flight Plan"}
          </button>
        )}

        {/* Always show clear button */}
        <button onClick={handleClearAll} disabled={flightExecuting}>
          Clear All
        </button>
      </div>

      <div className="map-container">
        <MapComponent
          onPolygonCreated={handlePolygonCreated}
          gridData={gridData}
          polygon={polygonPositions}
          currentStep={step}
          dronePosition={dronePosition}
          gridImages={gridImages}
          ref={mapRef}
        />

        {waitingForDrone && (
          <div className="waiting-overlay">
            <div className="waiting-message">
              <div className="spinner"></div>
              <p>Waiting for drone connection and GPS fix...</p>
            </div>
          </div>
        )}
      </div>

      {gridData && gridData.path_metrics && step === "execute" && (
        <div className="grid-info">
          <h3>Grid Coverage</h3>
          <p>
            <strong>Total grids:</strong> {gridData.grid_count}
            <br />
            <strong>Altitude:</strong> {altitude} meters
            <br />
            <strong>Overlap:</strong> {overlap}%
            <br />
            <strong>Minimum coverage:</strong> {coverage}%
            <br />
            <strong>Path distance:</strong>{" "}
            {(gridData.path_metrics.total_distance / 1000).toFixed(2)} km
            <br />
            <strong>Estimated flight time:</strong>{" "}
            {formatTime(gridData.path_metrics.estimated_flight_time)}
          </p>
        </div>
      )}

      {/* Live video feed when available */}
      {liveImage && (
        <div className="live-video-container">
          <h3>Live Drone Feed</h3>
          <img
            src={`data:image/jpeg;base64,${liveImage}`}
            alt="Live drone feed"
            className="live-video-feed"
          />
        </div>
      )}

      {/* Flight status display */}
      {showFlightStatus && (
        <FlightStatusDisplay
          status={flightStatus}
          onClose={() => setShowFlightStatus(false)}
        />
      )}

      {/* Connection error modal */}
      {showConnectionModal && (
        <ConnectionModal
          error={connectionError}
          onClose={() => setShowConnectionModal(false)}
          onRetry={() => {
            if (socket) {
              socket.connect();
            }
            setShowConnectionModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
