import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import L from 'leaflet';

function DroneTracker({ map }) {
  const { socket } = useSocket();
  const [gpsData, setGpsData] = useState({ latitude: 0, longitude: 0, altitude: 0 });
  const [tracking, setTracking] = useState(false);
  const droneMarkerRef = useRef(null);
  const pathLayerRef = useRef(null);
  const positionsRef = useRef([]);

  // Create custom drone icon
  const droneIcon = L.divIcon({
    html: '<div style="background-color: #ff4444; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
    className: 'drone-position-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  useEffect(() => {
    if (!map) return;

    // Initialize path layer
    pathLayerRef.current = L.polyline([], {
      color: '#ff4444',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 5'
    }).addTo(map);

    // Listen for GPS updates
    const handleGpsUpdate = (data) => {
      if (!data || (data.latitude === 0 && data.longitude === 0)) return;
      
      setGpsData(data);
      const position = [data.latitude, data.longitude];
      
      // Create marker if it doesn't exist yet
      if (!droneMarkerRef.current) {
        droneMarkerRef.current = L.marker(position, { icon: droneIcon })
          .bindTooltip('Drone')
          .addTo(map);
      } else {
        // Update marker position
        droneMarkerRef.current.setLatLng(position);
      }
      
      // Update path if position has changed
      if (positionsRef.current.length === 0 || 
          position[0] !== positionsRef.current[positionsRef.current.length-1][0] || 
          position[1] !== positionsRef.current[positionsRef.current.length-1][1]) {
        positionsRef.current.push(position);
        pathLayerRef.current.setLatLngs(positionsRef.current);
      }
      
      // Center map on drone if tracking is active
      if (tracking && position[0] !== 0 && position[1] !== 0) {
        map.setView(position);
      }
    };

    socket.on('gps_update', handleGpsUpdate);
    
    return () => {
      socket.off('gps_update', handleGpsUpdate);
      
      // Clean up layers
      if (droneMarkerRef.current) {
        map.removeLayer(droneMarkerRef.current);
      }
      
      if (pathLayerRef.current) {
        map.removeLayer(pathLayerRef.current);
      }
    };
  }, [map, socket, tracking]);

  // Toggle drone position tracking
  const toggleTracking = () => {
    setTracking(!tracking);
  };

  // Display current GPS data with a tracking toggle button
  return (
    <div className="drone-gps-info">
      <h4>Live Drone Position</h4>
      <div className="gps-coordinates">
        <p>Latitude: {gpsData.latitude.toFixed(6)}</p>
        <p>Longitude: {gpsData.longitude.toFixed(6)}</p>
        <p>Altitude: {gpsData.altitude.toFixed(2)}m</p>
        <button 
          className={`tracking-toggle ${tracking ? 'active' : ''}`}
          onClick={toggleTracking}
        >
          {tracking ? 'Tracking ON' : 'Track Drone'}
        </button>
      </div>
    </div>
  );
}

export default DroneTracker;
