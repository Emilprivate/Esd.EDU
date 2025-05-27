import { useState, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import MapComponent from "./components/MapComponent";
import { useSocket } from "./context/SocketContext";
import MissionsFolder from "./components/missions/MissionsFolder";
import SelectedMission from "./components/missions/SelectedMission";
import ControlsAndInfo from "./components/ControlsAndInfo/ControlsAndInfo";
import Header from "./components/Header";
import FlightOverview from "./components/ControlsAndInfo/FlightOverview";

// MUI imports
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  useTheme,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import StepConnector, {
  stepConnectorClasses,
} from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import FlagIcon from "@mui/icons-material/Flag";
import ReplayIcon from "@mui/icons-material/Replay";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formatMissionName } from "./components/missions/MissionsFolder";

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
  const [step, setStep] = useState("draw-area"); // draw-area | set-start | settings | flight-overview
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

  // Track if we should zoom to drone after missions tab
  const shouldZoomToDroneRef = useRef(false);

  // Store the last valid drone position to restore after missions tab
  const lastDronePositionRef = useRef(null);

  // Update last valid drone position when GPS is valid
  useEffect(() => {
    if (
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number" &&
      !(gps.latitude === 0 && gps.longitude === 0)
    ) {
      lastDronePositionRef.current = [gps.latitude, gps.longitude];
    }
  }, [gps]);

  // When entering Missions tab, set flag to zoom to drone on return
  useEffect(() => {
    if (showMissions) {
      shouldZoomToDroneRef.current = true;
    }
  }, [showMissions]);

  // When leaving Missions tab, restore map and zoom to drone
  useEffect(() => {
    if (!showMissions && shouldZoomToDroneRef.current) {
      setTimeout(() => {
        if (
          mapRef.current &&
          typeof mapRef.current.zoomToDrone === "function"
        ) {
          // Use last known drone position if available
          const pos = lastDronePositionRef.current;
          if (pos && typeof pos[0] === "number" && typeof pos[1] === "number") {
            mapRef.current.zoomToDrone(pos);
          }
        }
      }, 100);
      shouldZoomToDroneRef.current = false;
    }
  }, [showMissions]);

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
      setStep("settings");
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
      setStep("flight-overview"); // Go to FlightOverview after calculation
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
    if (flightStep === "in_progress" || flightStep === "complete") return 3;
    if (step === "flight-overview") return 2;
    if (step === "settings") return 1;
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
      <Header
        showMissions={showMissions}
        setShowMissions={setShowMissions}
        connected={connected}
        droneConnected={droneConnected}
        handleConnectDrone={handleConnectDrone}
        connectingDrone={connectingDrone}
      />

      {/* Main content */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Map Area (always rendered, just hidden when in Missions tab) */}
        <Box
          sx={{
            position: "relative",
            flex: 3,
            height: "100%",
            overflow: "hidden",
            display: showMissions ? "none" : "block",
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
          </Box>
        </Box>

        {/* Right: Controls and Info or Missions */}
        {showMissions ? (
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
                  sx={{ mr: 2, minWidth: 0, px: 1 }}
                  color="inherit"
                >
                  Back
                </Button>
              ) : (
                <InfoOutlinedIcon color="primary" sx={{ mr: 1 }} />
              )}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {selectedMission
                  ? `Mission overview: ${formatMissionName(selectedMission)}`
                  : "Completed Missions"}
              </Typography>
            </Box>
            {selectedMission ? (
              <SelectedMission
                selectedMission={selectedMission}
                setSelectedMission={setSelectedMission}
                missionData={missionData}
                missionDataLoading={missionDataLoading}
                missionDataError={missionDataError}
                LOG_ACTIONS={LOG_ACTIONS}
              />
            ) : (
              <MissionsFolder
                missions={missions}
                missionsLoading={missionsLoading}
                missionsError={missionsError}
                setSelectedMission={setSelectedMission}
              />
            )}
          </Box>
        ) : (
          <ControlsAndInfo
            step={step}
            getActiveStep={getActiveStep}
            gridData={gridData}
            flightStep={flightStep}
            inProgressStatus={inProgressStatus}
            progress={progress}
            handleClearAll={handleClearAll}
            altitude={altitude}
            setAltitude={setAltitude}
            overlap={overlap}
            setOverlap={setOverlap}
            coverage={coverage}
            setCoverage={setCoverage}
            handleGenerateGrids={handleGenerateGrids}
            loading={loading}
            handleExecuteFlight={handleExecuteFlight}
            polygonPositions={polygonPositions}
            droneConnected={droneConnected}
            latestPicture={latestPicture}
            latestPhotoDetected={latestPhotoDetected}
            flightLogs={flightLogs}
            handleResizeMouseDown={handleResizeMouseDown}
            terminalContainerRef={terminalContainerRef}
            terminalHeight={terminalHeight}
            // Add new props for FlightOverview navigation
            setStep={setStep}
            formatTime={formatTime}
          />
        )}
      </Box>
    </Box>
  );
}

export default App;
