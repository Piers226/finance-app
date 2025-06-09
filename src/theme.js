// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "rgb(102, 148, 160)",
      light: "rgb(203, 236, 245)"

    },
    secondary: {
      main: "rgb(181, 155, 130)",
      dark: "rgb(117, 85, 55)", // Darker shade for hover effects
    },
    success: {
      main: "rgb(15, 157, 88)",
    },
    warning: {
      main: "rgb(244, 180, 0)",
    },
    error: {
      main: "rgb(219, 68, 55)",
    },
    background: {
      default: "rgb(223, 223, 223)",
      paper: "rgb(181, 155, 130)",
    },
    custom: {
      lightbeige: "rgb(245, 223, 203)",
      darkNavy: "rgb(23, 64, 75)",
      logout: "rgb(204, 99, 89)",
    },
  },
});

export default theme;