import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import io from "socket.io-client";
import {
  TelemetryData,
  DroneState,
  BatteryStatus,
  AttitudeData,
  SpeedData,
  GpsFixState,
  LogEntry,
  CommandResult,
  ConnectionStatus,
  TestCase,
} from "../types";

// We're avoiding TypeScript issues by using any instead of specific Socket types
interface SocketContextType {
  socket: any;
  backendConnected: boolean;
  droneConnected: boolean;
  connectToBackend: () => void;
  disconnectBackend: () => void;
  connectDrone: () => void;
  disconnectDrone: () => void;
  sendCommand: (command: string, data?: any) => void;
  telemetry: TelemetryData;
  droneState: DroneState;
  battery: BatteryStatus;
  attitude: AttitudeData;
  speed: SpeedData;
  gpsFix: GpsFixState;
  logs: LogEntry[];
  clearLogs: () => void;
  testCases: TestCase[];
  runTest: (testId: string) => void;
}

const defaultTelemetry: TelemetryData = {
  latitude: 0,
  longitude: 0,
  altitude: 0,
};
const defaultDroneState: DroneState = { event: "N/A", state: "N/A" };
const defaultBattery: BatteryStatus = { level: 0 };
const defaultAttitude: AttitudeData = { roll: 0, pitch: 0, yaw: 0 };
const defaultSpeed: SpeedData = { speedX: 0, speedY: 0, speedZ: 0 };
const defaultGpsFix: GpsFixState = { fixed: false };

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<any>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [droneConnected, setDroneConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>(defaultTelemetry);
  const [droneState, setDroneState] = useState<DroneState>(defaultDroneState);
  const [battery, setBattery] = useState<BatteryStatus>(defaultBattery);
  const [attitude, setAttitude] = useState<AttitudeData>(defaultAttitude);
  const [speed, setSpeed] = useState<SpeedData>(defaultSpeed);
  const [gpsFix, setGpsFix] = useState<GpsFixState>(defaultGpsFix);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const connectToBackend = () => {
    if (socket) return;

    // Import socket.io-client dynamically to avoid TypeScript issues
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setBackendConnected(true);
      addLog("INFO", "FRONTEND", "Connected to backend");
    });

    newSocket.on("disconnect", () => {
      setBackendConnected(false);
      setDroneConnected(false);
      addLog("WARN", "FRONTEND", "Disconnected from backend");
    });

    setupSocketListeners(newSocket);
  };

  const disconnectBackend = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setBackendConnected(false);
      setDroneConnected(false);
      resetAllData();
      addLog("INFO", "FRONTEND", "Disconnected from backend");
    }
  };

  const setupSocketListeners = (socket: any) => {
    socket.on("telemetry", (data: TelemetryData) => {
      setTelemetry(data);
    });

    socket.on("state_update", (data: DroneState) => {
      setDroneState(data);
    });

    socket.on("battery_update", (data: BatteryStatus) => {
      setBattery(data);
    });

    socket.on("attitude_update", (data: AttitudeData) => {
      setAttitude(data);
    });

    socket.on("speed_update", (data: SpeedData) => {
      setSpeed(data);
    });

    socket.on("gps_fix_state", (data: GpsFixState) => {
      setGpsFix(data);
    });

    socket.on("drone_connection_status", (data: ConnectionStatus) => {
      setDroneConnected(data.connected);
      if (data.error) {
        addLog("ERROR", "FRONTEND", `Drone connection error: ${data.error}`);
      } else if (data.connecting) {
        addLog("INFO", "FRONTEND", "Connecting to drone...");
      } else if (data.connected) {
        addLog("INFO", "FRONTEND", "Drone connected successfully");
      } else if (!data.connecting && !data.connected) {
        addLog("INFO", "FRONTEND", "Drone disconnected");
      }
    });

    socket.on("backend_log", (logData: LogEntry) => {
      addLog(
        logData.level,
        logData.component,
        logData.message,
        logData.timestamp
      );
    });

    socket.on("command_result", (result: CommandResult) => {
      const commandName =
        result.command.charAt(0).toUpperCase() + result.command.slice(1);
      if (result.success) {
        addLog("INFO", "COMMAND", `${commandName} command succeeded`);
      } else {
        const errorMsg = result.error ? `: ${result.error}` : "";
        addLog("ERROR", "COMMAND", `${commandName} command failed${errorMsg}`);
      }
    });

    socket.on("available_tests", (tests: TestCase[]) => {
      setTestCases(tests);
    });

    socket.on(
      "test_status_change",
      (data: {
        testId: string;
        status: "idle" | "running" | "success" | "failed";
      }) => {
        setTestCases((prev) =>
          prev.map((test) =>
            test.id === data.testId ? { ...test, status: data.status } : test
          )
        );

        // If test is running or completed, log it
        if (data.status === "running") {
          addLog("INFO", "TEST", `Test '${data.testId}' started running`);
        } else if (data.status === "success") {
          addLog(
            "INFO",
            "TEST",
            `Test '${data.testId}' completed successfully`
          );
        } else if (data.status === "failed") {
          addLog("ERROR", "TEST", `Test '${data.testId}' failed`);
        }
      }
    );

    // Handle test data updates - these will simulate drone data changes from tests
    socket.on("test_data_update", (data: any) => {
      // Update relevant drone data based on test results
      if (data.telemetry)
        setTelemetry((prevState) => ({ ...prevState, ...data.telemetry }));
      if (data.attitude)
        setAttitude((prevState) => ({ ...prevState, ...data.attitude }));
      if (data.speed)
        setSpeed((prevState) => ({ ...prevState, ...data.speed }));
      if (data.battery)
        setBattery((prevState) => ({ ...prevState, ...data.battery }));
      if (data.state)
        setDroneState((prevState) => ({ ...prevState, ...data.state }));
      if (data.gpsFix !== undefined) setGpsFix({ fixed: data.gpsFix });

      addLog("INFO", "TEST", `Received test data update`);
    });
  };

  const connectDrone = () => {
    if (socket && backendConnected) {
      socket.emit("connect_drone");
      addLog("INFO", "FRONTEND", "Requesting drone connection");
    }
  };

  const disconnectDrone = () => {
    if (socket && backendConnected && droneConnected) {
      socket.emit("disconnect_drone");
      addLog("INFO", "FRONTEND", "Requesting drone disconnection");
    }
  };

  const sendCommand = (command: string, data: any = null) => {
    if (socket && backendConnected) {
      if (data) {
        socket.emit(command, data);
      } else {
        socket.emit(command);
      }
      addLog("INFO", "FRONTEND", `Sending ${command} command`);
    }
  };

  const runTest = (testId: string) => {
    if (socket && backendConnected && droneConnected) {
      socket.emit("run_test", { testId });
      addLog("INFO", "FRONTEND", `Running test: ${testId}`);

      // Update local test status
      setTestCases((prev) =>
        prev.map((test) =>
          test.id === testId ? { ...test, status: "running" } : test
        )
      );
    }
  };

  const addLog = (
    level: "INFO" | "WARN" | "ERROR",
    component: string,
    message: string,
    timestamp?: string
  ) => {
    const now = new Date();
    const timeStr = timestamp || now.toTimeString().substring(0, 8);

    setLogs((prev) => [
      ...prev,
      {
        timestamp: timeStr,
        level,
        component,
        message,
      },
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog("INFO", "FRONTEND", "Logs cleared");
  };

  const resetAllData = () => {
    setTelemetry(defaultTelemetry);
    setDroneState(defaultDroneState);
    setBattery(defaultBattery);
    setAttitude(defaultAttitude);
    setSpeed(defaultSpeed);
    setGpsFix(defaultGpsFix);
    setTestCases([]);
  };

  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    backendConnected,
    droneConnected,
    connectToBackend,
    disconnectBackend,
    connectDrone,
    disconnectDrone,
    sendCommand,
    telemetry,
    droneState,
    battery,
    attitude,
    speed,
    gpsFix,
    logs,
    clearLogs,
    testCases,
    runTest,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
