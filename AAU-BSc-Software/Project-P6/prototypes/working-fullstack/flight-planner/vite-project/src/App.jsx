import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./App.css";
import MapComponent from "./components/MapComponent";
import FlightStatusDisplay from "./components/FlightStatusDisplay";

function App() {
  const [polygonPositions, setPolygonPositions] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [altitude, setAltitude] = useState(20); // Default altitude in meters
  const [overlap, setOverlap] = useState(20); // Default overlap percentage
  const [coverage, setCoverage] = useState(80); // Default coverage percentage
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("draw-area"); // 'draw-area', 'set-start', 'complete'
  const [flightExecuting, setFlightExecuting] = useState(false);
  const [flightStatus, setFlightStatus] = useState(null);
  const [showFlightStatus, setShowFlightStatus] = useState(false);
  const mapRef = useRef(null);

  const handlePolygonCreated = (positions) => {
    setPolygonPositions(positions);
    // Don't change step here - wait for confirm button
  };

  const handleStartPointSet = (point) => {
    setStartPoint(point);
    // Don't change step here - wait for confirm button
  };

  const handleStepComplete = () => {
    // Handle step transitions
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
      const response = await axios.post(
        "http://localhost:5000/calculate_grid",
        {
          coordinates: polygonPositions,
          altitude: altitude,
          overlap: overlap,
          coverage: coverage,
          start_point: startPoint,
        }
      );

      setGridData(response.data);
    } catch (error) {
      console.error("Error generating grid layout", error);
      alert(
        `Error generating grid layout: ${
          error.response?.data?.error || error.message
        }`
      );
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
        "Are you sure you want to execute this flight plan? The drone will take off and follow the planned path."
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
      const response = await axios.post(
        "http://localhost:5000/execute_flight",
        {
          waypoints: gridData.path,
          altitude: altitude,
        }
      );

      setFlightStatus({
        status: response.data.success
          ? "Flight completed successfully"
          : "Flight execution failed",
        logs: response.data.execution_log,
        success: response.data.success,
        metadata: response.data.metadata,
      });
    } catch (error) {
      console.error("Error executing flight", error);
      setFlightStatus({
        status: "Flight execution error",
        logs: [
          {
            action: "error",
            error: error.response?.data?.error || error.message,
            timestamp: new Date().toISOString(),
          },
        ],
        success: false,
      });
    } finally {
      setFlightExecuting(false);
    }
  };

  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="app-container">
      <h1>Drone Grid Coverage Calculator</h1>

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
        {/* Show controls based on current step */}
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
                  : "Execute Flight Plan"}
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

      {/* Flight status display */}
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
