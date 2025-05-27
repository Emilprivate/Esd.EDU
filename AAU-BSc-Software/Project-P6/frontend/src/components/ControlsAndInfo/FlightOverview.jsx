import React from "react";
import { Paper, Typography, Button, Grid, Box, Divider } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

export default function FlightOverview({
  gridData,
  altitude,
  overlap,
  coverage,
  handleExecuteFlight,
  flightStep,
  setStep,
  formatTime,
}) {
  const { path_metrics = {}, grid_count, metadata = {} } = gridData || {};

  // Prefer metadata for area values
  const polygon_area = metadata.polygon_area;
  const not_searched_area = metadata.not_searched_area;
  const extra_area = metadata.extra_area;
  const start_point = metadata.start_point;

  // Custom start point: Yes if start_point is set and not null, else No
  const customStartPoint =
    start_point !== null && start_point !== undefined ? "Yes" : "No";

  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Flight plan overview
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setStep("settings")}
          size="small"
          variant="outlined"
          color="primary"
          sx={{ ml: 2, fontWeight: 500 }}
        >
          Go back
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={1}>
        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Total grids:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">{grid_count}</Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Altitude:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">{altitude} meters</Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Overlap:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">{overlap}%</Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Grid Inclusion Threshold:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">{coverage}%</Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Path distance:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">
            {path_metrics.total_distance
              ? (path_metrics.total_distance / 1000).toFixed(2) + " km"
              : "-"}
          </Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Estimated flight time:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">
            {path_metrics.estimated_flight_time
              ? formatTime(path_metrics.estimated_flight_time)
              : "-"}
          </Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Area covered:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">
            {polygon_area ? polygon_area.toFixed(1) + " m²" : "-"}
          </Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Area missed:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">
            {not_searched_area ? not_searched_area.toFixed(1) + " m²" : "-"}
          </Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Extra area covered:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">
            {extra_area ? extra_area.toFixed(1) + " m²" : "-"}
          </Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography variant="body2">
            <strong>Custom start point set:</strong>
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="body2">{customStartPoint}</Typography>
        </Grid>
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 2 }}
      >
        Drone will always return to its start/end point for landing.
      </Typography>
      <Typography
        variant="caption"
        color="red"
        sx={{ display: "block", mb: 2 }}
      >
        Please ensure the drone is in a safe area for takeoff and landing and be
        aware of your surroundings as the drone has no obstacle avoidance!
      </Typography>
      <Button
        fullWidth
        variant="contained"
        color="secondary"
        startIcon={<FlightTakeoffIcon />}
        onClick={handleExecuteFlight}
        disabled={flightStep === "in_progress"}
        sx={{ mt: 1 }}
      >
        {flightStep === "in_progress"
          ? "Flight in Progress..."
          : "Execute Flight Plan"}
      </Button>
    </Paper>
  );
}
