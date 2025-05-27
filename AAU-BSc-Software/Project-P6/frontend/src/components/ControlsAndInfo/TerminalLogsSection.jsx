import React from "react";
import { Divider, Box } from "@mui/material";
import TerminalLogs from "../TerminalLogs";

export default function TerminalLogsSection({
  flightStep,
  flightLogs,
  handleResizeMouseDown,
  terminalContainerRef,
  terminalHeight,
}) {
  if (
    flightStep === "in_progress" ||
    flightStep === "complete" ||
    (flightLogs && flightLogs.length > 0)
  ) {
    return (
      <>
        <Divider
          sx={{
            my: 2,
            cursor: "ns-resize",
            height: "6px",
            bgcolor: "rgba(0,0,0,0.09)",
            "&:hover": {
              bgcolor: (theme) => theme.palette.primary.main,
              opacity: 0.7,
            },
          }}
          onMouseDown={handleResizeMouseDown}
        />
        <Box ref={terminalContainerRef} sx={{ height: terminalHeight }}>
          <TerminalLogs logs={flightLogs} />
        </Box>
      </>
    );
  }
  return null;
}
