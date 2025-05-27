import React from "react";
import {
  Paper,
  Grid,
  TextField,
  Button,
  InputAdornment,
  Tooltip,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function ControlsSettings({
  flightStep,
  step,
  altitude,
  setAltitude,
  overlap,
  setOverlap,
  coverage,
  setCoverage,
  handleGenerateGrids,
  loading,
  gridData,
}) {
  if (flightStep === "idle" && step === "settings") {
    return (
      <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Altitude (m)"
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              InputProps={{
                inputProps: { min: 1, max: 40, step: 1 },
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="The flight altitude for the drone in meters. Higher altitude covers more area quicker but with less detail in the pictures.">
                      <IconButton tabIndex={-1} size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Overlap (%)"
              type="number"
              value={overlap === 0 ? "" : overlap}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setOverlap("");
                } else {
                  setOverlap(Number(val));
                }
              }}
              onBlur={(e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 90) val = 90;
                setOverlap(val);
              }}
              InputProps={{
                inputProps: { min: 0, max: 90 },
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="How much each grid cell overlaps with its neighbors. Higher overlap increases redundancy and detection reliability.">
                      <IconButton tabIndex={-1} size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Grid Inclusion Threshold (%)"
              type="number"
              value={coverage === 0 ? "" : coverage}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setCoverage("");
                } else {
                  setCoverage(Number(val));
                }
              }}
              onBlur={(e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 90) val = 90;
                setCoverage(val);
              }}
              InputProps={{
                inputProps: { min: 0, max: 90 },
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="The minimum percentage of a grid cell that must be inside the search area to be included in the plan.">
                      <IconButton tabIndex={-1} size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
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
              {loading
                ? "Calculating..."
                : gridData
                ? "Recalculate Grid Coverage"
                : "Calculate Grid Coverage"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  }
  return null;
}
