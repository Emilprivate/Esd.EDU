import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [droneConnected, setDroneConnected] = useState(false);
  const [gps, setGps] = useState(null);
  const [gpsSignal, setGpsSignal] = useState(null);
  const [motionState, setMotionState] = useState(null);
  const [batteryPercent, setBatteryPercent] = useState(null);

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
      console.log("Socket connected");
      setConnected(true);
    }

    function handleDisconnect() {
      console.log("Socket disconnected");
      setConnected(false);
    }

    function handleDroneStatus(status) {
      console.log("Received drone status:", status);
      if (status && typeof status.connected === "boolean") {
        setDroneConnected(status.connected);
      }
    }

    function handleDroneState(data) {
      console.log("Received drone state:", data);
      if (data && typeof data.motion_state === "string") {
        setMotionState(data.motion_state);
      }
    }

    function handleGpsUpdate(data) {
      console.log("Received GPS update:", data);
      if (
        data &&
        typeof data.latitude === "number" &&
        typeof data.longitude === "number" &&
        typeof data.altitude === "number"
      ) {
        setGps({
          latitude: data.latitude,
          longitude: data.longitude,
          altitude: data.altitude,
        });
        setGpsSignal(null);
      }
      // Also update motion state if present in gps_update
      if (data && typeof data.motion_state === "string") {
        setMotionState(data.motion_state);
      }
    }

    function handleFlightLog(log) {
      console.log("Received flight log:", log);
      if (log.action === "GPS Signal" && log.message) {
        setGpsSignal(log.message);
        setGps(null);
      }
    }

    function handleMotionUpdate(data) {
      if (data && typeof data.motion_state === "string") {
        setMotionState(data.motion_state);
      }
    }

    function handleBatteryUpdate(data) {
      if (data && typeof data.battery_percent === "number") {
        setBatteryPercent(data.battery_percent);
      }
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("drone_status", handleDroneStatus);
    socket.on("drone_state", handleDroneState);
    socket.on("gps_update", handleGpsUpdate);
    socket.on("flight_log", handleFlightLog);
    socket.on("motion_update", handleMotionUpdate); // <-- add this
    socket.on("battery_update", handleBatteryUpdate);

    // Print all messages received from the socket
    socket.onAny((event, ...args) => {
      console.log("[SocketIO] Event:", event, ...args);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("drone_status", handleDroneStatus);
      socket.off("drone_state", handleDroneState);
      socket.off("gps_update", handleGpsUpdate);
      socket.off("flight_log", handleFlightLog);
      socket.off("motion_update", handleMotionUpdate); // <-- add this
      socket.off("battery_update", handleBatteryUpdate);
      socket.offAny();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Stable emit function
  const emitEvent = React.useCallback(
    (event, data) => {
      return new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || !connected) {
          reject(new Error("Socket not connected"));
          return;
        }
        socket.emit(event, data, (response) => {
          if (response && response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [connected]
  );

  // API helpers
  const calculateGrid = React.useCallback(
    async (data) => emitEvent("calculate_grid", data),
    [emitEvent]
  );
  const executeFlight = React.useCallback(
    async (data) => emitEvent("execute_flight", data),
    [emitEvent]
  );
  const connectDrone = React.useCallback(
    async () => emitEvent("connect_drone", {}),
    [emitEvent]
  );
  const disconnectDrone = React.useCallback(
    async () => emitEvent("disconnect_drone", {}),
    [emitEvent]
  );

  // Context value
  const contextValue = React.useMemo(
    () => ({
      socket: socketRef.current || null,
      connected,
      droneConnected,
      gps,
      gpsSignal,
      motionState,
      batteryPercent,
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
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export default SocketContext;
