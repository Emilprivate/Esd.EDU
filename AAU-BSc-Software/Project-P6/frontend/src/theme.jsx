import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50", // Green as your primary color
      light: "#80e27e",
      dark: "#087f23",
      contrastText: "#fff",
    },
    secondary: {
      main: "#2196f3", // Blue as secondary color
      light: "#6ec6ff",
      dark: "#0069c0",
      contrastText: "#fff",
    },
    error: {
      main: "#f44336",
    },
    warning: {
      main: "#ff9800",
    },
    info: {
      main: "#2196f3",
    },
    success: {
      main: "#4caf50",
    },
    background: {
      default: "#f5f6fa",
      paper: "#ffffff",
      appBar: "#2E3B55", // Added this for the app bar
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 500,
    },
    h4: {
      fontSize: "1.2rem",
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none", // Prevents ALL CAPS in buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Prevents ALL CAPS in buttons
          borderRadius: 4,
        },
        containedPrimary: {
          boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
        },
        containedSecondary: {
          boxShadow: "0 2px 4px rgba(33, 150, 243, 0.3)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
          borderRadius: 0, // Remove rounded borders from AppBar
          backgroundColor: "#2E3B55", // Darker blue color for better contrast
        },
      },
    },
  },
});

export default theme;
