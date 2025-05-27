import React, { useState, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { useSocket } from "../../context/socket-context";

const CameraContainer = styled(Box)({
  height: "calc(50vh - 64px)",
  width: "100%",
  position: "relative",
  overflow: "hidden",
});

const NoSignalContainer = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E\")",
  backgroundColor: "#101010",
});

const StatusIndicator = styled("div")({
  position: "absolute",
  top: 10,
  right: 10,
  width: 12,
  height: 12,
  borderRadius: "50%",
  backgroundColor: "#e74c3c",
  boxShadow: "0 0 5px rgba(255, 0, 0, 0.5)",
});

const DateTimeDisplay = styled(Typography)({
  position: "absolute",
  bottom: 10,
  right: 10,
  color: "white",
  fontSize: "0.8rem",
  fontFamily: "monospace",
  textShadow: "0 0 2px #000",
});

const CameraFeed: React.FC = () => {
  const { droneConnected } = useSocket();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(now.getDate()).padStart(2, "0")} ` +
          `${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ p: 1, backgroundColor: "background.paper" }}>
        <Typography variant="subtitle1">Live Camera Feed</Typography>
      </Box>

      <CameraContainer>
        <NoSignalContainer>
          <Typography
            variant="h5"
            sx={{ color: "white", textShadow: "0 0 5px rgba(0,0,0,0.8)" }}
          >
            {droneConnected ? "NO SIGNAL" : "DRONE NOT CONNECTED"}
          </Typography>
        </NoSignalContainer>
        <StatusIndicator />
        <DateTimeDisplay>{currentTime}</DateTimeDisplay>
      </CameraContainer>
    </Paper>
  );
};

export default CameraFeed;
