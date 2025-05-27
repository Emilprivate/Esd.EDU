import React from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Grid,
  Modal,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MissionMap from "./MissionMap";

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

function MissionImages({ images }) {
  const [open, setOpen] = React.useState(false);
  const [modalIdx, setModalIdx] = React.useState(null);

  // Only originals (not _detected)
  const originals = images.filter(
    (img) => img.filename && !img.filename.includes("_detected")
  );
  // Sort originals by number in filename
  const sortedOriginals = [...originals].sort((a, b) => {
    const getNum = (img) => {
      const match = img.filename.match(/(\d+)(?=[^0-9]*\.jpg$)/i);
      return match ? parseInt(match[1], 10) : 0;
    };
    return getNum(a) - getNum(b);
  });
  // Find detected version for a filename
  const getDetected = (filename) => {
    const detectedName = filename.replace(/\.jpg$/i, "_detected.jpg");
    return images.find((img) => img.filename === detectedName);
  };

  // Open modal for image at idx
  const handleOpen = (idx) => {
    setModalIdx(idx);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // Modal navigation
  const handlePrev = () => setModalIdx((idx) => (idx > 0 ? idx - 1 : idx));
  const handleNext = () =>
    setModalIdx((idx) => (idx < sortedOriginals.length - 1 ? idx + 1 : idx));

  // Current image in modal (show detected if exists)
  const modalOriginal = modalIdx !== null ? sortedOriginals[modalIdx] : null;
  const modalImg =
    modalOriginal &&
    modalOriginal.filename &&
    getDetected(modalOriginal.filename)
      ? getDetected(modalOriginal.filename)
      : modalOriginal;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(5, 1fr)",
          },
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        {sortedOriginals.length > 0 ? (
          sortedOriginals.map((img, idx) => {
            const detected = getDetected(img.filename);
            return (
              <Paper
                key={img.filename || idx}
                elevation={1}
                sx={{
                  p: 1,
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  cursor: "pointer",
                  position: "relative",
                  boxSizing: "border-box",
                  border: detected
                    ? "3px solid #e53935"
                    : "1px solid transparent",
                  transition: "border 0.2s",
                }}
                onClick={() => handleOpen(idx)}
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
                      border: detected
                        ? "2px solid #e53935"
                        : "1px solid #e0e0e0",
                      boxSizing: "border-box",
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
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      bgcolor: "#e53935",
                      color: "white",
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      fontSize: 12,
                      fontWeight: 600,
                      zIndex: 2,
                      boxShadow: 1,
                      letterSpacing: 0.5,
                    }}
                  >
                    Detected
                  </Box>
                )}
                {img.error && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
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
            minWidth: 320,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Left arrow */}
            <Button
              onClick={handlePrev}
              disabled={modalIdx === 0}
              sx={{
                minWidth: 0,
                px: 1,
                visibility: modalIdx === 0 ? "hidden" : "visible",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700 }}>&#8592;</span>
            </Button>
            <Box
              sx={{
                flex: 1,
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
                    border:
                      modalOriginal &&
                      modalOriginal.filename &&
                      getDetected(modalOriginal.filename)
                        ? "4px solid #e53935"
                        : "1px solid #e0e0e0",
                    boxSizing: "border-box",
                  }}
                />
              )}
              <Typography variant="caption">{modalImg?.filename}</Typography>
              {modalOriginal &&
                modalOriginal.filename &&
                getDetected(modalOriginal.filename) && (
                  <Box
                    sx={{
                      mt: 1,
                      bgcolor: "#e53935",
                      color: "white",
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: 0.5,
                    }}
                  >
                    Detected version shown
                  </Box>
                )}
            </Box>
            {/* Right arrow */}
            <Button
              onClick={handleNext}
              disabled={modalIdx === sortedOriginals.length - 1}
              sx={{
                minWidth: 0,
                px: 1,
                visibility:
                  modalIdx === sortedOriginals.length - 1
                    ? "hidden"
                    : "visible",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700 }}>&#8594;</span>
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default function SelectedMission({
  missionData,
  missionDataLoading,
  missionDataError,
  LOG_ACTIONS,
}) {
  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 0 }}>
      <Box sx={{ flex: 1, overflow: "auto", p: { xs: 1, sm: 2 } }}>
        {missionDataLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
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
                  <Box component="ul" sx={{ listStyle: "none", pl: 0, m: 0 }}>
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
                            {/* Show key-value pairs except action and timestamp */}
                            <Box
                              sx={{
                                ml: 4,
                                color: "text.secondary",
                                fontSize: 13,
                              }}
                            >
                              {Object.keys(log)
                                .filter(
                                  (k) => k !== "action" && k !== "timestamp"
                                )
                                .map((k) => (
                                  <span key={k}>
                                    <b>{k.replace(/_/g, " ")}:</b>{" "}
                                    {typeof log[k] === "number"
                                      ? log[k].toFixed(4)
                                      : String(log[k])}{" "}
                                  </span>
                                ))}
                            </Box>
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
                    droneStartPoint={missionData.mission.drone_start_point}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
