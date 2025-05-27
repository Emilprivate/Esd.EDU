import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import ListAltIcon from "@mui/icons-material/ListAlt";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

export default function Header({
  showMissions,
  setShowMissions,
  connected,
  droneConnected,
  handleConnectDrone,
  connectingDrone,
}) {
  return (
    <AppBar
      position="static"
      elevation={2}
      sx={{ bgcolor: "background.appBar" }}
    >
      <Toolbar sx={{ px: 3 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: "bold", color: "white" }}
        >
          P6.scan - Self Controlled Aerial Navigation
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Missions Button */}
          <Button
            variant={showMissions ? "contained" : "outlined"}
            color="primary"
            onClick={() => setShowMissions((prev) => !prev)}
            size="small"
            sx={{
              minWidth: 130,
              bgcolor: showMissions ? "primary.main" : "rgba(255,255,255,0.2)",
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": {
                bgcolor: showMissions
                  ? "primary.dark"
                  : "rgba(255,255,255,0.3)",
                borderColor: "white",
              },
            }}
            startIcon={<ListAltIcon />}
          >
            {showMissions ? "Back" : "Previous Missions"}
          </Button>
          <Button
            variant={droneConnected ? "contained" : "outlined"}
            color={droneConnected ? "error" : "inherit"}
            onClick={() => {
              if (droneConnected) {
                if (
                  window.confirm(
                    "Do you really want to disconnect the drone? Please don't disconnect the drone mid flight, you will have to take over manually with the controller!"
                  )
                ) {
                  handleConnectDrone();
                }
              } else {
                handleConnectDrone();
              }
            }}
            disabled={!connected || connectingDrone}
            startIcon={<FlightTakeoffIcon />}
            size="small"
            sx={{
              minWidth: 130,
              bgcolor: droneConnected ? "error.main" : "rgba(255,255,255,0.2)",
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": {
                bgcolor: droneConnected
                  ? "error.dark"
                  : "rgba(255,255,255,0.3)",
                borderColor: "white",
              },
            }}
          >
            {connectingDrone
              ? "Connecting..."
              : droneConnected
              ? "Disconnect Drone"
              : "Connect Drone"}
          </Button>
          {/* Status indicators stacked vertically in the right corner */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start", // Left-align icon+text
            }}
          >
            {/* Server status (always shown) */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.2 }}>
              <Box
                component="span"
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: connected ? "success.main" : "error.main",
                  display: "inline-block",
                  mr: 1,
                  animation: "pulse 1.5s infinite",
                  boxShadow: connected
                    ? "0 0 4px rgba(76,175,80,0.7)"
                    : "0 0 4px rgba(244,67,54,0.7)",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {connected ? "Server Connected" : "Server Disconnected"}
              </Typography>
            </Box>
            {/* Drone status (only if server is connected) */}
            {connected && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: droneConnected ? "success.main" : "error.main",
                    display: "inline-block",
                    mr: 1,
                    animation: "pulse 1.5s infinite",
                    boxShadow: droneConnected
                      ? "0 0 4px rgba(76,175,80,0.7)"
                      : "0 0 4px rgba(244,67,54,0.7)",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "white",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {droneConnected ? "Drone Connected" : "Drone Disconnected"}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
