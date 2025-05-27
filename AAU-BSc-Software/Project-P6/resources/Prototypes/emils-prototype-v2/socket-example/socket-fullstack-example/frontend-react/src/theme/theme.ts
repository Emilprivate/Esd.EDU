import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4dabf5", // Brighter blue
    },
    secondary: {
      main: "#1dd1a1", // Vibrant teal
    },
    error: {
      main: "#ff6b6b", // Vivid red
    },
    warning: {
      main: "#feca57", // Bright yellow
    },
    info: {
      main: "#54a0ff", // Bright blue
    },
    background: {
      default: "#121212", // Very dark gray
      paper: "#1a1a1a", // Dark gray for cards
    },
    text: {
      primary: "#f5f5f5",
      secondary: "#b3b3b3",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 4,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0d1117",
          backgroundImage: "linear-gradient(to right, #0d1117, #161b22)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
          borderRadius: 8,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.05)",
        },
      },
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
});

export default theme;
