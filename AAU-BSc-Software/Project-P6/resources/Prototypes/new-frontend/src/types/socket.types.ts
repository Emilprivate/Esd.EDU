import React from 'react';

export interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface SocketContextType {
  socket: any;
  connected: boolean;
  droneConnected: boolean;
  gps: GpsData | null;
  gpsSignal: string | null;
  motionState: string | null;
  batteryPercent: number | null;
  latestPhotoBase64: string | null;
  latestPhotoDetected: boolean;
  emitEvent: <T>(event: string, data: any) => Promise<T>;
  calculateGrid: (data: CalculateGridParams) => Promise<any>;
  executeFlight: (data: ExecuteFlightParams) => Promise<any>;
  connectDrone: () => Promise<any>;
  disconnectDrone: () => Promise<any>;
}

export interface CalculateGridParams {
  coordinates: [number, number][];
  altitude: number;
  overlap: number;
  coverage: number;
  start_point?: { lat: number; lon: number };
  drone_start_point?: { lat: number; lon: number };
}

export interface ExecuteFlightParams {
  waypoints: {
    lat: number;
    lon: number;
    type: string;
    grid_id?: number;
    order?: number;
    rotation?: number;
  }[];
  altitude: number;
  start_point?: { lat: number; lon: number };
  drone_start_point?: { lat: number; lon: number };
  flight_mode?: string;
}

export interface SocketProviderProps {
  children: React.ReactNode;
}
