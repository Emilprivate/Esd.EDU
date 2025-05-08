import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Box, List, ListItem, Paper, Divider } from '@mui/material';
import { useSocket } from '../context/SocketContext';

// Add interface to augment window object
declare global {
  interface Window {
    socket?: any;
  }
}

const DroneControls: React.FC = () => {
  const { connected, droneConnected, connectDrone, disconnectDrone } = useSocket();
  const [flightLogs, setFlightLogs] = useState<Array<any>>([]);
  
  useEffect(() => {
    const socket = window.socket || ((window as any).socket);
    
    // Flight log handler
    const handleFlightLog = (log: any) => {
      setFlightLogs(prevLogs => {
        // Keep only the last 20 logs
        const newLogs = [...prevLogs, log].slice(-20);
        return newLogs;
      });
    };
    
    if (socket) {
      socket.on('flight_log', handleFlightLog);
      
      return () => {
        socket.off('flight_log', handleFlightLog);
      };
    }
  }, [connected]);
  
  const handleConnect = async () => {
    try {
      await connectDrone();
    } catch (error) {
      console.error('Failed to connect to drone:', error);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await disconnectDrone();
    } catch (error) {
      console.error('Failed to disconnect from drone:', error);
    }
  };
  
  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Drone Controls
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConnect}
            disabled={!connected || droneConnected}
            sx={{ mr: 1 }}
          >
            Connect Drone
          </Button>
          
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDisconnect}
            disabled={!connected || !droneConnected}
          >
            Disconnect Drone
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Flight Logs
        </Typography>
        
        <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1, bgcolor: 'background.default' }}>
          <List dense>
            {flightLogs.length > 0 ? (
              flightLogs.map((log, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <Typography variant="body2" component="div">
                    <strong>{log.action}:</strong> {log.message || JSON.stringify(log)}
                  </Typography>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <Typography variant="body2" color="text.secondary">
                  No flight logs yet
                </Typography>
              </ListItem>
            )}
          </List>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default DroneControls;