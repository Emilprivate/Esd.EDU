export interface TelemetryData {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface DroneState {
  event: string;
  state: string;
}

export interface BatteryStatus {
  level: number;
}

export interface AttitudeData {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface SpeedData {
  speedX: number;
  speedY: number;
  speedZ: number;
}

export interface GpsFixState {
  fixed: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  component: string;
  message: string;
}

export interface CommandResult {
  command: string;
  success: boolean;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connecting?: boolean;
  error?: string;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "success" | "failed";
}
