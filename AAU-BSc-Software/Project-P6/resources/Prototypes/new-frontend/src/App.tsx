import React, { useState, useRef, useEffect } from 'react';
import { 
  CssBaseline, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider,
  Paper,
  Button
} from '@mui/material';
import { SocketProvider, useSocket } from './context/SocketContext';
import DroneStatusPanel from './components/DroneStatusPanel';
import MapComponent, { MapComponentHandle } from './components/MapComponent';
import PhotoDisplay from './components/PhotoDisplay';
import TerminalLogs from './components/TerminalLogs';
import FlightPlanner from './components/FlightPlanner';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f6fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#222c36',
        },
      },
    },
  },
});

const AppContent: React.FC = () => {
  const { 
    connected, 
    droneConnected, 
    connectDrone, 
    disconnectDrone,
    socket
  } = useSocket();
  const [terminalHeight, setTerminalHeight] = useState<number>(300);
  const [logsVisible, setLogsVisible] = useState<boolean>(false);
  const mapRef = useRef<MapComponentHandle>(null!);
  const [flightLogs, setFlightLogs] = useState<any[]>([]);
  const [polygonPositions, setPolygonPositions] = useState<[number, number][]>([]);
  const [droneTrailResetKey, setDroneTrailResetKey] = useState<number>(0);
  
  // Load saved polygon from localStorage on component mount
  useEffect(() => {
    const savedPolygon = localStorage.getItem('savedPolygon');
    if (savedPolygon) {
      try {
        const parsedPolygon = JSON.parse(savedPolygon);
        if (Array.isArray(parsedPolygon) && parsedPolygon.length > 0) {
          setPolygonPositions(parsedPolygon);
          console.log('Loaded saved polygon:', parsedPolygon);
        }
      } catch (e) {
        console.error('Error loading saved polygon:', e);
      }
    }
  }, []);

  // Listen for flight logs from the socket
  useEffect(() => {
    if (!socket) return;
    
    const handleFlightLog = (log: any) => {
      console.log("App: Received flight_log:", log);
      setFlightLogs(prev => [...prev, log]);
    };
    
    socket.on('flight_log', handleFlightLog);
    
    return () => {
      socket.off('flight_log', handleFlightLog);
    };
  }, [socket]);

  const handleConnectDrone = async () => {
    if (droneConnected) {
      await disconnectDrone();
    } else {
      await connectDrone();
    }
  };

  const toggleLogs = () => {
    setLogsVisible(!logsVisible);
  };

  // Handler for polygon creation
  const handlePolygonCreated = (positions: [number, number][]) => {
    console.log('Polygon created with positions:', positions);
    setPolygonPositions(positions);
    // Save to localStorage for persistence
    if (positions.length > 0) {
      localStorage.setItem('savedPolygon', JSON.stringify(positions));
    } else {
      localStorage.removeItem('savedPolygon');
    }
  };

  // Handler for clearing all
  const handleClearAll = () => {
    setPolygonPositions([]);
    setFlightLogs([]);
    setDroneTrailResetKey(prev => prev + 1);
    localStorage.removeItem('savedPolygon');
    localStorage.removeItem('savedGridData');
    localStorage.removeItem('flightPlannerState');
    
    if (mapRef.current && typeof mapRef.current.clearAll === 'function') {
      mapRef.current.clearAll();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      overflow: 'hidden' 
    }}>
      {/* App Bar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 1 }}>
            P6.scan - Self Controlled Aerial Navigation
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              component="span" 
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: connected ? 'success.main' : 'error.main',
                display: 'inline-block'
              }} 
            />
            <Typography variant="body2" sx={{ mr: 2 }}>
              {connected ? 'Server Connected' : 'Server Disconnected'}
            </Typography>
            <Button 
              variant="contained" 
              color={droneConnected ? "error" : "primary"}
              onClick={handleConnectDrone}
              disabled={!connected}
              size="small"
            >
              {droneConnected ? 'Disconnect Drone' : 'Connect Drone'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex', 
        flexGrow: 1, 
        overflow: 'hidden'
      }}>
        {/* Map Area */}
        <Box sx={{ 
          flexGrow: 3, 
          height: '100%', 
          position: 'relative',
          minWidth: 0 
        }}>
          <MapComponent 
            ref={mapRef} 
            polygon={polygonPositions}
            onPolygonCreated={handlePolygonCreated}
            droneTrailResetKey={droneTrailResetKey}
          />
        </Box>

        {/* Sidebar */}
        <Paper 
          sx={{ 
            width: 380, 
            minWidth: 320, 
            maxWidth: 420, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
            borderLeft: '1px solid #e0e0e0',
            overflow: 'auto'
          }}
        >
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Flight Planner first, then other components */}
            <FlightPlanner 
              mapRef={mapRef} 
              polygon={polygonPositions} 
              onClearAll={handleClearAll}
            />
            <DroneStatusPanel />
            <PhotoDisplay />
            
            <Button 
              variant="outlined" 
              color="primary"
              onClick={toggleLogs}
              sx={{ mt: 2 }}
            >
              {logsVisible ? 'Hide Terminal Logs' : 'Show Terminal Logs'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Terminal Logs */}
      {logsVisible && (
        <Paper 
          sx={{ 
            height: terminalHeight, 
            borderTop: '1px solid #e0e0e0', 
            overflow: 'hidden',
            boxShadow: '0 -4px 10px rgba(0,0,0,0.1)'
          }}
        >
          <TerminalLogs logs={flightLogs} />
        </Paper>
      )}
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;