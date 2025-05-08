import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/system";
import { useSocket } from "../../context/socket-context";
import { ExpandMore, ExpandLess, ClearAll } from "@mui/icons-material";

const TerminalContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#0c0c0c",
  color: "#e0e0e0",
  fontFamily: '"JetBrains Mono", "Consolas", "Courier New", monospace',
  fontSize: "0.7rem",
  padding: theme.spacing(0.5),
  overflow: "auto",
  flex: 1,
  borderRadius: 4,
  border: "1px solid rgba(255, 255, 255, 0.05)",
}));

const LogEntry = styled(Box)({
  marginBottom: "2px",
  borderBottom: "1px solid #2a2a2a",
  paddingBottom: "2px",
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
});

const LogTimestamp = styled("span")({
  color: "#666",
  marginRight: "3px",
  fontSize: "0.65rem",
});

const LogComponent = styled("span")({
  color: "#4ec9b0",
  fontWeight: "bold",
  marginRight: "3px",
});

const LogMessage = styled("span")({
  color: "#e0e0e0",
});

const getLogLevelColor = (level: string) => {
  switch (level) {
    case "INFO":
      return "#54a0ff";
    case "WARN":
      return "#feca57";
    case "ERROR":
      return "#ff6b6b";
    default:
      return "#54a0ff";
  }
};

const Terminal: React.FC = () => {
  const { logs, clearLogs } = useSocket();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          px: 1,
          py: 0.5,
          backgroundColor: "background.paper",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Typography variant="subtitle2">Terminal</Typography>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                size="small"
              />
            }
            label="Auto-scroll"
            sx={{
              mr: 1,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.7rem",
                opacity: 0.7,
              },
            }}
          />

          <Tooltip title="Clear logs">
            <IconButton
              size="small"
              onClick={clearLogs}
              sx={{ color: "text.secondary" }}
            >
              <ClearAll fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={expanded ? "Collapse" : "Expand"}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: "text.secondary" }}
            >
              {expanded ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {expanded && (
        <TerminalContainer ref={terminalRef}>
          {logs.map((log, index) => (
            <LogEntry key={index}>
              <LogTimestamp>[{log.timestamp}]</LogTimestamp>
              <span
                style={{
                  color: getLogLevelColor(log.level),
                  marginRight: "3px",
                }}
              >
                [{log.level}]
              </span>
              <LogComponent>[{log.component}]</LogComponent>
              <LogMessage>{log.message}</LogMessage>
            </LogEntry>
          ))}
        </TerminalContainer>
      )}
    </Paper>
  );
};

export default Terminal;
