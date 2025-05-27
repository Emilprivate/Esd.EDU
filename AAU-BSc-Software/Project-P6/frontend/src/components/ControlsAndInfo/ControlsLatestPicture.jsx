import React from "react";
import { Paper, Typography, Box } from "@mui/material";

export default function ControlsLatestPicture({
  latestPicture,
  latestPhotoDetected,
}) {
  if (!latestPicture) return null;
  return (
    <Paper
      variant="outlined"
      sx={{
        my: 2,
        p: 1.5,
        textAlign: "center",
        borderColor: latestPhotoDetected ? "success.main" : "error.main",
        borderWidth: 2,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
  );
}
