import React, { useState, useEffect, useRef } from "react";

// Accept logs as a prop
function TerminalLogs({ logs }) {
  // Log the received prop at the start of the component function
  console.log("TerminalLogs: Received logs prop:", logs);

  const [filter, setFilter] = useState("flight"); // Default to flight logs view
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();

  // Filter the logs received via props
  const filtered = logs.filter((log) => {
    if (filter === "flight") return true; // Show all passed logs under 'flight' for now
    if (filter === "all") return true; // Show all passed logs under 'all'
    return false; // Default: hide if filter doesn't match
  });

  // Log the result after filtering
  console.log("TerminalLogs: Filtered logs:", filtered);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filtered]); // Trigger scroll on filtered logs change

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const terminalClass = `terminal-logs ${isFullscreen ? 'fullscreen' : ''}`;

  return (
    <div className={terminalClass}>
      <div className="terminal-controls">
        <div className="terminal-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "flight" ? "active" : ""}
            onClick={() => setFilter("flight")}
          >
            Flight
          </button>
        </div>
        <div className="terminal-actions">
          <button
            className="terminal-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>
      <div className="terminal-view" ref={containerRef}>
        {filtered.length === 0 ? (
          <div className="terminal-empty-state">No logs to display for this filter</div>
        ) : (
          filtered.map((log, i) => (
            <div key={i} className={`terminal-line ${log.action?.toLowerCase()} ${log.level?.toLowerCase()}`}>
              <span className="time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`level ${log.action?.toLowerCase() || log.level?.toLowerCase()}`}>
                {log.action || log.level || 'INFO'}
              </span>
              <span className="logger">{log.logger || 'flight'}:</span>
              <span className="message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TerminalLogs;
