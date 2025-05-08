import { useState, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import MapComponent from "./components/MapComponent";
import TerminalLogs from "./components/TerminalLogs";
import DroneStatusPanel from "./components/DroneStatusPanel";
import { useSocket } from "./context/SocketContext";
import MissionMap from "./components/MissionMap";

// MUI imports
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Modal,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import StepConnector, {
  stepConnectorClasses,
} from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NorthIcon from "@mui/icons-material/North";
import PhotoCameraFrontIcon from "@mui/icons-material/PhotoCameraFront";
import FlagIcon from "@mui/icons-material/Flag";
import ReplayIcon from "@mui/icons-material/Replay";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

function App() {
  const theme = useTheme();
  const [polygonPositions, setPolygonPositions] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [droneStartPoint, setDroneStartPoint] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [altitude, setAltitude] = useState(20);
  const [overlap, setOverlap] = useState(20);
  const [coverage, setCoverage] = useState(80);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("draw-area");
  const [flightExecuting, setFlightExecuting] = useState(false);
  const [flightStatus, setFlightStatus] = useState(null);
  const [showFlightStatus, setShowFlightStatus] = useState(false);
  const [connectingDrone, setConnectingDrone] = useState(false);
  const [flightLogs, setFlightLogs] = useState([]);
  const [flightStep, setFlightStep] = useState("idle"); // idle | in_progress | complete
  const mapRef = useRef(null);
  const [droneTrailResetKey, setDroneTrailResetKey] = useState(0);
  const [photoMap, setPhotoMap] = useState({});

  const [terminalHeight, setTerminalHeight] = useState(300);
  const resizeStartPositionRef = useRef(null);
  const initialHeightRef = useRef(terminalHeight);
  const terminalContainerRef = useRef(null);

  const [showMissions, setShowMissions] = useState(false); // NEW: toggle missions folder view
  const [missions, setMissions] = useState([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [missionsError, setMissionsError] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [missionData, setMissionData] = useState(null);
  const [missionDataLoading, setMissionDataLoading] = useState(false);
  const [missionDataError, setMissionDataError] = useState(null);

  const {
    connected,
    droneConnected,
    calculateGrid,
    executeFlight,
    connectDrone,
    disconnectDrone,
    gps,
    gpsSignal,
    motionState,
    socket,
    latestPhotoBase64,
    latestPhotoDetected,
    emitEvent,
  } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleFlightLog = (log) => {
      console.log("App.jsx: Received flight_log:", log);
      setFlightLogs((prev) => [...prev, log]);

      if (log.action && typeof log.action === "string") {
        const action = log.action.toLowerCase();
        if (action === "complete") {
          console.log(
            "App.jsx: Flight complete log received! Setting flightStep to 'complete'."
          );
          setFlightStep("complete");
        } else if (action === "emergency_abort") {
          console.log(
            "App.jsx: Emergency abort log received! Setting flightStep to 'idle'."
          );
          setFlightStep("idle");
        }
      }
    };
    socket.on("flight_log", handleFlightLog);
    return () => {
      socket.off("flight_log", handleFlightLog);
    };
  }, [socket]);

  useEffect(() => {
    console.log("App.jsx: flightLogs state changed:", flightLogs);
  }, [flightLogs]);

  const latestPicture = latestPhotoBase64
    ? `data:image/jpeg;base64,${latestPhotoBase64}`
    : null;

  useEffect(() => {
    if (latestPhotoBase64) {
      console.log("Updating image");
    }
  }, [latestPhotoBase64]);

  useEffect(() => {
    if (!socket) return;

    function handlePhotoUpdate(data) {
      if (Array.isArray(data)) {
        data.forEach((photo) => {
          if (
            typeof photo.index === "number" &&
            photo.photo_base64 &&
            photo.photo_base64.length > 0
          ) {
            setPhotoMap((prev) => ({
              ...prev,
              [photo.index]: photo,
            }));
          }
        });
      } else if (
        data &&
        typeof data === "object" &&
        typeof data.index === "number" &&
        data.photo_base64 &&
        data.photo_base64.length > 0
      ) {
        setPhotoMap((prev) => ({
          ...prev,
          [data.index]: data,
        }));
      }
    }

    socket.on("photo_update", handlePhotoUpdate);
    return () => {
      socket.off("photo_update", handlePhotoUpdate);
    };
  }, [socket]);

  // Fetch missions when showMissions is toggled on
  useEffect(() => {
    if (!showMissions) {
      setSelectedMission(null);
      setMissionData(null);
      setMissionsError(null);
      return;
    }
    setMissionsLoading(true);
    setMissionsError(null);
    emitEvent("get_completed_missions", {})
      .then((res) => {
        setMissions(res.missions || []);
      })
      .catch((err) => {
        setMissionsError(err.message || "Failed to fetch missions");
      })
      .finally(() => setMissionsLoading(false));
  }, [showMissions, emitEvent]);

  // Fetch mission data when a mission is selected
  useEffect(() => {
    if (!selectedMission) {
      setMissionData(null);
      setMissionDataError(null);
      return;
    }
    setMissionDataLoading(true);
    setMissionDataError(null);
    emitEvent("get_completed_mission_data", { mission: selectedMission })
      .then((res) => {
        setMissionData(res);
      })
      .catch((err) => {
        setMissionDataError(err.message || "Failed to fetch mission data");
      })
      .finally(() => setMissionDataLoading(false));
  }, [selectedMission, emitEvent]);

  function removeConsecutiveDuplicates(positions) {
    return positions.filter(
      (point, idx, arr) =>
        idx === 0 ||
        point[0] !== arr[idx - 1][0] ||
        point[1] !== arr[idx - 1][1]
    );
  }

  const handlePolygonCreated = (positions) => {
    setPolygonPositions(positions);
  };

  const handleStartPointSet = (point) => {
    setStartPoint(point);
  };

  const handleStepComplete = () => {
    if (step === "draw-area") {
      setStep("set-start");
    } else if (step === "set-start") {
      setStep("complete");
    }
  };

  const handleClearAll = () => {
    setPolygonPositions([]);
    setStartPoint(null);
    setGridData(null);
    setStep("draw-area");
    setFlightStatus(null);
    setShowFlightStatus(false);
    setFlightLogs([]);
    setFlightStep("idle");
    // Only increase the drone trail reset key to clear the trail but not the drone marker
    setDroneTrailResetKey((prev) => prev + 1);
    // Clear the photo map to remove old photos
    setPhotoMap({});
    if (mapRef.current && typeof mapRef.current.clearAll === "function") {
      // Call clearAll but make sure drone position is preserved
      mapRef.current.clearAll({ preserveDrone: true });
    }
  };

  const handleGenerateGrids = async () => {
    let actualDroneStartPoint =
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number"
        ? [gps.latitude, gps.longitude]
        : null;
    setDroneStartPoint(actualDroneStartPoint);

    if (polygonPositions.length < 3) {
      alert("Please draw a valid area first (minimum 3 points).");
      return;
    }
    if (!actualDroneStartPoint) {
      alert(
        "Could not determine drone's starting position (GPS). Please ensure GPS is valid."
      );
      return;
    }
    const numericAltitude = Number(altitude);
    if (
      isNaN(numericAltitude) ||
      numericAltitude <= 0 ||
      numericAltitude > 40
    ) {
      alert("Altitude must be a number between 1 and 40 meters.");
      setLoading(false);
      return;
    }
    setLoading(true);

    // Create a deep copy of the polygon positions to avoid modifying the original
    // Ensure we're sending a plain array of [lat, lng] pairs
    const cleanedPolygonPositions = removeConsecutiveDuplicates(
      polygonPositions.map((pos) => {
        // Handle different formats of position data
        if (Array.isArray(pos)) {
          return pos;
        } else if (pos && typeof pos === "object") {
          if ("lat" in pos && "lng" in pos) {
            return [pos.lat, pos.lng];
          } else if ("latitude" in pos && "longitude" in pos) {
            return [pos.latitude, pos.longitude];
          }
        }
        return pos;
      })
    );

    console.log("Cleaned Polygon Positions:", cleanedPolygonPositions);

    // Format the start point for the API call
    let formattedStartPoint = null;
    if (startPoint) {
      if (Array.isArray(startPoint)) {
        formattedStartPoint = startPoint;
      } else if (startPoint && typeof startPoint === "object") {
        if ("lat" in startPoint && "lng" in startPoint) {
          formattedStartPoint = [startPoint.lat, startPoint.lng];
        } else if ("latitude" in startPoint && "longitude" in startPoint) {
          formattedStartPoint = [startPoint.latitude, startPoint.longitude];
        }
      }
    }

    try {
      const response = await calculateGrid({
        coordinates: cleanedPolygonPositions,
        altitude: numericAltitude,
        overlap: overlap,
        coverage: coverage,
        start_point: formattedStartPoint,
        drone_start_point: actualDroneStartPoint,
      });

      setGridData(response);
      if (response && response.start_point) setStartPoint(response.start_point);
      if (response && response.drone_start_point)
        setDroneStartPoint(response.drone_start_point);
    } catch (error) {
      console.error("Error generating grid layout:", error.message);
      alert(`Error generating grid layout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFlight = async () => {
    if (
      !gridData ||
      !gridData.waypoints ||
      gridData.waypoints.length < 1 ||
      !gridData.start_point ||
      !gridData.drone_start_point
    ) {
      alert("Please calculate grid coverage first");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to execute this flight plan? The drone will take off and follow the planned path.`
      )
    ) {
      return;
    }

    setFlightStep("in_progress");
    setFlightLogs([]);

    try {
      await executeFlight({
        waypoints: gridData.waypoints,
        start_point: gridData.start_point,
        drone_start_point: gridData.drone_start_point,
        altitude: altitude,
      });
    } catch (error) {
      setFlightStep("idle");
      alert("Flight execution error: " + error.message);
    }
  };

  useEffect(() => {
    if (gridData) {
      if (gridData.start_point) setStartPoint(gridData.start_point);
      if (gridData.drone_start_point)
        setDroneStartPoint(gridData.drone_start_point);
    }
  }, [gridData]);

  const handleConnectDrone = async () => {
    if (droneConnected) {
      setConnectingDrone(true);
      try {
        await disconnectDrone();
      } catch (error) {
        console.error("Error disconnecting from drone:", error.message);
        alert(`Failed to disconnect from drone: ${error.message}`);
      } finally {
        setConnectingDrone(false);
      }
    } else {
      setConnectingDrone(true);
      try {
        await connectDrone();
      } catch (error) {
        console.error("Error connecting to drone:", error.message);
        alert(`Failed to connect to drone: ${error.message}`);
      } finally {
        setConnectingDrone(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    resizeStartPositionRef.current = e.clientY;
    initialHeightRef.current = terminalHeight;

    document.addEventListener("mousemove", handleResizeMouseMove);
    document.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e) => {
    if (resizeStartPositionRef.current === null) return;
    const delta = resizeStartPositionRef.current - e.clientY;
    const newHeight = Math.min(
      Math.max(100, initialHeightRef.current + delta),
      window.innerHeight * 0.8
    );
    setTerminalHeight(newHeight);
  };

  const handleResizeMouseUp = () => {
    resizeStartPositionRef.current = null;
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
  };

  let progress = null;
  let inProgressStatus = null;
  if (flightStep === "in_progress" && flightLogs.length > 0) {
    const moveLogs = flightLogs.filter(
      (log) =>
        log.action &&
        typeof log.action === "string" &&
        log.action.toLowerCase() === "move_to_waypoint"
    );
    if (moveLogs.length > 0 && gridData && gridData.waypoints) {
      progress = {
        current: moveLogs.length,
        total: gridData.waypoints.length,
      };
    }

    const lastLog = [...flightLogs]
      .reverse()
      .find((log) =>
        [
          "start_mission",
          "takeoff",
          "ascend",
          "move_to_start_point",
          "move_to_waypoint",
          "return_to_drone_start_point",
          "land",
          "complete",
          "emergency_abort",
        ].includes(log.action)
      );

    if (lastLog) {
      switch (lastLog.action) {
        case "start_mission":
          inProgressStatus = "Mission is starting";
          break;
        case "takeoff":
          inProgressStatus = "Drone is taking off";
          break;
        case "ascend":
          inProgressStatus = `Drone is ascending to altitude (${
            lastLog.altitude || "?"
          } meters)`;
          break;
        case "move_to_start_point":
          inProgressStatus = "Drone is flying to start point";
          break;
        case "move_to_waypoint":
          if (progress) {
            inProgressStatus = `Flying to waypoint ${progress.current} of ${progress.total}`;
          } else {
            inProgressStatus = "Flying to waypoint";
          }
          break;
        case "return_to_drone_start_point":
          inProgressStatus = "Drone is returning to drone starting position";
          break;
        case "land":
          inProgressStatus = "Drone is landing";
          break;
        case "complete":
          inProgressStatus = "Flight complete!";
          break;
        case "emergency_abort":
          inProgressStatus = "Emergency triggered! Flight aborted.";
          break;
        default:
          inProgressStatus = null;
      }
    }
  }

  const getActiveStep = () => {
    if (flightStep === "in_progress" || flightStep === "complete") return 2;
    if (step === "complete" && flightStep === "idle") return 1;
    return 0;
  };

  // Custom dotted connector
  const DottedStepConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
      top: 12,
      left: "calc(-50% + 16px)",
      right: "calc(50% + 16px)",
    },
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.divider,
      borderTopStyle: "dotted",
      borderTopWidth: 2,
      borderRadius: 1,
      minHeight: 2,
    },
  }));

  // Helper for log icons and labels
  const LOG_ACTIONS = {
    start_mission: {
      icon: <PlayCircleIcon color="primary" />,
      label: "Mission started",
    },
    takeoff: {
      icon: <FlightTakeoffIcon color="primary" />,
      label: "Takeoff",
    },
    ascend: {
      icon: <ArrowUpwardIcon color="primary" />,
      label: "Ascend",
    },
    move_to_start_point: {
      icon: <FlagIcon color="info" />,
      label: "Move to start point",
    },
    move_to_waypoint: {
      icon: <LocationOnIcon color="info" />,
      label: "Move to waypoint",
    },
    rotate_drone: {
      icon: <RotateRightIcon color="secondary" />,
      label: "Rotating drone to take photo",
    },
    rotate_to_next: {
      icon: <RotateRightIcon color="secondary" />,
      label: "Rotate to next heading",
    },
    take_photo: {
      icon: <CameraAltIcon color="success" />,
      label: "Take photo",
    },
    return_to_drone_start_point: {
      icon: <ReplayIcon color="info" />,
      label: "Return to drone starting position",
    },
    land: {
      icon: <FlightLandIcon color="primary" />,
      label: "Land",
    },
    complete: {
      icon: <DoneAllIcon color="success" />,
      label: "Mission complete",
    },
    emergency_abort: {
      icon: <ErrorOutlineIcon color="error" />,
      label: "Emergency abort",
    },
  };

  function formatLogTimestamp(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return (
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) +
      "." +
      String(d.getMilliseconds()).padStart(3, "0")
    );
  }

  function renderLogDetails(log) {
    // Show key-value pairs except action and timestamp
    const keys = Object.keys(log).filter(
      (k) => k !== "action" && k !== "timestamp"
    );
    if (keys.length === 0) return null;
    return (
      <Box sx={{ ml: 4, color: "text.secondary", fontSize: 13 }}>
        {keys.map((k) => (
          <span key={k}>
            <b>{k.replace(/_/g, " ")}:</b>{" "}
            {typeof log[k] === "number" ? log[k].toFixed(4) : String(log[k])}{" "}
          </span>
        ))}
      </Box>
    );
  }

  // MissionImages component for modal image viewing and detection indicator
  function MissionImages({ images }) {
    const [open, setOpen] = useState(false);
    const [modalImg, setModalImg] = useState(null);

    // Only originals
    const originals = images.filter(
      (img) => img.filename && !img.filename.includes("_detected")
    );

    // Sort originals so image 1 is first (by extracting number from filename)
    const sortedOriginals = [...originals].sort((a, b) => {
      // Try to extract a number from the filename, fallback to 0
      const getNum = (img) => {
        // Match _1.jpg or -1.jpg or 1.jpg or 1_ or 1-
        const match = img.filename.match(/(\d+)(?=[^0-9]*\.jpg$)/i);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNum(a) - getNum(b);
    });

    // Helper to find detected image for an original
    const getDetected = (filename) => {
      const detectedName = filename.replace(/\.jpg$/i, "_detected.jpg");
      return images.find((img) => img.filename === detectedName);
    };

    const handleOpen = (img) => {
      const detected = getDetected(img.filename);
      setModalImg(detected || img);
      setOpen(true);
    };

    const handleClose = () => setOpen(false);

    return (
      <>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {sortedOriginals.length > 0 ? (
            sortedOriginals.map((img, idx) => {
              const detected = getDetected(img.filename);
              return (
                <Paper
                  key={img.filename || idx}
                  elevation={1}
                  sx={{
                    p: 1,
                    width: 180,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => handleOpen(img)}
                >
                  {img.base64 ? (
                    <Box
                      component="img"
                      src={`data:image/jpeg;base64,${img.base64}`}
                      alt={img.filename}
                      sx={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 1,
                        mb: 1,
                        boxShadow: 1,
                        bgcolor: "common.black",
                      }}
                    />
                  ) : (
                    <InsertDriveFileIcon
                      color="disabled"
                      sx={{ fontSize: 60, mb: 1 }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      wordBreak: "break-all",
                      textAlign: "center",
                    }}
                  >
                    {img.filename}
                  </Typography>
                  {detected && (
                    <CheckCircleIcon
                      color="success"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: 24,
                        bgcolor: "white",
                        borderRadius: "50%",
                      }}
                      titleAccess="Detection found"
                    />
                  )}
                  {img.error && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {img.error}
                    </Typography>
                  )}
                </Paper>
              );
            })
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No images found for this mission.
            </Typography>
          )}
        </Box>
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 2,
              borderRadius: 2,
              outline: "none",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {modalImg && modalImg.base64 && (
              <img
                src={`data:image/jpeg;base64,${modalImg.base64}`}
                alt={modalImg.filename}
                style={{
                  maxWidth: "80vw",
                  maxHeight: "80vh",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
            )}
            <Typography variant="caption">{modalImg?.filename}</Typography>
          </Box>
        </Modal>
      </>
    );
  }

  // Helper to format mission name as readable date/time
  function formatMissionName(mission) {
    // Try to parse ISO-like string: 2025-05-06T23-15-54.459230
    // Replace '-' in time with ':' for parsing
    const match = mission.match(
      /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})\.(\d+)/
    );
    if (match) {
      const [_, date, h, m, s] = match;
      // Compose a string like "2025-05-06T23:15:54"
      const iso = `${date}T${h}:${m}:${s}`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        return (
          d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }) +
          " " +
          d.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      }
    }
    // fallback: show as is
    return mission;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        elevation={2}
        sx={{ bgcolor: "background.appBar" }} // Use the theme's appBar background color
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
            {/* NEW: Missions Button */}
            <Button
              variant={showMissions ? "contained" : "outlined"}
              color="primary"
              onClick={() => setShowMissions((prev) => !prev)}
              sx={{
                minWidth: 110,
                bgcolor: showMissions
                  ? "primary.main"
                  : "rgba(255,255,255,0.2)",
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
              {showMissions ? "Back" : "Missions"}
            </Button>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: connected ? "success.main" : "error.main",
                  mr: 1,
                  boxShadow: "0 0 4px rgba(255,255,255,0.4)", // Brighter shadow for visibility
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: "white", fontWeight: 500 }}
              >
                {connected ? "Server Connected" : "Server Disconnected"}
              </Typography>
            </Box>
            <Button
              variant={droneConnected ? "contained" : "outlined"}
              color={droneConnected ? "error" : "inherit"}
              onClick={handleConnectDrone}
              disabled={!connected || connectingDrone}
              startIcon={<FlightTakeoffIcon />}
              size="small"
              sx={{
                minWidth: 130,
                bgcolor: droneConnected
                  ? "error.main"
                  : "rgba(255,255,255,0.2)",
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
            {droneConnected && (
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)", // Add text shadow for better visibility
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    display: "inline-block",
                    mr: 0.8,
                    animation: "pulse 1.5s infinite",
                    boxShadow: "0 0 4px rgba(76,175,80,0.7)", // Glow effect
                  }}
                />
                Drone Connected
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      {!showMissions ? (
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: Map Area */}
          <Box
            sx={{
              position: "relative",
              flex: 3,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "relative", height: "100%" }}>
              <MapComponent
                onPolygonCreated={handlePolygonCreated}
                onStartPointSet={handleStartPointSet}
                onStepComplete={handleStepComplete}
                gridData={gridData}
                polygon={polygonPositions}
                startPoint={startPoint}
                droneStartPoint={droneStartPoint}
                currentStep={step}
                ref={mapRef}
                droneGps={gpsSignal ? null : gps}
                connected={connected}
                droneConnected={droneConnected}
                gps={gps}
                gpsSignal={gpsSignal}
                flightStep={flightStep}
                droneTrailResetKey={droneTrailResetKey}
                photoMap={photoMap}
              />
              {gridData && gridData.path_metrics && (
                <Paper
                  elevation={3}
                  sx={{
                    position: "absolute",
                    left: 20,
                    bottom: 20,
                    zIndex: 1000,
                    p: 2.5,
                    maxWidth: 320,
                    minWidth: 220,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Flight plan
                  </Typography>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ "& > p": { my: 0.5 } }}
                  >
                    <p>
                      <strong>Total grids:</strong> {gridData.grid_count}
                    </p>
                    <p>
                      <strong>Altitude:</strong> {altitude} meters
                    </p>
                    <p>
                      <strong>Overlap:</strong> {overlap}%
                    </p>
                    <p>
                      <strong>Minimum coverage:</strong> {coverage}%
                    </p>
                    <p>
                      <strong>Path distance:</strong>{" "}
                      {(gridData.path_metrics.total_distance / 1000).toFixed(2)}{" "}
                      km
                    </p>
                    <p>
                      <strong>Estimated flight time:</strong>{" "}
                      {formatTime(gridData.path_metrics.estimated_flight_time)}
                    </p>
                    {gridData.start_point && (
                      <p>
                        <strong>Search start point:</strong>{" "}
                        {Array.isArray(gridData.start_point)
                          ? gridData.start_point.join(", ")
                          : `${gridData.start_point.lat}, ${gridData.start_point.lon}`}
                      </p>
                    )}
                    {gridData.drone_start_point && (
                      <p>
                        <strong>Drone start/end point:</strong>{" "}
                        {Array.isArray(gridData.drone_start_point)
                          ? gridData.drone_start_point.join(", ")
                          : `${gridData.drone_start_point.lat}, ${gridData.drone_start_point.lon}`}
                      </p>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Drone will always return to its start/end point for
                      landing.
                    </Typography>
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>

          {/* Right: Controls and Info */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minWidth: 350,
              maxWidth: 420,
              height: "100%",
              overflow: "auto",
              p: 3,
              borderRadius: 0,
              borderLeft: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            {/* Stepper */}
            <Box sx={{ mb: 2 }}>
              <Stepper
                activeStep={getActiveStep()}
                alternativeLabel
                connector={<DottedStepConnector />}
              >
                <Step completed={step !== "draw-area"}>
                  <StepLabel>Draw Area</StepLabel>
                </Step>
                <Step completed={gridData !== null}>
                  <StepLabel>Settings</StepLabel>
                </Step>
                <Step completed={flightStep === "complete"}>
                  <StepLabel>Execute Flight</StepLabel>
                </Step>
              </Stepper>
            </Box>

            {/* Controls and Flight Progress */}
            {flightStep === "in_progress" && (
              <Paper
                elevation={1}
                sx={{ p: 3, textAlign: "center", borderRadius: 2 }}
              >
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
            )}

            {flightStep === "complete" && (
              <Paper
                elevation={1}
                sx={{ p: 3, textAlign: "center", borderRadius: 2 }}
              >
                <CheckCircleIcon
                  color="success"
                  sx={{ fontSize: 48, mb: 1.5 }}
                />
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
            )}

            {flightStep === "idle" && step === "complete" && (
              <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Altitude (m)"
                      type="number"
                      value={altitude}
                      onChange={(e) => setAltitude(e.target.value)}
                      InputProps={{ inputProps: { min: 1, max: 40, step: 1 } }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Overlap (%)"
                      type="number"
                      value={overlap}
                      onChange={(e) =>
                        setOverlap(parseInt(e.target.value) || 0)
                      }
                      InputProps={{ inputProps: { min: 0, max: 90 } }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Minimum Coverage (%)"
                      type="number"
                      value={coverage}
                      onChange={(e) =>
                        setCoverage(parseInt(e.target.value) || 0)
                      }
                      InputProps={{ inputProps: { min: 0, max: 90 } }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleGenerateGrids}
                      disabled={loading}
                    >
                      {loading ? "Calculating..." : "Calculate Grid Coverage"}
                    </Button>
                  </Grid>
                  {gridData && (
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={handleExecuteFlight}
                        disabled={flightStep === "in_progress"}
                      >
                        {flightStep === "in_progress"
                          ? "Flight in Progress..."
                          : `Execute Flight Plan`}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Only show Clear All button if NOT in progress AND something is drawn */}
            {flightStep !== "in_progress" && polygonPositions.length > 0 && (
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
            )}

            {/* Latest Picture */}
            {latestPicture && (
              <Paper
                variant="outlined"
                sx={{
                  my: 2,
                  p: 1.5,
                  textAlign: "center",
                  borderColor: latestPhotoDetected
                    ? "success.main"
                    : "error.main",
                  borderWidth: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Latest Picture
                </Typography>
                <Typography variant="caption" display="block" gutterBottom>
                  Detected:{" "}
                  <Box component="span" sx={{ fontWeight: "bold" }}>
                    {latestPhotoDetected ? "Yes" : "No"}
                  </Box>
                </Typography>
                <Box
                  component="img"
                  src={latestPicture}
                  alt="Latest from drone"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 180,
                    borderRadius: 1,
                    boxShadow: 1,
                    objectFit: "contain",
                    bgcolor: "common.black",
                  }}
                />
              </Paper>
            )}

            {/* Drone Status Panel */}
            <Divider sx={{ my: 2 }} />
            <DroneStatusPanel />

            {/* Terminal with logs */}
            {(flightStep === "in_progress" ||
              flightStep === "complete" ||
              flightLogs.length > 0) && (
              <>
                <Divider
                  sx={{
                    my: 2,
                    cursor: "ns-resize",
                    height: "6px",
                    bgcolor: "rgba(0,0,0,0.09)",
                    "&:hover": {
                      bgcolor: theme.palette.primary.main,
                      opacity: 0.7,
                    },
                  }}
                  onMouseDown={handleResizeMouseDown}
                />
                <Box ref={terminalContainerRef} sx={{ height: terminalHeight }}>
                  <TerminalLogs logs={flightLogs} />
                </Box>
              </>
            )}
          </Paper>
        </Box>
      ) : (
        // Missions Folder View
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
            overflow: "auto",
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
              bgcolor: "background.paper",
            }}
          >
            {selectedMission ? (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setSelectedMission(null)}
                sx={{ mr: 2 }}
              >
                Back to Missions
              </Button>
            ) : (
              <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
            )}
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {selectedMission ? selectedMission : "Completed Missions"}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
            {/* Missions List */}
            {!selectedMission && (
              <>
                {missionsLoading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 6 }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                {missionsError && (
                  <Typography color="error" sx={{ mt: 4 }}>
                    {missionsError}
                  </Typography>
                )}
                {!missionsLoading &&
                  !missionsError &&
                  missions.length === 0 && (
                    <Typography color="text.secondary" sx={{ mt: 4 }}>
                      No completed missions found.
                    </Typography>
                  )}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                      md: "1fr 1fr 1fr",
                    },
                    gap: 3,
                  }}
                >
                  {/* Sort missions by date descending (newest first) */}
                  {[...missions]
                    .sort((a, b) => {
                      // Try to parse date from mission name
                      const parse = (name) => {
                        const match = name.match(
                          /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/
                        );
                        if (match) {
                          // Compose ISO string
                          return new Date(
                            `${match[1]}T${match[2]}:${match[3]}:${match[4]}`
                          ).getTime();
                        }
                        return 0;
                      };
                      return parse(b) - parse(a);
                    })
                    .map((mission) => (
                      <Paper
                        key={mission}
                        elevation={2}
                        sx={{
                          p: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          cursor: "pointer",
                          transition: "box-shadow 0.2s, border 0.2s",
                          border: "2px solid transparent",
                          "&:hover": {
                            boxShadow: 6,
                            borderColor: "primary.main",
                          },
                        }}
                        onClick={() => setSelectedMission(mission)}
                      >
                        <FolderIcon
                          sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 500,
                            textAlign: "center",
                            wordBreak: "break-all",
                          }}
                        >
                          {formatMissionName(mission)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            wordBreak: "break-all",
                            textAlign: "center",
                          }}
                        >
                          {mission}
                        </Typography>
                      </Paper>
                    ))}
                </Box>
              </>
            )}

            {/* Mission Data View */}
            {selectedMission && (
              <>
                {missionDataLoading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 6 }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                {missionDataError && (
                  <Typography color="error" sx={{ mt: 4 }}>
                    {missionDataError}
                  </Typography>
                )}
                {missionData && (
                  <Grid container spacing={4}>
                    {/* Images */}
                    <Grid item xs={12} md={7}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          bgcolor: "background.paper",
                        }}
                      >
                        <ImageIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Images ({missionData.images?.length || 0})
                        </Typography>
                      </Paper>
                      {/* Use MissionImages component here */}
                      <MissionImages images={missionData.images || []} />
                    </Grid>
                    {/* Log */}
                    <Grid item xs={12} md={5}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          bgcolor: "background.paper",
                        }}
                      >
                        <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Flight Log
                        </Typography>
                      </Paper>
                      <Box
                        sx={{
                          maxHeight: 400,
                          overflow: "auto",
                          bgcolor: "grey.100",
                          borderRadius: 2,
                          p: 2,
                          fontFamily: "monospace",
                          fontSize: 14,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {Array.isArray(missionData.log) &&
                        missionData.log.length > 0 ? (
                          <Box
                            component="ul"
                            sx={{ listStyle: "none", pl: 0, m: 0 }}
                          >
                            {missionData.log.map((log, idx) => {
                              const action = log.action?.toLowerCase();
                              const meta = LOG_ACTIONS[action] || {
                                icon: <InsertDriveFileIcon color="disabled" />,
                                label: action,
                              };
                              return (
                                <Box
                                  component="li"
                                  key={idx}
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    mb: 1.5,
                                    gap: 1.5,
                                  }}
                                >
                                  <Box sx={{ mt: "2px" }}>{meta.icon}</Box>
                                  <Box>
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontWeight: 500,
                                        color: "text.primary",
                                        fontSize: 15,
                                        mr: 1,
                                      }}
                                    >
                                      {meta.label}
                                    </Typography>
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: "text.secondary",
                                        fontSize: 13,
                                        ml: 1,
                                      }}
                                    >
                                      {formatLogTimestamp(log.timestamp)}
                                    </Typography>
                                    {renderLogDetails(log)}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        ) : (
                          <Typography color="text.secondary">
                            No log data found.
                          </Typography>
                        )}
                      </Box>
                      {/* Mission Map below the logs */}
                      {missionData.mission && (
                        <Box sx={{ mt: 3 }}>
                          <MissionMap
                            waypoints={missionData.mission.waypoints}
                            startPoint={missionData.mission.start_point}
                            droneStartPoint={
                              missionData.mission.drone_start_point
                            }
                          />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default App;
