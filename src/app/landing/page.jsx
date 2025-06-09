"use client";

import { Box, Typography, Button } from "@mui/material";
import { signIn } from "next-auth/react";
import GoogleIcon from "@mui/icons-material/Google";
import Image from "next/image";

export default function LandingPage() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "custom.darkNavy", // Use the custom dark navy color
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
        <Image
          src="/app_icon.png"  // Put your image in the public folder
          alt="App Logo"
          width={80}
          height={80}
          style={{
            margin: 'auto',
            marginBottom: 16,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
        <Typography variant="h5" component="h1" gutterBottom>
           Money<sup>3</sup>
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={() => signIn("google")}
            sx={{
              backgroundColor: "secondary.main",
              color: "#fff",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "secondary.dark",
              },
            }}
          >
            Sign in with Google
          </Button>
        </Box>
      </Box>
    </Box>
  );
}