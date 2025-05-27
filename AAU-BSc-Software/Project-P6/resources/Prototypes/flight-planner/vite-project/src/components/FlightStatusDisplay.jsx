import { useState } from "react";
import "../styles/FlightStatusDisplay.css";

const FlightStatusDisplay = ({ status, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!status) {
    return null;
  }

  // Format timestamp into readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Get appropriate status color
  const getStatusColor = () => {
    if (status.success === null) return "blue";
    return status.success ? "green" : "red";
  };

  // Get icon for each action type
  const getActionIcon = (action) => {
    switch (action) {
      case "connect":
        return "🔌";
      case "gps_fix_wait":
        return "📡";
      case "takeoff":
        return "🚀";
      case "ascend":
        return "⬆️";
      case "move_to_waypoint":
        return "📍";
      case "take_photo":
        return "📸";
      case "return_home":
        return "🏠";
      case "land":
        return "🛬";
      case "disconnect":
        return "🔌";
      case "complete":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⚙️";
    }
  };

  return (
    <div className="flight-status-container">
      <div className="flight-status-header">
        <h3>Flight Status</h3>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>

      <div
        className="flight-status-summary"
        style={{ backgroundColor: getStatusColor() }}
      >
        <span>{status.status}</span>
      </div>

      <div className="flight-status-details">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="toggle-details-button"
        >
          {showDetails ? "Hide Details" : "Show Details"}
          <span className="toggle-icon">{showDetails ? "▼" : "▶"}</span>
        </button>

        {showDetails && status.logs && (
          <div className="flight-logs">
            <ul>
              {status.logs.map((log, index) => (
                <li key={index} className={`log-item ${log.action}`}>
                  <span className="log-icon">{getActionIcon(log.action)}</span>
                  <span className="log-time">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className="log-action">{log.action}</span>
                  {log.waypoint_num && (
                    <span className="log-details">
                      Waypoint #{log.waypoint_num}
                    </span>
                  )}
                  {log.altitude && (
                    <span className="log-details">Alt: {log.altitude}m</span>
                  )}
                  {log.error && <span className="log-error">{log.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {status.success && (
        <div className="flight-success-message">
          <span className="success-icon">✅</span> Flight completed
          successfully!
        </div>
      )}

      {status.success === false && (
        <div className="flight-error-message">
          <span className="error-icon">❌</span> Flight execution failed. See
          details above.
        </div>
      )}
    </div>
  );
};

export default FlightStatusDisplay;
