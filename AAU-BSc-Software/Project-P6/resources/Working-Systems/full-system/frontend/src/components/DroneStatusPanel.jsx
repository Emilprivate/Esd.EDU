import React from "react";
import { useSocket } from "../context/SocketContext";

function DroneStatusPanel() {
  const { gps, gpsSignal, motionState, batteryPercent, droneConnected } = useSocket();

  const hasValidGps =
    gps &&
    typeof gps.latitude === "number" &&
    typeof gps.longitude === "number" &&
    !(gps.latitude === 0 && gps.longitude === 0) &&
    !gpsSignal;

  return (
    <div className="drone-status-panel">
      <h4 className="drone-status-title">Drone Status</h4>
      <div className="drone-status-grid">
        <div className="status-item">
          <span className="status-label">Connection:</span>
          <span className={`status-value ${droneConnected ? 'connected' : 'disconnected'}`}>
            {droneConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Motion:</span>
          <span className="status-value">
            {motionState
              ? motionState.charAt(0).toUpperCase() + motionState.slice(1)
              : "Unknown"}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Battery:</span>
          <span className="status-value">
            {batteryPercent !== null ? `${batteryPercent}%` : "Unknown"}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">GPS Signal:</span>
          <span className={`status-value ${hasValidGps ? 'valid' : 'invalid'}`}>
            {hasValidGps ? "Valid" : gpsSignal || "No Signal"}
          </span>
        </div>
        {hasValidGps && (
          <>
            <div className="status-item gps-coord">
              <span className="status-label">Latitude:</span>
              <span className="status-value">{gps.latitude.toFixed(6)}</span>
            </div>
            <div className="status-item gps-coord">
              <span className="status-label">Longitude:</span>
              <span className="status-value">{gps.longitude.toFixed(6)}</span>
            </div>
            <div className="status-item gps-coord">
              <span className="status-label">Altitude:</span>
              <span className="status-value">{gps.altitude.toFixed(2)}m</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DroneStatusPanel;
