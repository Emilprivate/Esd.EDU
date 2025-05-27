import { useState, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./App.css";
import MapComponent from "./components/MapComponent";
import FlightStatusDisplay from "./components/FlightStatusDisplay";
import { useSocket } from "./context/SocketContext";

function App() {
  const [polygonPositions, setPolygonPositions] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [altitude, setAltitude] = useState(20);
  const [overlap, setOverlap] = useState(20);
  const [coverage, setCoverage] = useState(80);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("draw-area");
  const [flightExecuting, setFlightExecuting] = useState(false);
  const [flightStatus, setFlightStatus] = useState(null);
  const [showFlightStatus, setShowFlightStatus] = useState(false);
  const [flightMode, setFlightMode] = useState("stable");
  const [connectingDrone, setConnectingDrone] = useState(false);
  const [flightLogs, setFlightLogs] = useState([]);
  const [flightStep, setFlightStep] = useState("idle"); // idle | in_progress | complete
  const [photoMap, setPhotoMap] = useState({}); // index -> { filename, lat, lon, photo_base64 }
  const mapRef = useRef(null);

  const {
    connected,
    droneConnected,
    calculateGrid,
    executeFlight,
    connectDrone,
    disconnectDrone,
    gps,
    gpsSignal,
    motionState,
    socket,
  } = useSocket();

  // Listen for flight_log events and append to flightLogs
  useEffect(() => {
    if (!socket) return;
    const handleFlightLog = (log) => {
      setFlightLogs((prev) => [...prev, log]);
      if (
        log.action &&
        typeof log.action === "string" &&
        log.action.toLowerCase() === "complete"
      ) {
        setFlightStep("complete");
      }
    };
    socket.on("flight_log", handleFlightLog);
    return () => {
      socket.off("flight_log", handleFlightLog);
    };
  }, [socket]);

  // Listen for photo_update events and update photoMap
  useEffect(() => {
    if (!socket) return;
    const handlePhotoUpdate = (data) => {
      if (typeof data.index === "number") {
        setPhotoMap((prev) => ({
          ...prev,
          [data.index]: data,
        }));
      }
    };
    socket.on("photo_update", handlePhotoUpdate);
    return () => {
      socket.off("photo_update", handlePhotoUpdate);
    };
  }, [socket]);

  const handlePolygonCreated = (positions) => {
    setPolygonPositions(positions);
  };

  const handleStartPointSet = (point) => {
    setStartPoint(point);
  };

  const handleStepComplete = () => {
    if (step === "draw-area") {
      setStartPoint(gps ? [gps.latitude, gps.longitude] : null); // Set start point to drone position
      setStep("complete");
    } else if (step === "set-start") {
      setStep("complete");
    }
  };

  const handleClearAll = () => {
    setPolygonPositions([]);
    setStartPoint(null);
    setGridData(null);
    setStep("draw-area");
    setFlightStatus(null);
    setShowFlightStatus(false);
    setFlightLogs([]);
    setFlightStep("idle");
    if (mapRef.current && typeof mapRef.current.clearAll === "function") {
      mapRef.current.clearAll();
    }
  };

  const handleGenerateGrids = async () => {
    // Always set startPoint to latest GPS before calculating grid
    let actualStartPoint =
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number"
        ? [gps.latitude, gps.longitude]
        : null;
    setStartPoint(actualStartPoint);

    if (polygonPositions.length < 3 || !actualStartPoint) {
      alert("Please complete all steps first");
      return;
    }

    setLoading(true);

    try {
      const response = await calculateGrid({
        coordinates: polygonPositions,
        altitude: altitude,
        overlap: overlap,
        coverage: coverage,
        start_point: actualStartPoint,
      });

      // Extract waypoints and start_point separately
      setGridData({
        ...response,
        waypoints: response.waypoints || [],
        start_point: response.start_point || null,
      });
    } catch (error) {
      console.error("Error generating grid layout:", error.message);
      alert(`Error generating grid layout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFlight = async () => {
    if (!gridData || !gridData.waypoints || gridData.waypoints.length < 1) {
      alert("Please calculate grid coverage first");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to execute this flight plan in ${flightMode.toUpperCase()} mode? The drone will take off and follow the planned path.`
      )
    ) {
      return;
    }

    setFlightStep("in_progress");
    setFlightLogs([]);
    try {
      await executeFlight({
        waypoints: gridData.waypoints,
        altitude: altitude,
        flight_mode: flightMode,
        start_point: gridData.start_point, // send start_point separately
      });
      // The flightStep will be set to "complete" when the "complete" log arrives
    } catch (error) {
      setFlightStep("idle");
      alert("Flight execution error: " + error.message);
    }
  };

  const handleConnectDrone = async () => {
    if (droneConnected) {
      // Disconnect from drone
      setConnectingDrone(true);
      try {
        await disconnectDrone();
      } catch (error) {
        console.error("Error disconnecting from drone:", error.message);
        alert(`Failed to disconnect from drone: ${error.message}`);
      } finally {
        setConnectingDrone(false);
      }
    } else {
      // Connect to drone
      setConnectingDrone(true);
      try {
        await connectDrone();
      } catch (error) {
        console.error("Error connecting to drone:", error.message);
        alert(`Failed to connect to drone: ${error.message}`);
      } finally {
        setConnectingDrone(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Compute progress from flightLogs
  let progress = null;
  if (flightStep === "in_progress" && flightLogs.length > 0) {
    // Find last move_to_waypoint log
    const lastMove = [...flightLogs]
      .reverse()
      .find(
        (log) =>
          log.action &&
          typeof log.action === "string" &&
          log.action.toLowerCase().includes("move_to_waypoint") &&
          log.message &&
          log.message.match(/waypoint (\d+)\/(\d+)/)
      );
    if (lastMove) {
      const match = lastMove.message.match(/waypoint (\d+)\/(\d+)/);
      if (match) {
        progress = {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        };
      }
    }
  }

  return (
    <div className="fullscreen-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-title">Drone Grid Coverage Calculator</div>
        <div className="header-status">
          <span
            className={`status-indicator ${
              connected ? "connected" : "disconnected"
            }`}
          ></span>
          <span>{connected ? "Server Connected" : "Server Disconnected"}</span>
          <button
            className={`drone-connect-btn ${droneConnected ? "connected" : ""}`}
            onClick={handleConnectDrone}
            disabled={!connected || connectingDrone}
          >
            {connectingDrone
              ? "Connecting..."
              : droneConnected
              ? "Disconnect Drone"
              : "Connect Drone"}
          </button>
          {droneConnected && (
            <span className="drone-status">Drone Connected</span>
          )}
        </div>
      </header>
      {/* Main split layout */}
      <div className="main-content">
        {/* Left: Large Map */}
        <div className="main-map-area">
          <div
            className="map-container"
            style={{ position: "relative", height: "100%" }}
          >
            <MapComponent
              onPolygonCreated={handlePolygonCreated}
              onStartPointSet={handleStartPointSet}
              onStepComplete={handleStepComplete}
              gridData={gridData}
              polygon={polygonPositions}
              startPoint={startPoint}
              currentStep={step}
              ref={mapRef}
              droneGps={gpsSignal ? null : gps}
              connected={connected}
              droneConnected={droneConnected}
              gps={gps}
              gpsSignal={gpsSignal}
              photoMap={photoMap} // Pass photoMap to MapComponent
            />
            {gridData && gridData.path_metrics && (
              <div
                className="flight-plan-info"
                style={{
                  position: "absolute",
                  left: 20,
                  bottom: 20,
                  zIndex: 1000,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: "16px 20px",
                  minWidth: "220px",
                  maxWidth: "320px",
                  fontSize: "15px",
                  border: "1px solid #ddd",
                  pointerEvents: "auto",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 10 }}>Flight plan</h3>
                <p style={{ margin: 0 }}>
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
          </div>
        </div>
        {/* Right: Steps/Controls */}
        <div className="main-sidebar">
          {/* Stepper */}
          <div className="stepper-container">
            <div className="stepper-labels">
              <span>Draw Area</span>
              <span>Calculate Coverage</span>
              <span>Execute Flight</span>
            </div>
            <div className="stepper">
              <div
                className={`stepper-circle${
                  step === "draw-area" ? " active" : ""
                }${step !== "draw-area" ? " completed" : ""}`}
              ></div>
              <div
                className={`stepper-line${
                  step !== "draw-area" ? " filled" : ""
                }`}
              ></div>
              <div
                className={`stepper-circle${
                  step === "complete" && flightStep === "idle" ? " active" : ""
                }${gridData ? " completed" : ""}`}
              ></div>
              <div className={`stepper-line${gridData ? " filled" : ""}`}></div>
              <div
                className={`stepper-circle${
                  flightStep === "in_progress" || flightStep === "complete"
                    ? " active"
                    : ""
                }${flightStep === "complete" ? " completed" : ""}`}
              ></div>
            </div>
          </div>
          {/* Controls and Flight Progress */}
          <div className="controls-container-vertical">
            {flightStep === "in_progress" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  margin: "40px 0",
                }}
              >
                <div
                  className="spinner"
                  style={{ width: 48, height: 48, marginBottom: 16 }}
                />
                <div style={{ fontWeight: 500, fontSize: "1.1em" }}>
                  Flight in progress...
                </div>
                {progress && (
                  <div
                    style={{ marginTop: 10, fontSize: "1em", color: "#555" }}
                  >
                    {progress.current} / {progress.total} waypoints completed
                  </div>
                )}
              </div>
            )}
            {flightStep === "complete" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  margin: "40px 0",
                }}
              >
                <div
                  style={{
                    fontSize: "2em",
                    color: "#4caf50",
                    marginBottom: 10,
                  }}
                >
                  ✔️
                </div>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: "1.1em",
                    marginBottom: 10,
                  }}
                >
                  Flight complete!
                </div>
                <button onClick={handleClearAll} style={{ minWidth: 120 }}>
                  Ok
                </button>
              </div>
            )}
            {flightStep === "idle" && step === "complete" && (
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
                <div className="control-group">
                  <label>Flight Mode:</label>
                  <select
                    value={flightMode}
                    onChange={(e) => setFlightMode(e.target.value)}
                    className="flight-mode-select"
                  >
                    <option value="stable">Stable (Stop at waypoints)</option>
                    <option value="rapid">Rapid (Continuous flight)</option>
                  </select>
                </div>
                <button onClick={handleGenerateGrids} disabled={loading}>
                  {loading ? "Calculating..." : "Calculate Grid Coverage"}
                </button>
                {gridData && (
                  <button
                    onClick={handleExecuteFlight}
                    disabled={flightStep === "in_progress"}
                    className="execute-flight-btn"
                  >
                    {flightStep === "in_progress"
                      ? "Flight in Progress..."
                      : `Execute Flight Plan (${flightMode.toUpperCase()} mode)`}
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleClearAll}
              disabled={flightStep === "in_progress"}
            >
              Clear All
            </button>
          </div>
          {/* Divider and Flight Log */}
          {(flightStep === "in_progress" || flightLogs.length > 0) && (
            <>
              <div className="sidebar-divider" />
              <div className="flight-log-panel">
                <div className="flight-log-title">Flight Log</div>
                <div className="flight-log-list">
                  {flightLogs.length === 0 && (
                    <div className="flight-log-empty">No logs yet.</div>
                  )}
                  {flightLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flight-log-entry flight-log-${
                        log.action?.toLowerCase() || ""
                      }`}
                    >
                      <span className="flight-log-time">
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleTimeString()
                          : ""}
                      </span>
                      <span className="flight-log-action">{log.action}</span>
                      <span className="flight-log-message">
                        {log.message || log.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
