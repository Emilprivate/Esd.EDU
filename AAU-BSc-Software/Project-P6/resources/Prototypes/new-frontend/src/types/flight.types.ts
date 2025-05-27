import { MapComponentHandle } from './map.types';

export interface FlightPlannerProps {
  mapRef: React.RefObject<MapComponentHandle>;
  polygon?: [number, number][];
  onClearAll?: () => void;
}

export interface GridData {
  grid_count: number;
  grids: any[];
  waypoints: any[];
  path_metrics: {
    total_distance: number;
    estimated_flight_time: number;
  };
  start_point?: { lat: number; lon: number };
  drone_start_point?: { lat: number; lon: number };
}

export type FlightStep = 'idle' | 'in_progress' | 'complete';
