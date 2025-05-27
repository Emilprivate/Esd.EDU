import React, { useRef, useEffect } from 'react';

function FlightLog({ logs }) {
  const logRef = useRef(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="section">
      <h2>Flight Log</h2>
      <div className="flight-log" ref={logRef}>
        {logs.length === 0 ? (
          <p>No flight logs yet</p>
        ) : (
          logs.map((log, index) => {
            let style = {};
            
            if (log.action === 'Motion State') {
              if (log.message.includes('steady')) {
                style.color = '#4CAF50';
              } else if (log.message.includes('moving')) {
                style.color = '#FF9800';
              }
            } else if (log.action === 'GPS Update') {
              style.color = '#2196F3';
              style.fontSize = '0.9em';
            }
            
            return (
              <p key={index} style={style}>
                {log.timestamp} - {log.action}: {log.message || ''}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}

export default FlightLog;
