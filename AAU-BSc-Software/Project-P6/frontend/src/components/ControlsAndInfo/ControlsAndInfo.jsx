import React from "react";
import { Box, Paper, Stepper, Step, StepLabel, Divider } from "@mui/material";
import StepConnector, {
  stepConnectorClasses,
} from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import ControlsFlightProgress from "./ControlsFlightProgress";
import ControlsSettings from "./ControlsSettings";
import ControlsClearButton from "./ControlsClearButton";
import ControlsLatestPicture from "./ControlsLatestPicture";
import DroneStatusPanel from "../DroneStatusPanel";
import TerminalLogsSection from "./TerminalLogsSection";
import FlightOverview from "./FlightOverview";

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

export default function ControlsAndInfo(props) {
  const {
    step,
    getActiveStep,
    gridData,
    flightStep,
    inProgressStatus,
    progress,
    handleClearAll,
    altitude,
    setAltitude,
    overlap,
    setOverlap,
    coverage,
    setCoverage,
    handleGenerateGrids,
    loading,
    handleExecuteFlight,
    polygonPositions,
    droneConnected,
    latestPicture,
    latestPhotoDetected,
    flightLogs,
    handleResizeMouseDown,
    terminalContainerRef,
    terminalHeight,
    setStep,
    formatTime,
  } = props;

  return (
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
          <Step completed={step !== "draw-area" && step !== "set-start"}>
            <StepLabel>Settings</StepLabel>
          </Step>
          <Step completed={step === "flight-overview" || flightStep !== "idle"}>
            <StepLabel>Flight plan</StepLabel>
          </Step>
          <Step completed={flightStep === "complete"}>
            <StepLabel>Executing</StepLabel>
          </Step>
        </Stepper>
      </Box>

      {/* FlightOverview */}
      {step === "flight-overview" &&
        gridData &&
        gridData.path_metrics &&
        flightStep === "idle" && (
          <FlightOverview
            gridData={gridData}
            altitude={altitude}
            overlap={overlap}
            coverage={coverage}
            handleExecuteFlight={handleExecuteFlight}
            flightStep={flightStep}
            setStep={setStep}
            formatTime={formatTime}
          />
        )}

      {/* Controls and Flight Progress */}
      <ControlsFlightProgress
        flightStep={flightStep}
        inProgressStatus={inProgressStatus}
        progress={progress}
        handleClearAll={handleClearAll}
      />

      <ControlsSettings
        flightStep={flightStep}
        step={step}
        altitude={altitude}
        setAltitude={setAltitude}
        overlap={overlap}
        setOverlap={setOverlap}
        coverage={coverage}
        setCoverage={setCoverage}
        handleGenerateGrids={handleGenerateGrids}
        loading={loading}
        gridData={gridData}
      />

      <ControlsClearButton
        flightStep={flightStep}
        polygonPositions={polygonPositions}
        handleClearAll={handleClearAll}
        droneConnected={droneConnected}
      />

      <ControlsLatestPicture
        latestPicture={latestPicture}
        latestPhotoDetected={latestPhotoDetected}
      />

      <Divider sx={{ my: 2 }} />
      <DroneStatusPanel />

      <TerminalLogsSection
        flightStep={flightStep}
        flightLogs={flightLogs}
        handleResizeMouseDown={handleResizeMouseDown}
        terminalContainerRef={terminalContainerRef}
        terminalHeight={terminalHeight}
      />
    </Paper>
  );
}
