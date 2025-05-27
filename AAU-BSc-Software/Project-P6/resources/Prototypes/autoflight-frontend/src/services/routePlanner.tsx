import { Point, DroneSettings, RoutePoint } from "../types/types";

const EARTH_RADIUS = 6371000; // Earth's radius in meters

function calculateDistance(point1: Point, point2: Point): number {
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const lon1 = (point1.lng * Math.PI) / 180;
  const lon2 = (point2.lng * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

function calculateEffectiveArea(settings: DroneSettings): number {
  // Calculate the effective area the drone can see based on altitude and FOV
  const radius =
    settings.altitude * Math.tan((settings.fieldOfView * Math.PI) / 180);
  return Math.PI * radius * radius;
}

export function generateOptimalRoute(
  boundaryPoints: Point[],
  droneSettings: DroneSettings
): RoutePoint[] {
  const effectiveViewDistance =
    droneSettings.fieldOfView * 2 * (1 - droneSettings.overlapPercentage / 100);

  // Find bounding box
  const lats = boundaryPoints.map((p) => p.lat);
  const lngs = boundaryPoints.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Calculate grid points
  const latDistance = calculateDistance(
    { lat: minLat, lng: minLng },
    { lat: maxLat, lng: minLng }
  );
  const lngDistance = calculateDistance(
    { lat: minLat, lng: minLng },
    { lat: minLat, lng: maxLng }
  );

  // Calculate number of rows and columns needed
  const rows = Math.ceil(latDistance / effectiveViewDistance);
  const cols = Math.ceil(lngDistance / effectiveViewDistance);

  const route: RoutePoint[] = [];
  let order = 0;

  // Generate serpentine pattern
  for (let row = 0; row < rows; row++) {
    const isReverse = row % 2 === 1;
    const rowPoints: RoutePoint[] = [];

    for (let col = 0; col < cols; col++) {
      const lat = minLat + (row / rows) * (maxLat - minLat);
      const lng = minLng + (col / cols) * (maxLng - minLng);

      if (isPointInPolygon({ lat, lng }, boundaryPoints)) {
        rowPoints.push({ lat, lng, order: order++ });
      }
    }

    if (isReverse) {
      rowPoints.reverse();
    }

    route.push(...rowPoints);
  }

  return route;
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng,
      yi = polygon[i].lat;
    const xj = polygon[j].lng,
      yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
