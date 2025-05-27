import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/ApiClient';

// Create context
const SocketContext = createContext(null);

// Custom hook for using the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Provider component
export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [gpsData, setGpsData] = useState({ 
    latitude: 0, 
    longitude: 0, 
    altitude: 0, 
    motion_state: 'unknown' 
  });
  const [flightLogs, setFlightLogs] = useState([]);

  useEffect(() => {
    // Setup socket connection when component mounts
    apiClient.onConnect(() => {
      console.log('Socket connected to server');
      setConnected(true);
      apiClient.getDroneStatus((response) => {
        setConnected(response.connected || false);
      });
    });

    apiClient.onDisconnect(() => {
      console.log('Socket disconnected from server');
      setConnected(false);
    });

    // Register event listeners
    const handleGpsUpdate = (data) => {
      console.log('GPS update received:', data);
      setGpsData(prev => ({
        ...prev,
        ...data,
        motion_state: data.motion_state || 'unknown'
      }));
    };

    const handleDroneStatus = (data) => {
      if (typeof data.connected !== "undefined") setConnected(data.connected);
    };

    const handleFlightLog = (data) => {
      addFlightLog(data);
    };

    apiClient.on('gps_update', handleGpsUpdate);
    apiClient.on('drone_status', handleDroneStatus);
    apiClient.on('flight_log', handleFlightLog);

    // Cleanup on unmount
    return () => {
      apiClient.off('gps_update', handleGpsUpdate);
      apiClient.off('drone_status', handleDroneStatus);
      apiClient.off('flight_log', handleFlightLog);
    };
  }, []);

  const addFlightLog = (log) => {
    const timestamp = new Date().toLocaleTimeString();
    setFlightLogs(prevLogs => [
      ...prevLogs, 
      { ...log, timestamp }
    ]);
  };

  return (
    <SocketContext.Provider value={{
      apiClient,
      connected,
      gpsData,
      flightLogs,
      addFlightLog
    }}>
      {children}
    </SocketContext.Provider>
  );
};
