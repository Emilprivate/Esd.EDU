import { useEffect, useRef, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box, Typography, Paper } from "@mui/material";
import AltRouteIcon from "@mui/icons-material/AltRoute"; // Add this import at the top

// Esri Satellite tile layer (same as MapComponent)
const SATELLITE_TILE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  maxZoom: 19,
};

const droneStartIcon = L.divIcon({
  html: '<div style="background-color: #ff9800; width: 18px; height: 18px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
  className: "drone-start-icon",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const startPointIcon = L.divIcon({
  html: '<div style="background-color: #4CAF50; width: 16px; height: 16px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
  className: "start-point-icon",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
const waypointIcon = L.divIcon({
  html: '<div style="width: 10px; height: 10px; background-color: #0066ff; border: 2px solid white; border-radius: 50%;"></div>',
  className: "waypoint-icon",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function MissionMap({ waypoints = [], startPoint, droneStartPoint }) {
  // Generate a unique key for the map container based on mission data
  const mapKey = useMemo(() => {
    // Use a hash of the mission data to force a new DOM node when mission changes
    const hash = JSON.stringify({ waypoints, startPoint, droneStartPoint });
    let h = 0,
      i = 0,
      chr;
    for (; i < hash.length; i++) {
      chr = hash.charCodeAt(i);
      h = (h << 5) - h + chr;
      h |= 0;
    }
    return `mission-map-${Math.abs(h)}`;
  }, [waypoints, startPoint, droneStartPoint]);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Helper to normalize [lat,lon] or {lat,lon}
  const toLatLng = (pt) => {
    if (!pt) return null;
    if (Array.isArray(pt)) return pt;
    if (typeof pt === "object" && pt.lat != null && pt.lon != null)
      return [pt.lat, pt.lon];
    return null;
  };

  // Compose the full path: droneStart -> (startPoint?) -> waypoints -> droneStart
  const pathPoints = [];
  const droneStart = toLatLng(droneStartPoint);
  const start = toLatLng(startPoint);

  if (droneStart) pathPoints.push(droneStart);
  if (
    start &&
    (!droneStart || start[0] !== droneStart[0] || start[1] !== droneStart[1])
  )
    pathPoints.push(start);
  waypoints.forEach((wp) => {
    const pt = toLatLng(wp);
    if (pt) pathPoints.push(pt);
  });
  if (droneStart) pathPoints.push(droneStart);

  useEffect(() => {
    // Defensive: clear any previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (!mapRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
      attributionControl: false,
      inertia: false,
      interactive: false,
    });
    mapInstanceRef.current = map;

    // Add Esri Satellite tile layer
    L.tileLayer(SATELLITE_TILE.url, {
      attribution: SATELLITE_TILE.attribution,
      maxZoom: SATELLITE_TILE.maxZoom,
    }).addTo(map);

    // Draw path polyline
    if (pathPoints.length > 1) {
      L.polyline(pathPoints, {
        color: "#1976d2",
        weight: 3,
        opacity: 0.8,
        dashArray: "8,4",
      }).addTo(map);

      // Draw arrows for each segment (at the end of each segment)
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const from = pathPoints[i];
        const to = pathPoints[i + 1];
        // Calculate angle in degrees from 'from' to 'to'
        const diffLat = to[0] - from[0];
        const diffLng = to[1] - from[1];
        const angle =
          360 - Math.atan2(diffLat, diffLng) * 57.295779513082 + 180;

        // Place arrow at 80% along the segment
        const lat = from[0] + (to[0] - from[0]) * 0.8;
        const lon = from[1] + (to[1] - from[1]) * 0.8;
        // Arrow as a rotated SVG marker
        const arrowIcon = L.divIcon({
          html: `<svg width="22" height="22" style="transform:rotate(${angle}deg)" viewBox="0 0 22 22"><polygon points="0,11 16,6 16,9 22,9 22,13 16,13 16,16" fill="#1976d2" /></svg>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          className: "arrow-icon",
        });
        L.marker([lat, lon], { icon: arrowIcon, interactive: true })
          .addTo(map)
          .bindTooltip(
            i === 0
              ? start
                ? "Start: Drone takes off, then flies to custom start"
                : "Start: Drone takes off"
              : i === pathPoints.length - 2
              ? "Return to drone start position"
              : `Waypoint ${i}${start && i === 1 ? " (custom start)" : ""}`,
            { direction: "top", offset: [0, -10] }
          );
      }
    }

    // Markers
    if (droneStart) {
      L.marker(droneStart, { icon: droneStartIcon, interactive: true })
        .addTo(map)
        .bindTooltip("Drone Start/End Position", { direction: "right" });
    }
    if (
      start &&
      (!droneStart || start[0] !== droneStart[0] || start[1] !== droneStart[1])
    ) {
      L.marker(start, { icon: startPointIcon, interactive: true })
        .addTo(map)
        .bindTooltip("Custom Start Point", { direction: "right" });
    }
    waypoints.forEach((wp, idx) => {
      const pt = toLatLng(wp);
      if (!pt) return;
      L.marker(pt, { icon: waypointIcon, interactive: true })
        .addTo(map)
        .bindTooltip(`Waypoint #${idx + 1}`, { direction: "top" });
    });

    // Fit bounds and lock view
    if (pathPoints.length > 0) {
      const bounds = L.latLngBounds(pathPoints);
      map.fitBounds(bounds.pad(0.2), { animate: false });
      map.setMaxBounds(bounds.pad(0.3));
      map.setMinZoom(map.getZoom());
      map.setMaxZoom(map.getZoom());
    }

    // Clean up on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [mapKey]);

  return (
    <Paper
      elevation={2}
      sx={{
        width: "100%",
        minWidth: 0,
        minHeight: 260,
        height: 320,
        mt: 2,
        p: 1,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, ml: 1 }}>
        <AltRouteIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Mission Path Overview
        </Typography>
      </Box>
      <Box
        key={mapKey}
        ref={mapRef}
        sx={{
          width: "100%",
          height: 260,
          borderRadius: 2,
          overflow: "hidden",
          pointerEvents: "none", // Prevent interaction
        }}
      />
      <Box sx={{ px: 1, pt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <b>Legend:</b> <span style={{ color: "#ff9800" }}>●</span> Drone
          Start/End&nbsp;&nbsp;
          <span style={{ color: "#4CAF50" }}>●</span> Custom Start&nbsp;&nbsp;
          <span style={{ color: "#1976d2" }}>●</span> Waypoint&nbsp;&nbsp;
          <span style={{ color: "#1976d2" }}>→</span> Flight Direction
        </Typography>
      </Box>
    </Paper>
  );
}

export default MissionMap;
