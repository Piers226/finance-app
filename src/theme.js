// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#000000",
      light: "#ffffff",
    },
    secondary: {
      main: "#000000",
      dark: "#333333",
    },
    success: {
      main: "#34C759", // iOS success green
    },
    warning: {
      main: "#FF9F0A", // iOS warning orange
    },
    error: {
      main: "#FF3B30", // iOS error red
    },
    background: {
      default: "#F2F2F7", // iOS light gray background
      paper: "#FFFFFF",
    },
    text: {
      primary: "#000000",
      secondary: "#6e6e73", // Apple's secondary text color
    },
    custom: {
      lightGray: "#F5F5F7",
      mediumGray: "#86868B",
      darkGray: "#1D1D1F",
      buttonHover: "#2D2D2D",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          padding: "8px 16px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

export default theme;
