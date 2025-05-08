import React, { useEffect, useRef } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search,
  MyLocation,
  Refresh,
  Flag,
  PlayArrow,
  Stop,
  ZoomIn,
  ZoomOut,
  Layers,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import { useSocket } from "../../context/socket-context";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const MapContainer = styled(Box)({
  height: "calc(100% - 48px)",
  width: "100%",
  position: "relative",
  borderRadius: "8px",
  overflow: "hidden",
});

const MapToolbar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0.75),
  backgroundColor: theme.palette.background.paper,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
}));

const MapControls = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "10px",
  right: "10px",
  zIndex: 1000,
  backgroundColor: "rgba(26, 26, 26, 0.8)",
  borderRadius: "4px",
  padding: theme.spacing(0.5),
  backdropFilter: "blur(4px)",
}));

const MissionSection: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const { telemetry, droneConnected } = useSocket();

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      // Initialize map
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([55.6761, 12.5683], 13); // Copenhagen coordinates

      // Add satellite layer
      L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: "&copy; Google Maps",
      }).addTo(leafletMap.current);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update drone position on map
  useEffect(() => {
    if (
      leafletMap.current &&
      droneConnected &&
      telemetry.latitude !== 0 &&
      telemetry.longitude !== 0
    ) {
      // Remove any existing markers
      leafletMap.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          layer.remove();
        }
      });

      // Add new marker
      const marker = L.marker([telemetry.latitude, telemetry.longitude]).addTo(
        leafletMap.current
      );
      marker.bindPopup(`Altitude: ${telemetry.altitude}m`).openPopup();

      // Center map on drone
      leafletMap.current.setView(
        [telemetry.latitude, telemetry.longitude],
        leafletMap.current.getZoom()
      );
    }
  }, [telemetry, droneConnected]);

  const handleZoomIn = () => {
    if (leafletMap.current) {
      leafletMap.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletMap.current) {
      leafletMap.current.zoomOut();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <MapToolbar>
        <Typography variant="subtitle1" sx={{ mr: 2 }}>
          Mission Map
        </Typography>

        <TextField
          placeholder="Search location..."
          size="small"
          sx={{ mr: 1, flex: 1, fontSize: "0.8rem" }}
          InputProps={{
            startAdornment: (
              <Search fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
            ),
            sx: { fontSize: "0.8rem" },
          }}
        />

        <Button
          size="small"
          variant="outlined"
          startIcon={<MyLocation />}
          sx={{ mr: 1, minWidth: "auto", px: 1 }}
        >
          Place
        </Button>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Flag />}
          sx={{ mr: 1, minWidth: "auto", px: 1 }}
        >
          Set
        </Button>

        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          sx={{ mr: 1 }}
          disabled={!droneConnected}
        >
          Execute
        </Button>

        <Button
          size="small"
          variant="contained"
          color="error"
          startIcon={<Stop />}
          disabled={!droneConnected}
        >
          Abort
        </Button>
      </MapToolbar>

      <MapContainer ref={mapRef}>
        <MapControls>
          <Tooltip title="Zoom In">
            <IconButton
              size="small"
              onClick={handleZoomIn}
              sx={{ color: "white" }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton
              size="small"
              onClick={handleZoomOut}
              sx={{ color: "white" }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Map Layers">
            <IconButton size="small" sx={{ color: "white" }}>
              <Layers fontSize="small" />
            </IconButton>
          </Tooltip>
        </MapControls>
      </MapContainer>
    </Paper>
  );
};

export default MissionSection;
