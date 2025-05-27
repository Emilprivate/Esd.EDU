import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  Circle,
  Polyline,
  Polygon
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../context/SocketContext';
import { Box, Typography, IconButton, Paper, Button } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { DroneTrackProps, MapComponentProps } from '../types/map.types';

// Export the interface explicitly
export interface MapComponentHandle {
  fitBounds: (bounds: L.LatLngBoundsExpression) => void;
  clearAll: () => void;
}

// Track component for drawing the drone's path
const DroneTrack: React.FC<DroneTrackProps> = ({ positions }) => {
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: 'white', weight: 3, opacity: 0.7, dashArray: '5, 5' }}
    />
  );
};

// Fix for marker icons - using a safer approach
L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.3/dist/images/';

// Custom drone icon
const droneIcon = new L.Icon({
  iconUrl: '/drone.svg', 
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Custom vertex icon for drawing
const vertexIcon = new L.DivIcon({
  html: '<div style="width: 10px; height: 10px; background-color: white; border: 2px solid #444; border-radius: 50%;"></div>',
  className: "leaflet-div-icon-vertex",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Map theme options
const MAP_THEMES = {
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 19,
  },
  streets: {
    name: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

// Component to update the map center and add/track the drone marker
const DroneTracker: React.FC = () => {
  const map = useMap();
  const { gps, gpsSignal } = useSocket();
  const [dronePosition, setDronePosition] = useState<L.LatLngTuple | null>(null);
  const [trackPositions, setTrackPositions] = useState<L.LatLngTuple[]>([]);
  const markerRef = useRef<L.Marker | null>(null);
  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    if (gps && !gpsSignal && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      const newPosition: L.LatLngTuple = [gps.latitude, gps.longitude];
      
      // Update drone position
      setDronePosition(newPosition);
      
      // Add to track only if position changed
      if (trackPositions.length === 0 || 
          trackPositions[trackPositions.length-1][0] !== newPosition[0] || 
          trackPositions[trackPositions.length-1][1] !== newPosition[1]) {
        setTrackPositions(prev => [...prev, newPosition]);
      }
      
      // Center map on first valid position
      if (!hasCentered) {
        map.setView(newPosition, 18);
        setHasCentered(true);
      }
    }
  }, [gps, gpsSignal, map, hasCentered, trackPositions]);

  // Create or update marker when position changes
  useEffect(() => {
    if (!dronePosition) return;
    
    if (!markerRef.current) {
      // Create marker if it doesn't exist
      markerRef.current = L.marker(dronePosition, { icon: droneIcon })
        .addTo(map)
        .bindTooltip('Drone');
    } else {
      // Update existing marker
      markerRef.current.setLatLng(dronePosition);
    }
    
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [dronePosition, map]);

  return trackPositions.length > 1 ? <DroneTrack positions={trackPositions} /> : null;
};

// Component to handle changing the map tile layer
const MapThemeControl: React.FC = () => {
  const map = useMap();
  const [theme, setTheme] = useState<'satellite' | 'streets'>('satellite');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const changeTheme = (newTheme: 'satellite' | 'streets') => {
    setTheme(newTheme);
    handleClose();
  };
  
  useEffect(() => {
    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    
    // Add new tile layer based on selected theme
    const selectedTheme = MAP_THEMES[theme];
    tileLayerRef.current = L.tileLayer(selectedTheme.url, {
      attribution: selectedTheme.attribution,
      maxZoom: selectedTheme.maxZoom,
    }).addTo(map);
    
    return () => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
    };
  }, [theme, map]);
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        zIndex: 1000,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <IconButton size="small" onClick={handleClick} sx={{ p: 1 }}>
        <LayersIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem 
          onClick={() => changeTheme('satellite')} 
          sx={{ bgcolor: theme === 'satellite' ? 'action.selected' : undefined }}
        >
          Satellite
        </MenuItem>
        <MenuItem 
          onClick={() => changeTheme('streets')} 
          sx={{ bgcolor: theme === 'streets' ? 'action.selected' : undefined }}
        >
          Streets
        </MenuItem>
      </Menu>
    </Paper>
  );
};

const MapComponent = forwardRef<MapComponentHandle, MapComponentProps>((props, ref) => {
  const { gps, gpsSignal, connected, droneConnected } = useSocket();
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const tempMarkersRef = useRef<L.Marker[]>([]);
  const tempPolylinesRef = useRef<L.Polyline[]>([]);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const dronePathRef = useRef<L.Polyline | null>(null);
  const dronePositionsRef = useRef<L.LatLngExpression[]>([]);
  const [hasCentered, setHasCentered] = useState(false);
  const [markerCount, setMarkerCount] = useState<number>(0);

  // Default position (if no GPS data)
  const defaultPosition: L.LatLngTuple = [57.0138, 9.9940]; // Aalborg, Denmark
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    fitBounds: (bounds: L.LatLngBoundsExpression) => {
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
      }
    },
    clearAll: () => {
      console.log('Clear map layers');
      clearDrawingData();
      
      // Don't clear the drone marker/path
      if (mapRef.current) {
        if (polygonLayerRef.current) {
          mapRef.current.removeLayer(polygonLayerRef.current);
          polygonLayerRef.current = null;
        }
      }
    }
  }));

  // Function to track drone position
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (gps && !gpsSignal && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      const newPosition: L.LatLngTuple = [gps.latitude, gps.longitude];
      
      // Update drone marker position
      if (!droneMarkerRef.current) {
        droneMarkerRef.current = L.marker(newPosition, { 
          icon: droneIcon 
        })
          .addTo(mapRef.current)
          .bindTooltip('Drone');
      } else {
        droneMarkerRef.current.setLatLng(newPosition);
      }
      
      // Add to drone positions if changed
      if (
        dronePositionsRef.current.length === 0 || 
        (dronePositionsRef.current[dronePositionsRef.current.length - 1] as L.LatLngTuple)[0] !== newPosition[0] || 
        (dronePositionsRef.current[dronePositionsRef.current.length - 1] as L.LatLngTuple)[1] !== newPosition[1]
      ) {
        dronePositionsRef.current.push(newPosition);
        
        // Update the drone path
        if (!dronePathRef.current) {
          dronePathRef.current = L.polyline(dronePositionsRef.current, {
            color: 'white',
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 5'
          }).addTo(mapRef.current);
        } else {
          dronePathRef.current.setLatLngs(dronePositionsRef.current);
        }
      }
      
      // Center map on first valid position
      if (!hasCentered) {
        mapRef.current.setView(newPosition, 18);
        setHasCentered(true);
      }
    }
  }, [gps, gpsSignal, hasCentered]);
  
  // Reset the drone trail when the reset key changes
  useEffect(() => {
    if (!mapRef.current || props.droneTrailResetKey === undefined) return;
    
    // Clear the drone path but preserve the marker
    if (dronePathRef.current) {
      dronePositionsRef.current = [];
      if (droneMarkerRef.current) {
        const currentPos = droneMarkerRef.current.getLatLng();
        dronePositionsRef.current = [[currentPos.lat, currentPos.lng]];
      }
      dronePathRef.current.setLatLngs(dronePositionsRef.current);
    }
  }, [props.droneTrailResetKey]);
  
  // Function to start drawing mode
  const startDrawing = () => {
    if (!mapRef.current) return;
    
    console.log('Starting drawing mode');
    setIsDrawing(true);
    setMarkerCount(0); // Reset marker count
    clearDrawingData();
    
    // Change cursor style
    if (mapRef.current.getContainer()) {
      mapRef.current.getContainer().style.cursor = 'crosshair';
    }
  };
  
  // Function to confirm drawing
  const confirmDrawing = () => {
    if (!mapRef.current || tempMarkersRef.current.length < 3) return;
    
    console.log('Confirming drawing');
    setIsDrawing(false);
    
    // Reset cursor style
    if (mapRef.current.getContainer()) {
      mapRef.current.getContainer().style.cursor = '';
    }
    
    // Get positions from markers
    const positions: [number, number][] = tempMarkersRef.current.map(marker => {
      const pos = marker.getLatLng();
      return [pos.lat, pos.lng];
    });
    
    // Call onPolygonCreated callback
    if (props.onPolygonCreated) {
      props.onPolygonCreated(positions);
    }
    
    // Create actual polygon
    if (polygonLayerRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
    }
    
    polygonLayerRef.current = L.polygon(positions, {
      color: 'green',
      fillOpacity: 0.2
    }).addTo(mapRef.current);
    
    // Clear temporary markers and lines
    clearTempLayers();
    setMarkerCount(0); // Reset marker count
  };
  
  // Function to clear drawing
  const clearDrawing = () => {
    if (!mapRef.current) return;
    
    setIsDrawing(false);
    setMarkerCount(0); // Reset marker count
    clearDrawingData();
    
    if (props.onPolygonCreated) {
      props.onPolygonCreated([]);
    }
    
    // Reset cursor style
    if (mapRef.current.getContainer()) {
      mapRef.current.getContainer().style.cursor = '';
    }
  };
  
  // Function to clear temporary drawing objects
  const clearTempLayers = () => {
    if (!mapRef.current) return;
    
    // Remove temporary markers
    tempMarkersRef.current.forEach(marker => {
      if (mapRef.current) mapRef.current.removeLayer(marker);
    });
    tempMarkersRef.current = [];
    setMarkerCount(0); // Reset marker count
    
    // Remove temporary lines
    tempPolylinesRef.current.forEach(line => {
      if (mapRef.current) mapRef.current.removeLayer(line);
    });
    tempPolylinesRef.current = [];
  };
  
  // Function to clear all drawing data
  const clearDrawingData = () => {
    if (!mapRef.current) return;
    
    // Clear temporary markers and lines
    clearTempLayers();
    
    // Clear polygon
    if (polygonLayerRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
  };
  
  // Update lines between markers
  const updateLines = () => {
    if (!mapRef.current) return;
    
    // Clear existing lines
    tempPolylinesRef.current.forEach(line => {
      if (mapRef.current) mapRef.current.removeLayer(line);
    });
    tempPolylinesRef.current = [];
    
    // Draw new lines if we have at least 2 markers
    if (tempMarkersRef.current.length >= 2) {
      for (let i = 0; i < tempMarkersRef.current.length; i++) {
        const marker1 = tempMarkersRef.current[i];
        const marker2 = tempMarkersRef.current[(i + 1) % tempMarkersRef.current.length];
        
        const line = L.polyline([marker1.getLatLng(), marker2.getLatLng()], {
          color: 'green',
          weight: 2
        }).addTo(mapRef.current);
        
        tempPolylinesRef.current.push(line);
      }
    }
  };

  // Fix: Create a MapReady component to handle the map reference
  const MapReady = () => {
    const map = useMap();
    
    // Handle map click for drawing
    useEffect(() => {
      if (!map) return;
      
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        if (!isDrawing) return;
        
        console.log('Map clicked while drawing');
        const marker = L.marker(e.latlng, {
          icon: vertexIcon,
          draggable: true
        }).addTo(map);
        
        // Update lines when marker is dragged
        marker.on('drag', updateLines);
        marker.on('dragend', updateLines);
        
        tempMarkersRef.current.push(marker);
        
        // Update the state marker count for UI updates
        setMarkerCount(tempMarkersRef.current.length);
        
        updateLines();
      };
      
      map.on('click', handleMapClick);
      
      return () => {
        map.off('click', handleMapClick);
      };
    }, [map, isDrawing]);
    
    useEffect(() => {
      mapRef.current = map;
      setMapReady(true);
    }, [map]);
    
    return null;
  };

  // Add blur overlay when drone is not connected
  const renderConnectOverlay = () => {
    if (!connected || !droneConnected) {
      return (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <Box sx={{
            textAlign: 'center',
            padding: 3,
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: 3
          }}>
            <Typography variant="h6" gutterBottom>
              {!connected ? 'Waiting for server connection' : 'Waiting for drone connection'}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                border: '3px solid #ddd',
                borderTopColor: '#1976d2',
                animation: 'spin 1s linear infinite'
              }} />
            </Box>
          </Box>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* Custom component to handle map ready state */}
        <MapReady />
        
        {/* Tile layer is managed by MapThemeControl */}
        <MapThemeControl />
        
        {/* Display flight paths and waypoints if provided */}
        {props.polygon && props.polygon.length > 2 && !polygonLayerRef.current && (
          <Polygon 
            positions={props.polygon as L.LatLngTuple[]} 
            pathOptions={{ color: 'green', fillOpacity: 0.2 }}
          />
        )}
        
        {props.waypoints && props.waypoints.map((wp, idx) => (
          <Marker
            key={idx}
            position={[wp.lat, wp.lon] as L.LatLngTuple}
            icon={new L.DivIcon({
              html: `<div style="width: 8px; height: 8px; background-color: #0066ff; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 3px rgba(0,0,0,0.3);"></div>`,
              className: "waypoint-icon",
              iconSize: [8, 8],
              iconAnchor: [4, 4],
            })}
          >
            <Popup>Waypoint #{idx + 1}</Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Drawing Controls */}
      <Paper sx={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1
      }}>
        <Button 
          variant="contained" 
          startIcon={<EditIcon />}
          onClick={startDrawing}
          disabled={isDrawing || !connected || !droneConnected}
          size="small"
        >
          Draw Area
        </Button>
        
        <Button 
          variant="contained" 
          startIcon={<CheckIcon />}
          onClick={confirmDrawing}
          disabled={!isDrawing || markerCount < 3}
          color="success"
          size="small"
        >
          Confirm
        </Button>
        
        <Button 
          variant="contained" 
          startIcon={<DeleteIcon />}
          onClick={clearDrawing}
          color="error"
          size="small"
        >
          Clear
        </Button>
      </Paper>

      {/* Drawing Instructions */}
      {isDrawing && (
        <Paper sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          p: 2,
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          <Typography variant="body2">
            Click on the map to draw the area. Add at least 3 points, then click "Confirm".
            {markerCount > 0 && ` (${markerCount} points added)`}
          </Typography>
        </Paper>
      )}
      
      {/* Connect overlay */}
      {renderConnectOverlay()}
    </Box>
  );
});

export default MapComponent;