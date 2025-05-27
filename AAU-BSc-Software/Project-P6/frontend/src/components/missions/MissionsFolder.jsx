import React from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export function formatMissionName(mission) {
  const match = mission.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})\.(\d+)/
  );
  if (match) {
    const [_, date, h, m, s] = match;
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
  return mission;
}

export default function MissionsFolder({
  missions,
  missionsLoading,
  missionsError,
  setSelectedMission,
}) {
  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
      {/* Missions List */}
      <>
        {missionsLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {missionsError && (
          <Typography color="error" sx={{ mt: 4 }}>
            {missionsError}
          </Typography>
        )}
        {!missionsLoading && !missionsError && missions.length === 0 && (
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
              md: "1fr 1fr 1fr 1fr 1fr", // 5 per line on desktop
            },
            gap: 3,
          }}
        >
          {[...missions]
            .sort((a, b) => {
              const parse = (name) => {
                const match = name.match(
                  /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/
                );
                if (match) {
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
    </Box>
  );
}
