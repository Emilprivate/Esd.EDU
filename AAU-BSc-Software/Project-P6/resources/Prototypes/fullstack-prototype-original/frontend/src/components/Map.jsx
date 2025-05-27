import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../utils/ApiClient';

function Map({ 
  polygonCoords, 
  onPolygonCoordsChange, 
  connected, 
  gpsData, 
  gridData, 
  setGridData 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const droneMarkerRef = useRef(null);
  const dronePathRef = useRef(null);
  const areaPolygonRef = useRef(null);
  const gridPolygonsRef = useRef([]);
  const pathLineRef = useRef(null);
  const positionHistoryRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([0, 0], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      droneMarkerRef.current = L.marker([0, 0], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map);
      
      dronePathRef.current = L.polyline([], {color: 'blue', weight: 3}).addTo(map);
      
      // Click on map to add polygon point
      map.on('click', (e) => {
        const newCoords = [...polygonCoords, [e.latlng.lat, e.latlng.lng]];
        onPolygonCoordsChange(newCoords);
      });
      
      mapInstanceRef.current = map;
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update area polygon when polygonCoords change
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Clear existing polygon
      if (areaPolygonRef.current) {
        mapInstanceRef.current.removeLayer(areaPolygonRef.current);
        areaPolygonRef.current = null;
      }
      
      // Create new polygon if we have at least 3 points
      if (polygonCoords && polygonCoords.length >= 3) {
        areaPolygonRef.current = L.polygon(polygonCoords, {color: 'green'})
          .addTo(mapInstanceRef.current);
        mapInstanceRef.current.fitBounds(areaPolygonRef.current.getBounds());
      }
    }
  }, [polygonCoords]);

  // Update drone position from GPS data
  useEffect(() => {
    if (mapInstanceRef.current && droneMarkerRef.current && dronePathRef.current) {
      if (gpsData && gpsData.latitude !== 0 && gpsData.longitude !== 0) {
        const position = [gpsData.latitude, gpsData.longitude];
        droneMarkerRef.current.setLatLng(position);
        
        // Add to position history and update path
        positionHistoryRef.current.push(position);
        if (positionHistoryRef.current.length > 100) {
          positionHistoryRef.current.shift(); // Keep history size reasonable
        }
        dronePathRef.current.setLatLngs(positionHistoryRef.current);
        
        // Center map on drone if connected
        if (connected) {
          mapInstanceRef.current.setView(position);
        }
      }
    }
  }, [gpsData, connected]);

  // Visualize grid when gridData changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Clear previous grid and path
    gridPolygonsRef.current.forEach(poly => {
      mapInstanceRef.current.removeLayer(poly);
    });
    gridPolygonsRef.current = [];
    
    if (pathLineRef.current) {
      mapInstanceRef.current.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }
    
    // Render new grid if available
    if (gridData && gridData.grids) {
      // Add each grid as a polygon
      gridData.grids.forEach(grid => {
        const corners = grid.corners.map(corner => [corner.lat, corner.lon]);
        const poly = L.polygon(corners, {color: 'rgba(33, 150, 243, 0.5)', weight: 1})
          .addTo(mapInstanceRef.current);
        gridPolygonsRef.current.push(poly);
      });
      
      // Create path line
      if (gridData.path && gridData.path.length > 0) {
        const pathCoords = gridData.path.map(point => [point.lat, point.lon]);
        pathLineRef.current = L.polyline(pathCoords, {
          color: 'red', 
          weight: 2, 
          dashArray: '5, 5'
        }).addTo(mapInstanceRef.current);
      }
    }
  }, [gridData]);

  return (
    <div className="map-container">
      <div ref={mapRef} id="map"></div>
      <div className="overlay-info">
        <div><strong>Latitude:</strong> <span>{gpsData?.latitude?.toFixed(6) || 0}</span></div>
        <div><strong>Longitude:</strong> <span>{gpsData?.longitude?.toFixed(6) || 0}</span></div>
        <div><strong>Altitude:</strong> <span>{gpsData?.altitude?.toFixed(2) || 0}</span> m</div>
        <div>
          <strong>State:</strong> 
          <span className={`motion-state-badge motion-state-${gpsData?.motion_state || 'unknown'}`}>
            {gpsData?.motion_state && gpsData.motion_state !== 'unknown'
              ? gpsData.motion_state.charAt(0).toUpperCase() + gpsData.motion_state.slice(1)
              : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Map;
