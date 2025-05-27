import React, { useState } from 'react';
import apiClient from '../utils/ApiClient';

function GridPlanning({ 
  polygonCoords, 
  connected, 
  gridData, 
  setGridData, 
  addFlightLog, 
  dronePosition 
}) {
  const [altitude, setAltitude] = useState(10);
  const [overlap, setOverlap] = useState(70);
  const [coverage, setCoverage] = useState(70);
  const [flightMode, setFlightMode] = useState('stable');

  const handleCalculateGrid = () => {
    try {
      // Validate inputs
      if (!polygonCoords || polygonCoords.length < 3) {
        addFlightLog({action: 'Error', message: 'At least 3 coordinates are required'});
        return;
      }
      
      const data = {
        coordinates: polygonCoords,
        altitude: altitude,
        overlap: overlap,
        coverage: coverage,
        start_point: connected && dronePosition?.latitude ? 
          [dronePosition.latitude, dronePosition.longitude] : null
      };
      
      addFlightLog({action: 'Grid', message: 'Calculating grid plan...'});
      apiClient.calculateGrid(data, (response) => {
        if (response.error) {
          addFlightLog({action: 'Error', message: response.error || 'Failed to calculate grid'});
        } else {
          addFlightLog({action: 'Grid', message: `Grid plan calculated: ${response.grid_count} grid points`});
          setGridData(response);
        }
      });
    } catch(e) {
      addFlightLog({action: 'Error', message: 'Invalid input: ' + e.message});
    }
  };

  const handleExecuteFlight = () => {
    if (!gridData || !gridData.path) {
      addFlightLog({action: 'Error', message: 'No flight path available'});
      return;
    }
    
    const data = {
      waypoints: gridData.path,
      altitude: altitude,
      flight_mode: flightMode
    };
    
    addFlightLog({action: 'Flight', message: `Starting ${flightMode} flight execution...`});
    apiClient.executeFlight(data, (response) => {
      if (response.error) {
        addFlightLog({action: 'Error', message: response.error || 'Flight execution failed'});
      } else {
        addFlightLog({action: 'Flight', message: `Flight ${response.success ? 'completed successfully' : 'failed'}`});
      }
    });
  };

  return (
    <div className="section">
      <h2>Grid Planning</h2>
      <div>
        <label htmlFor="altitude">Altitude (m):</label>
        <input 
          type="number" 
          id="altitude" 
          value={altitude} 
          onChange={(e) => setAltitude(Number(e.target.value))}
          min="1" 
          max="40"
        />
      </div>
      <div>
        <label htmlFor="overlap">Overlap (%):</label>
        <input 
          type="number" 
          id="overlap" 
          value={overlap} 
          onChange={(e) => setOverlap(Number(e.target.value))}
          min="0" 
          max="90"
        />
      </div>
      <div>
        <label htmlFor="coverage">Coverage (%):</label>
        <input 
          type="number" 
          id="coverage" 
          value={coverage} 
          onChange={(e) => setCoverage(Number(e.target.value))}
          min="0" 
          max="100"
        />
      </div>
      <div>
        <label htmlFor="flight-mode">Flight Mode:</label>
        <select 
          id="flight-mode" 
          value={flightMode} 
          onChange={(e) => setFlightMode(e.target.value)}
        >
          <option value="stable">Stable (Stop at each point)</option>
          <option value="rapid">Rapid (Continuous flight)</option>
        </select>
      </div>
      <button onClick={handleCalculateGrid}>Calculate Grid</button>
      <button 
        onClick={handleExecuteFlight} 
        disabled={!(connected && gridData)}
      >
        Execute Flight
      </button>
      
      {gridData && (
        <div className="section" id="grid-info-section">
          <h2>Grid Information</h2>
          <div className="grid-info">
            <div><strong>Grid Count:</strong> <span>{gridData.grid_count}</span></div>
            <div><strong>Total Distance:</strong> <span>{gridData.path_metrics?.total_distance.toFixed(2)}</span> m</div>
            <div><strong>Est. Flight Time:</strong> <span>{gridData.path_metrics?.estimated_flight_time.toFixed(2)}</span> sec</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GridPlanning;
