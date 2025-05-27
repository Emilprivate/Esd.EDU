import React from "react";
import { useSocket } from "../context/SocketContext";
import { Paper, Typography, Grid, Box, Chip } from "@mui/material";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import FlightIcon from "@mui/icons-material/Flight";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

function DroneStatusPanel() {
  const { gps, gpsSignal, motionState, batteryPercent, droneConnected } =
    useSocket();

  const hasValidGps =
    gps &&
    typeof gps.latitude === "number" &&
    typeof gps.longitude === "number" &&
    !(gps.latitude === 0 && gps.longitude === 0) &&
    !gpsSignal;

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, bgcolor: "background.paper", minHeight: 260 }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ pb: 1, borderBottom: 1, borderColor: "divider" }}
      >
        Drone Status
      </Typography>
      {!droneConnected ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 180,
            color: "text.secondary",
            gap: 2,
          }}
        >
          <PowerSettingsNewIcon color="error" sx={{ fontSize: 48 }} />
          <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
            Drone not connected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check your drone connection.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <StatusItem
              label="GPS Signal"
              value={hasValidGps ? "Valid" : gpsSignal || "No Signal"}
              color={hasValidGps ? "success" : "error"}
              icon={<SignalCellularAltIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={6}>
            <StatusItem
              label="Battery"
              value={batteryPercent !== null ? `${batteryPercent}%` : "Unknown"}
              icon={<BatteryFullIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={6}>
            <StatusItem
              label="Motion"
              value={
                motionState
                  ? motionState.charAt(0).toUpperCase() + motionState.slice(1)
                  : "Unknown"
              }
              icon={<FlightIcon fontSize="small" />}
            />
          </Grid>
          {hasValidGps && (
            <>
              <Grid item xs={6}>
                <StatusItem
                  label="Altitude"
                  value={`${gps.altitude.toFixed(2)}m`}
                  icon={<LocationOnIcon fontSize="small" />}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <StatusItem
                  label="Latitude"
                  value={gps.latitude.toFixed(6)}
                  icon={<LocationOnIcon fontSize="small" />}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <StatusItem
                  label="Longitude"
                  value={gps.longitude.toFixed(6)}
                  icon={<LocationOnIcon fontSize="small" />}
                  fullWidth
                />
              </Grid>
            </>
          )}
        </Grid>
      )}
    </Paper>
  );
}

// Helper component for status items
function StatusItem({ label, value, color, icon, fullWidth }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {icon && (
          <Box sx={{ mr: 0.5, display: "flex", alignItems: "center" }}>
            {icon}
          </Box>
        )}
        {color ? (
          <Chip
            label={value}
            size="small"
            color={color}
            variant="filled"
            sx={{
              height: 24,
              "& .MuiChip-label": { px: 1 },
              ...(fullWidth && { width: "100%", justifyContent: "flex-start" }),
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              ...(fullWidth && { width: "100%" }),
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default DroneStatusPanel;
