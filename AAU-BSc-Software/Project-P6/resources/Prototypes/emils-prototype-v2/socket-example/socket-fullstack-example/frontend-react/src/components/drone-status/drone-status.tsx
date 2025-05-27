import React from "react";
import { Box, Paper, Typography, Grid, Divider } from "@mui/material";
import { styled } from "@mui/system";
import { useSocket } from "../../context/socket-context";

const StatusContainer = styled(Box)({
  overflow: "auto",
  flex: 1,
});

const StatusSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.75),
}));

const StatusLabel = styled(Typography)({
  fontWeight: "bold",
  fontSize: "0.7rem",
  color: "rgba(255, 255, 255, 0.7)",
  marginBottom: 0,
});

const StatusValue = styled(Typography)({
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "0.8rem",
  lineHeight: 1.2,
});

const CompactDivider = styled(Divider)({
  margin: "4px 0",
});

const DroneStatus: React.FC = () => {
  const { droneConnected, telemetry, attitude, speed, droneState, gpsFix } =
    useSocket();

  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ p: 1, backgroundColor: "background.paper" }}>
        <Typography variant="subtitle2">Drone Status</Typography>
      </Box>

      <StatusContainer>
        <StatusSection>
          <Typography variant="caption" sx={{ fontWeight: 500, opacity: 0.8 }}>
            Location
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <StatusLabel>Latitude</StatusLabel>
              <StatusValue>
                {droneConnected ? telemetry.latitude.toFixed(6) : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={6}>
              <StatusLabel>Longitude</StatusLabel>
              <StatusValue>
                {droneConnected ? telemetry.longitude.toFixed(6) : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={6}>
              <StatusLabel>Altitude</StatusLabel>
              <StatusValue>
                {droneConnected ? `${telemetry.altitude.toFixed(2)}m` : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={6}>
              <StatusLabel>GPS Fix</StatusLabel>
              <StatusValue
                sx={{ color: gpsFix.fixed ? "success.main" : "error.main" }}
              >
                {droneConnected
                  ? gpsFix.fixed
                    ? "Fixed"
                    : "Not Fixed"
                  : "N/A"}
              </StatusValue>
            </Grid>
          </Grid>
        </StatusSection>

        <CompactDivider />

        <StatusSection>
          <Typography variant="caption" sx={{ fontWeight: 500, opacity: 0.8 }}>
            Orientation
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
              <StatusLabel>Roll</StatusLabel>
              <StatusValue>
                {droneConnected ? `${attitude.roll.toFixed(2)}°` : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={4}>
              <StatusLabel>Pitch</StatusLabel>
              <StatusValue>
                {droneConnected ? `${attitude.pitch.toFixed(2)}°` : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={4}>
              <StatusLabel>Yaw</StatusLabel>
              <StatusValue>
                {droneConnected ? `${attitude.yaw.toFixed(2)}°` : "N/A"}
              </StatusValue>
            </Grid>
          </Grid>
        </StatusSection>

        <CompactDivider />

        <StatusSection>
          <Typography variant="caption" sx={{ fontWeight: 500, opacity: 0.8 }}>
            Speed
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
              <StatusLabel>X</StatusLabel>
              <StatusValue>
                {droneConnected ? `${speed.speedX.toFixed(2)}m/s` : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={4}>
              <StatusLabel>Y</StatusLabel>
              <StatusValue>
                {droneConnected ? `${speed.speedY.toFixed(2)}m/s` : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={4}>
              <StatusLabel>Z</StatusLabel>
              <StatusValue>
                {droneConnected ? `${speed.speedZ.toFixed(2)}m/s` : "N/A"}
              </StatusValue>
            </Grid>
          </Grid>
        </StatusSection>

        <CompactDivider />

        <StatusSection>
          <Typography variant="caption" sx={{ fontWeight: 500, opacity: 0.8 }}>
            State
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <StatusLabel>Current Event</StatusLabel>
              <StatusValue>
                {droneConnected ? droneState.event : "N/A"}
              </StatusValue>
            </Grid>
            <Grid item xs={12}>
              <StatusLabel>Current State</StatusLabel>
              <StatusValue>
                {droneConnected ? droneState.state : "N/A"}
              </StatusValue>
            </Grid>
          </Grid>
        </StatusSection>
      </StatusContainer>
    </Paper>
  );
};

export default DroneStatus;
