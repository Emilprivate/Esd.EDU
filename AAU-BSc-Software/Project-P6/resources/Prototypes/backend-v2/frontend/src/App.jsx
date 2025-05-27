import { useState, useRef } from "react";
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
  const mapRef = useRef(null);

  const { connected, droneConnected, calculateGrid, executeFlight, connectDrone, disconnectDrone } = useSocket();

  const handlePolygonCreated = (positions) => {
    setPolygonPositions(positions);
  };

  const handleStartPointSet = (point) => {
    setStartPoint(point);
  };

  const handleStepComplete = () => {
    if (step === "draw-area") {
      setStep("set-start");
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
  };

  const handleGenerateGrids = async () => {
    if (polygonPositions.length < 3 || !startPoint) {
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
        start_point: startPoint,
      });

      setGridData(response);
    } catch (error) {
      console.error("Error generating grid layout:", error.message);
      alert(`Error generating grid layout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFlight = async () => {
    if (!gridData || !gridData.path || gridData.path.length < 2) {
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

    setFlightExecuting(true);
    setFlightStatus({
      status: "Connecting to drone...",
      logs: [],
      success: null,
    });
    setShowFlightStatus(true);

    try {
      const response = await executeFlight({
        waypoints: gridData.path,
        altitude: altitude,
        flight_mode: flightMode, // Ensure this is sent to the backend
      });

      setFlightStatus({
        status: response.success
          ? `Flight completed successfully (${flightMode.toUpperCase()} mode)`
          : "Flight execution failed",
        logs: response.execution_log,
        success: response.success,
        metadata: response.metadata,
        flight_mode: response.flight_mode,
      });
    } catch (error) {
      console.error("Error executing flight:", error.message);
      setFlightStatus({
        status: "Flight execution error",
        logs: [
          {
            action: "error",
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        ],
        success: false,
      });
    } finally {
      setFlightExecuting(false);
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

  return (
    <div className="app-container">
      <h1>Drone Grid Coverage Calculator</h1>

      <div className="connection-status">
        <span
          className={`status-indicator ${
            connected ? "connected" : "disconnected"
          }`}
        ></span>
        <span>{connected ? "Server Connected" : "Server Disconnected"}</span>
        
        <button 
          className={`drone-connect-btn ${droneConnected ? 'connected' : ''}`}
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

      <div className="steps-container">
        <div className={`step ${step === "draw-area" ? "active" : ""}`}>
          1. Draw Area
        </div>
        <div className={`step ${step === "set-start" ? "active" : ""}`}>
          2. Set Start Point
        </div>
        <div className={`step ${step === "complete" ? "active" : ""}`}>
          3. Calculate Coverage
        </div>
        {gridData && (
          <div className={`step ${flightExecuting ? "active" : ""}`}>
            4. Execute Flight
          </div>
        )}
      </div>

      <div className="controls-container">
        {step === "complete" && (
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
                disabled={flightExecuting}
                className="execute-flight-btn"
              >
                {flightExecuting
                  ? "Flight in Progress..."
                  : `Execute Flight Plan (${flightMode.toUpperCase()} mode)`}
              </button>
            )}
          </>
        )}

        <button onClick={handleClearAll} disabled={flightExecuting}>
          Clear All
        </button>
      </div>

      <div className="map-container">
        <MapComponent
          onPolygonCreated={handlePolygonCreated}
          onStartPointSet={handleStartPointSet}
          onStepComplete={handleStepComplete}
          gridData={gridData}
          polygon={polygonPositions}
          startPoint={startPoint}
          currentStep={step}
          ref={mapRef}
        />
      </div>

      {gridData && gridData.path_metrics && (
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

      {showFlightStatus && (
        <FlightStatusDisplay
          status={flightStatus}
          onClose={() => setShowFlightStatus(false)}
        />
      )}
    </div>
  );
}

export default App;
