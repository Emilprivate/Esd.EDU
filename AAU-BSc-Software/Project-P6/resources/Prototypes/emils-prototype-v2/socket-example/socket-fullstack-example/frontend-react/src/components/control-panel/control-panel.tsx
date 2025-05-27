import React, { useState } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Grid,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  FlightTakeoff,
  FlightLand,
  ArrowUpward,
  ArrowDownward,
  ArrowForward,
  ArrowBack,
  RotateLeft,
  RotateRight,
  CheckCircle,
  Error,
  Pending,
  PlayCircleOutline,
} from "@mui/icons-material";
import { styled } from "@mui/system";
import { useSocket } from "../../context/socket-context";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const StyledTabPanel = styled(Box)({
  height: "calc(100% - 48px)",
  overflow: "auto",
});

const CompactListItem = styled(ListItem)({
  padding: "4px 8px",
  marginBottom: "4px",
  borderRadius: "4px",
});

const TestButton = styled(Button)(({ theme }) => ({
  minWidth: "60px",
  padding: "2px 8px",
}));

const MoveButton = styled(Button)({
  minWidth: "45px",
  height: "45px",
  padding: "6px",
});

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`control-tabpanel-${index}`}
      aria-labelledby={`control-tab-${index}`}
      style={{ height: "calc(100% - 48px)" }}
      {...other}
    >
      {value === index && <StyledTabPanel>{children}</StyledTabPanel>}
    </div>
  );
}

const ControlPanel: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const { droneConnected, sendCommand, testCases, runTest } = useSocket();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleTakeoff = () => {
    sendCommand("takeoff");
  };

  const handleLand = () => {
    sendCommand("land");
  };

  const handleMove = (direction: string) => {
    let dx = 0,
      dy = 0,
      dz = 0,
      dpsi = 0;
    const moveDistance = 0.5; // meters
    const rotateAngle = 10; // degrees

    switch (direction) {
      case "forward":
        dx = moveDistance;
        break;
      case "backward":
        dx = -moveDistance;
        break;
      case "left":
        dy = moveDistance;
        break;
      case "right":
        dy = -moveDistance;
        break;
      case "up":
        dz = moveDistance;
        break;
      case "down":
        dz = -moveDistance;
        break;
      case "rotateLeft":
        dpsi = rotateAngle;
        break;
      case "rotateRight":
        dpsi = -rotateAngle;
        break;
    }

    sendCommand("move", { dx, dy, dz, dpsi });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "idle":
        return <PlayCircleOutline fontSize="small" color="disabled" />;
      case "running":
        return <CircularProgress size={18} thickness={4} />;
      case "success":
        return <CheckCircle fontSize="small" color="success" />;
      case "failed":
        return <Error fontSize="small" color="error" />;
      default:
        return <Pending fontSize="small" />;
    }
  };

  const handleRunTest = (testId: string) => {
    runTest(testId);
    // The socket logic already updates the drone state in the socket-context
  };

  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="control panel tabs"
        variant="fullWidth"
        sx={{
          minHeight: "36px",
          "& .MuiTab-root": {
            minHeight: "36px",
            py: 0.5,
          },
        }}
      >
        <Tab label="Manual Control" />
        <Tab label="Test Execution" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Grid container spacing={1} justifyContent="center">
            <Grid item xs={12} container justifyContent="center" spacing={1}>
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<FlightTakeoff />}
                  onClick={handleTakeoff}
                  disabled={!droneConnected}
                  size="small"
                  sx={{ m: 0.5 }}
                >
                  Takeoff
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<FlightLand />}
                  onClick={handleLand}
                  disabled={!droneConnected}
                  size="small"
                  sx={{ m: 0.5 }}
                >
                  Land
                </Button>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>

            <Grid
              item
              container
              xs={12}
              spacing={0.5}
              justifyContent="center"
              alignItems="center"
              sx={{ mt: 0.5 }}
            >
              <Grid item xs={4} textAlign="center">
                <Tooltip title="Rotate Left">
                  <span>
                    <MoveButton
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("rotateLeft")}
                    >
                      <RotateLeft />
                    </MoveButton>
                  </span>
                </Tooltip>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Tooltip title="Forward">
                  <span>
                    <MoveButton
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("forward")}
                    >
                      <ArrowUpward />
                    </MoveButton>
                  </span>
                </Tooltip>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Tooltip title="Rotate Right">
                  <span>
                    <MoveButton
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("rotateRight")}
                    >
                      <RotateRight />
                    </MoveButton>
                  </span>
                </Tooltip>
              </Grid>

              <Grid item xs={4} textAlign="center">
                <Tooltip title="Left">
                  <span>
                    <MoveButton
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("left")}
                    >
                      <ArrowBack />
                    </MoveButton>
                  </span>
                </Tooltip>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Tooltip title="Backward">
                  <span>
                    <MoveButton
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("backward")}
                    >
                      <ArrowDownward />
                    </MoveButton>
                  </span>
                </Tooltip>
              </Grid>
              <Grid item xs={4} textAlign="center">
                <Tooltip title="Right">
                  <span>
                    <MoveButton
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("right")}
                    >
                      <ArrowForward />
                    </MoveButton>
                  </span>
                </Tooltip>
              </Grid>

              <Grid item xs={6} textAlign="center" sx={{ mt: 1 }}>
                <Tooltip title="Up">
                  <span>
                    <Button
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("up")}
                      size="small"
                      sx={{ width: "90%" }}
                    >
                      Up
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
              <Grid item xs={6} textAlign="center" sx={{ mt: 1 }}>
                <Tooltip title="Down">
                  <span>
                    <Button
                      variant="outlined"
                      disabled={!droneConnected}
                      onClick={() => handleMove("down")}
                      size="small"
                      sx={{ width: "90%" }}
                    >
                      Down
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Typography variant="subtitle2" sx={{ px: 1, pb: 1 }}>
          Available Tests
        </Typography>

        <Box sx={{ px: 1 }}>
          {testCases.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", mt: 2, fontSize: "0.8rem" }}
            >
              No tests available. Connect to the backend first.
            </Typography>
          ) : (
            <List dense disablePadding>
              {testCases.map((test) => (
                <CompactListItem
                  key={test.id}
                  disablePadding
                  sx={{
                    backgroundColor:
                      test.status === "running"
                        ? "rgba(77, 171, 245, 0.08)"
                        : test.status === "success"
                        ? "rgba(29, 209, 161, 0.08)"
                        : test.status === "failed"
                        ? "rgba(255, 107, 107, 0.08)"
                        : "transparent",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                      {getStatusIcon(test.status)}
                    </Box>
                    <ListItemText
                      primary={test.name}
                      secondary={test.description}
                      primaryTypographyProps={{ fontSize: "0.8rem" }}
                      secondaryTypographyProps={{ fontSize: "0.7rem" }}
                      sx={{ mr: 1 }}
                    />
                    <TestButton
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={!droneConnected || test.status === "running"}
                      onClick={() => handleRunTest(test.id)}
                    >
                      Run
                    </TestButton>
                  </Box>
                </CompactListItem>
              ))}
            </List>
          )}
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default ControlPanel;
