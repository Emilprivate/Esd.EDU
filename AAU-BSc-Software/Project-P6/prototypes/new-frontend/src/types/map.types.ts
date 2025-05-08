import * as L from 'leaflet';

export interface MapComponentProps {
  polygon?: number[][];
  waypoints?: { lat: number; lon: number }[];
  onPolygonCreated?: (positions: [number, number][]) => void;
  droneTrailResetKey?: number;
}

export interface MapComponentHandle {
  fitBounds: (bounds: L.LatLngBoundsExpression) => void;
  clearAll: () => void;
}

export interface DroneTrackProps {
  positions: L.LatLngExpression[];
}
