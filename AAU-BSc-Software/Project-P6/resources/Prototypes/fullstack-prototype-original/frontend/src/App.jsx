import { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import Map from './components/Map';
import StatusBar from './components/StatusBar';
import DroneControls from './components/DroneControls';
import GridPlanning from './components/GridPlanning';
import FlightLog from './components/FlightLog';
import './App.css';

function App() {
  const { 
    connected, 
    gpsData, 
    flightLogs, 
    addFlightLog 
  } = useSocket();
  
  const [polygonCoords, setPolygonCoords] = useState([]);
  const [gridData, setGridData] = useState(null);

  useEffect(() => {
    // Log GPS data updates to help with debugging
    console.log('App component received updated GPS data:', gpsData);
  }, [gpsData]);

  return (
    <div className="container">
      <header>
        <h1>Drone Control Dashboard</h1>
      </header>
      
      <StatusBar connected={connected} />
      
      <div className="content">
        <Map 
          polygonCoords={polygonCoords}
          onPolygonCoordsChange={setPolygonCoords}
          connected={connected}
          gpsData={gpsData}
          gridData={gridData}
          setGridData={setGridData}
        />
        
        <div className="sidebar">
          <DroneControls 
            connected={connected} 
            addFlightLog={addFlightLog} 
          />
          
          <div className="section">
            <h2>Area Coordinates</h2>
            <textarea 
              value={JSON.stringify(polygonCoords)}
              onChange={(e) => {
                try {
                  setPolygonCoords(JSON.parse(e.target.value));
                } catch (err) {
                  console.error('Invalid JSON format');
                }
              }}
              placeholder='[[lat1, lon1], [lat2, lon2], ...]'
            />
          </div>
          
          <GridPlanning 
            polygonCoords={polygonCoords}
            connected={connected}
            gridData={gridData}
            setGridData={setGridData}
            addFlightLog={addFlightLog}
            dronePosition={gpsData}
          />
          
          <FlightLog logs={flightLogs} />
        </div>
      </div>
    </div>
  );
}

export default App;
