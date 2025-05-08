import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { styled } from "@mui/system";
import { useSocket } from "../../context/socket-context";

const StatusLabel = styled("span")<{ status: "connected" | "disconnected" }>(
  ({ theme, status }) => ({
    color:
      status === "connected"
        ? theme.palette.secondary.main
        : theme.palette.error.main,
    fontWeight: "bold",
    marginLeft: theme.spacing(0.5),
  })
);

const BatteryIndicator = styled("div")({
  width: 40,
  height: 10,
  backgroundColor: "#555",
  borderRadius: 3,
  overflow: "hidden",
  display: "inline-block",
  verticalAlign: "middle",
  marginLeft: 5,
});

const BatteryLevel = styled("div")<{ level: number }>(({ theme, level }) => {
  let color = theme.palette.secondary.main;
  if (level <= 20) color = theme.palette.error.main;
  else if (level <= 50) color = theme.palette.warning.main;

  return {
    height: "100%",
    width: `${level}%`,
    backgroundColor: color,
  };
});

const TopBar: React.FC = () => {
  const {
    backendConnected,
    droneConnected,
    battery,
    connectToBackend,
    connectDrone,
    disconnectDrone,
  } = useSocket();

  return (
    <AppBar position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          P6.scan Socket Example
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Backend:
            <StatusLabel
              status={backendConnected ? "connected" : "disconnected"}
            >
              {backendConnected ? "Connected" : "Disconnected"}
            </StatusLabel>
          </Typography>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Drone:
            <StatusLabel status={droneConnected ? "connected" : "disconnected"}>
              {droneConnected ? "Connected" : "Disconnected"}
            </StatusLabel>
          </Typography>
          <Typography variant="body2">
            Battery: {battery.level}%
            <BatteryIndicator>
              <BatteryLevel level={battery.level} />
            </BatteryIndicator>
          </Typography>
        </Box>

        <Box>
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={backendConnected}
            onClick={connectToBackend}
            sx={{ mr: 1 }}
          >
            Connect Backend
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={!backendConnected || droneConnected}
            onClick={connectDrone}
            sx={{ mr: 1 }}
          >
            Connect Drone
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={!backendConnected || !droneConnected}
            onClick={disconnectDrone}
          >
            Disconnect
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
