import React from 'react';
import { useSocket } from '../context/SocketContext';

function StatusBar({ connected }) {
  const { gpsData } = useSocket();
  let statusText = "Disconnected";
  let statusClass = "status-bar";
  
  if (connected) {
    statusText = "Connected to Drone";
    statusClass = "status-bar connected";
    if (gpsData && gpsData.motion_state && gpsData.motion_state !== "unknown") {
      statusText += ` (${gpsData.motion_state.charAt(0).toUpperCase() + gpsData.motion_state.slice(1)})`;
    }
  }
  
  return (
    <div className={statusClass}>
      {statusText}
    </div>
  );
}

export default StatusBar;
