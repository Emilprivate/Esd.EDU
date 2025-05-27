import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import io from "socket.io-client";
import { 
  SocketContextType, 
  SocketProviderProps, 
  GpsData, 
  CalculateGridParams, 
  ExecuteFlightParams 
} from '../types/socket.types';

// Create context with undefined default value
const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = 'http://localhost:5000';

export function SocketProvider({ children }: SocketProviderProps) {
  const socketRef = useRef<any>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [droneConnected, setDroneConnected] = useState<boolean>(false);
  const [gps, setGps] = useState<GpsData | null>(null);
  const [gpsSignal, setGpsSignal] = useState<string | null>(null);
  const [motionState, setMotionState] = useState<string | null>(null);
  const [batteryPercent, setBatteryPercent] = useState<number | null>(null);
  const [latestPhotoBase64, setLatestPhotoBase64] = useState<string | null>(null);
  const [latestPhotoDetected, setLatestPhotoDetected] = useState<boolean>(false);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
      });
    }
    const socket = socketRef.current;

    function handleConnect() {
      console.log('Socket connected');
      setConnected(true);
    }

    function handleDisconnect() {
      console.log('Socket disconnected');
      setConnected(false);
    }

    function handleDroneStatus(status: { connected: boolean }) {
      console.log('Received drone status:', status);
      if (status && typeof status.connected === 'boolean') {
        setDroneConnected(status.connected);
      }
    }

    function handleDroneState(data: { motion_state: string }) {
      console.log('Received drone state:', data);
      if (data && typeof data.motion_state === 'string') {
        setMotionState(data.motion_state);
      }
    }

    function handleGpsUpdate(data: any) {
      console.log('Received GPS update:', data);
      if (
        data &&
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        typeof data.altitude === 'number'
      ) {
        setGps({
          latitude: data.latitude,
          longitude: data.longitude,
          altitude: data.altitude,
        });
        setGpsSignal(null);
      }

      if (data && typeof data.motion_state === 'string') {
        setMotionState(data.motion_state);
      }
    }

    function handleFlightLog(log: { action: string; message: string }) {
      console.log('Received flight log:', log);
      if (log.action === 'GPS Signal' && log.message) {
        setGpsSignal(log.message);
        setGps(null);
      }
    }

    function handleMotionUpdate(data: { motion_state: string }) {
      if (data && typeof data.motion_state === 'string') {
        setMotionState(data.motion_state);
      }
    }

    function handleBatteryUpdate(data: { battery_percent: number }) {
      if (data && typeof data.battery_percent === 'number') {
        setBatteryPercent(data.battery_percent);
      }
    }

    function handlePhotoUpdate(data: any) {
      // Accept both array and single object for robustness
      let photo = null;
      if (Array.isArray(data)) {
        if (data.length > 0 && data[0].photo_base64) {
          console.log('Updating image (array)');
          photo = data[0];
        }
      } else if (data && typeof data === 'object' && data.photo_base64) {
        console.log('Updating image (object)');
        photo = data;
      } else {
        console.log('photo_update received but no valid photo_base64 found', data);
      }

      if (photo && photo.photo_base64) {
        setLatestPhotoBase64(photo.photo_base64);
        setLatestPhotoDetected(!!photo.detected);
      }
    }

    // stream all server logs (olympe + custom) to browser console
    function handleServerLog(log: any) {
      console.log('Server Log:', log);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('drone_status', handleDroneStatus);
    socket.on('drone_state', handleDroneState);
    socket.on('gps_update', handleGpsUpdate);
    socket.on('flight_log', handleFlightLog);
    socket.on('motion_update', handleMotionUpdate);
    socket.on('battery_update', handleBatteryUpdate);
    socket.on('server_log', handleServerLog);

    socket.onAny((event: string, ...args: any[]) => {
      // General log for any event
      console.log('[SocketIO Context] Event:', event, args);
      // Specific log for flight_log events at the context level
      if (event === 'flight_log') {
        console.log('[SocketIO Context] Received flight_log:', args[0]);
      }
    });

    socket.on('photo_update', handlePhotoUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('drone_status', handleDroneStatus);
      socket.off('drone_state', handleDroneState);
      socket.off('gps_update', handleGpsUpdate);
      socket.off('flight_log', handleFlightLog);
      socket.off('motion_update', handleMotionUpdate);
      socket.off('battery_update', handleBatteryUpdate);
      socket.off('photo_update', handlePhotoUpdate);
      socket.off('server_log', handleServerLog);
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emitEvent = React.useCallback(
    <T,>(event: string, data: any): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !connected) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit(event, data, (response: any) => {
          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response as T);
          }
        });
      });
    },
    [connected]
  );

  const calculateGrid = React.useCallback(
    async (data: CalculateGridParams) => emitEvent('calculate_grid', data),
    [emitEvent]
  );
  
  const executeFlight = React.useCallback(
    async (data: ExecuteFlightParams) => emitEvent('execute_flight', data),
    [emitEvent]
  );
  
  const connectDrone = React.useCallback(
    async () => emitEvent('connect_drone', {}),
    [emitEvent]
  );
  
  const disconnectDrone = React.useCallback(
    async () => emitEvent('disconnect_drone', {}),
    [emitEvent]
  );

  const contextValue = React.useMemo(
    () => ({
      socket: socketRef.current || null,
      connected,
      droneConnected,
      gps,
      gpsSignal,
      motionState,
      batteryPercent,
      latestPhotoBase64,
      latestPhotoDetected,
      emitEvent,
      calculateGrid,
      executeFlight,
      connectDrone,
      disconnectDrone,
    }),
    [
      connected,
      droneConnected,
      gps,
      gpsSignal,
      motionState,
      batteryPercent,
      latestPhotoBase64,
      latestPhotoDetected,
      emitEvent,
      calculateGrid,
      executeFlight,
      connectDrone,
      disconnectDrone,
    ]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;