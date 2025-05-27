import React from "react";

const ConnectionModal = ({ error, onClose, onRetry }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Connection Error</h3>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>
        <div className="modal-content">
          <div className="error-icon">❌</div>
          <p className="error-message">
            {error || "Could not connect to the server."}
          </p>
          <p className="error-help">
            Please check if the server is running and try again.
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onRetry} className="retry-button">
            Retry Connection
          </button>
          <button onClick={onClose} className="cancel-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
