export interface Point {
  lat: number;
  lng: number;
}

export interface DroneSettings {
  altitude: number;
  fieldOfView: number; // in meters
  overlapPercentage: number;
}

export interface RoutePoint extends Point {
  order: number;
}
