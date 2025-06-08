"use client";

import { Box, Typography } from "@mui/material";
import { signIn } from "next-auth/react";
import GoogleButton from "react-google-button";

export default function LandingPage() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f0f2f5",
      }}
    >
      <Box
        sx={{
          width: 360,
          p: 4,
          bgcolor: "white",
          border: "1px solid #ddd",
          borderRadius: 2,
          textAlign: "center",
          boxShadow: 1,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            bgcolor: "#f5f5f5",
            borderRadius: "50%",
            mx: "auto",
            mb: 2,
          }}
        />
        <Typography variant="h5" component="h1" gutterBottom>
          My App Title
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <GoogleButton onClick={() => signIn("google")} />
        </Box>
      </Box>
    </Box>
  );
}