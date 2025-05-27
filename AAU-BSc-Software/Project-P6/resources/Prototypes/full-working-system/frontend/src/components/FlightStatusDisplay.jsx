const FlightStatusDisplay = ({ status, onClose }) => {
  if (!status) return null;

  return (
    <div className="flight-status-modal">
      <div className="flight-status-content">
        <h3>Flight Status</h3>
        <div className="status-message">
          <span
            className={`status-indicator ${
              status.success ? "success" : "error"
            }`}
          />
          {status.status}
        </div>
        {status.flight_mode && (
          <div className="flight-mode-indicator">
            Mode:{" "}
            <span className={`mode-${status.flight_mode}`}>
              {status.flight_mode.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flight-logs">
          {status.logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.action}`}>
              <span className="timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="message">
                {log.error || log.action}
                {log.mode && ` (${log.mode} mode)`}
              </span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default FlightStatusDisplay;
