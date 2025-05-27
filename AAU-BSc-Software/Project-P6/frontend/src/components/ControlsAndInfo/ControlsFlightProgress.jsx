import React from "react";
import { Paper, CircularProgress, Typography, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ControlsFlightProgress({
  flightStep,
  inProgressStatus,
  progress,
  handleClearAll,
}) {
  if (flightStep === "in_progress") {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {inProgressStatus || "Flight in progress..."}
        </Typography>
        {progress && (
          <Typography variant="body2" color="text.secondary">
            {progress.current} / {progress.total} waypoints completed
          </Typography>
        )}
      </Paper>
    );
  }
  if (flightStep === "complete") {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1.5 }} />
        <Typography variant="h6" gutterBottom>
          Flight complete!
        </Typography>
        <Button
          variant="contained"
          onClick={handleClearAll}
          sx={{ minWidth: 120 }}
        >
          Start New Flight
        </Button>
      </Paper>
    );
  }
  return null;
}
