import React from "react";
import { Button } from "@mui/material";

export default function ControlsClearButton({
  flightStep,
  polygonPositions,
  handleClearAll,
  droneConnected,
}) {
  if (flightStep !== "in_progress" && polygonPositions.length > 0) {
    return (
      <Button
        variant="outlined"
        color="error"
        onClick={handleClearAll}
        disabled={!droneConnected}
        sx={{ mt: 2 }}
        fullWidth
      >
        Clear All
      </Button>
    );
  }
  return null;
}
