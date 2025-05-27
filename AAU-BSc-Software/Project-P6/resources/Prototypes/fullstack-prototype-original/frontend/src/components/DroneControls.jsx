import React from 'react';
import apiClient from '../utils/ApiClient';

function DroneControls({ connected, hasGpsFix, addFlightLog }) {
  const handleConnect = () => {
    apiClient.connectDrone((response) => {
      if (response.success) {
        addFlightLog({action: 'Connection', message: 'Connected to drone'});
      } else {
        addFlightLog({action: 'Error', message: response.error || 'Failed to connect'});
      }
    });
  };

  const handleDisconnect = () => {
    apiClient.disconnectDrone((response) => {
      if (response.success) {
        addFlightLog({action: 'Connection', message: 'Disconnected from drone'});
      } else {
        addFlightLog({action: 'Error', message: response.error || 'Failed to disconnect'});
      }
    });
  };

  return (
    <div className="controls">
      <h2>Drone Controls</h2>
      <button 
        onClick={handleConnect} 
        disabled={connected}
      >
        Connect Drone
      </button>
      <button 
        onClick={handleDisconnect} 
        className="danger" 
        disabled={!connected}
      >
        Disconnect
      </button>
    </div>
  );
}

export default DroneControls;
