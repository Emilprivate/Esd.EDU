import { ThemeProvider, CssBaseline, Box, Grid } from "@mui/material";
import { SocketProvider } from "./context/socket-context";
import theme from "./theme/theme";
import TopBar from "./components/top-bar/top-bar";
import MissionSection from "./components/mission-section/mission-section";
import CameraFeed from "./components/camera-feed/camera-feed";
import ControlPanel from "./components/control-panel/control-panel";
import DroneStatus from "./components/drone-status/drone-status";
import ProjectInfo from "./components/project-info/project-info";
import Terminal from "./components/terminal/terminal";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <TopBar />

          <Box sx={{ flexGrow: 1, overflow: "hidden", p: 1 }}>
            <Grid container spacing={1} sx={{ height: "100%" }}>
              {/* Left Column - 60% width */}
              <Grid item xs={12} md={7} sx={{ height: "100%" }}>
                <Grid container spacing={1} sx={{ height: "100%" }}>
                  {/* Map takes 70% height */}
                  <Grid item xs={12} sx={{ height: "70%" }}>
                    <MissionSection />
                  </Grid>
                  {/* Terminal takes 30% height */}
                  <Grid item xs={12} sx={{ height: "30%" }}>
                    <Terminal />
                  </Grid>
                </Grid>
              </Grid>

              {/* Right Column - 40% width */}
              <Grid item xs={12} md={5} sx={{ height: "100%" }}>
                <Grid container spacing={1} sx={{ height: "100%" }}>
                  {/* Camera Feed - 50% height */}
                  <Grid item xs={12} sx={{ height: "50%" }}>
                    <CameraFeed />
                  </Grid>
                  {/* Bottom Right Section - 50% height */}
                  <Grid item xs={12} sx={{ height: "50%" }}>
                    <Grid container spacing={1} sx={{ height: "100%" }}>
                      {/* Control Panel - Left side */}
                      <Grid item xs={12} sm={6} sx={{ height: "100%" }}>
                        <ControlPanel />
                      </Grid>
                      {/* Status Panels - Right side */}
                      <Grid item xs={12} sm={6} sx={{ height: "100%" }}>
                        <Grid container spacing={1} sx={{ height: "100%" }}>
                          <Grid item xs={12} sx={{ height: "65%" }}>
                            <DroneStatus />
                          </Grid>
                          <Grid item xs={12} sx={{ height: "35%" }}>
                            <ProjectInfo />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
