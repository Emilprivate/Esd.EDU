import React from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import { styled } from "@mui/system";
import { Sensors } from "@mui/icons-material";

const ProjectInfoContainer = styled(Box)({
  overflow: "auto",
  flex: 1,
  display: "flex",
  flexDirection: "column",
});

const IconBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 8,
});

const FeatureChip = styled(Box)(({ theme }) => ({
  padding: "2px 8px",
  borderRadius: 12,
  backgroundColor: "rgba(77, 171, 245, 0.1)",
  color: theme.palette.info.main,
  fontSize: "0.7rem",
  margin: "0 4px 4px 0",
  display: "inline-block",
  border: "1px solid rgba(77, 171, 245, 0.2)",
}));

const ProjectInfo: React.FC = () => {
  return (
    <Paper
      elevation={3}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ p: 1, backgroundColor: "background.paper" }}>
        <Typography variant="subtitle2">P6-SCAN</Typography>
      </Box>

      <ProjectInfoContainer>
        <Box sx={{ p: 1.5, display: "flex", alignItems: "center" }}>
          <IconBox>
            <Sensors sx={{ fontSize: 32, color: "primary.main" }} />
          </IconBox>
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
              Self-Controlled Aerial Navigation
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Bachelor's Project
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mx: 1.5, opacity: 0.5 }} />

        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            An autonomous navigation system for drones with interactive mission
            planning and automated flight path optimization.
          </Typography>

          <Typography
            variant="caption"
            sx={{ fontWeight: 500, display: "block", mb: 0.5 }}
          >
            System Components:
          </Typography>
          <FeatureChip>Backend Server</FeatureChip>
          <FeatureChip>Frontend Interface</FeatureChip>
          <FeatureChip>Autonomous Drone</FeatureChip>

          <Typography
            variant="caption"
            sx={{ fontWeight: 500, display: "block", mb: 0.5, mt: 1 }}
          >
            Key Features:
          </Typography>
          <FeatureChip>Interactive Map Planning</FeatureChip>
          <FeatureChip>Path Optimization</FeatureChip>
          <FeatureChip>Autonomous Navigation</FeatureChip>
          <FeatureChip>Real-time Data Visualization</FeatureChip>
        </Box>
      </ProjectInfoContainer>
    </Paper>
  );
};

export default ProjectInfo;
