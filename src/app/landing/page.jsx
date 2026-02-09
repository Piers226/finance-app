"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { signIn } from "next-auth/react";
import GoogleIcon from "@mui/icons-material/Google";
import Image from "next/image";

function SectionPaper({ children, sx }) {
  return (
    <Paper elevation={1} sx={{ p: 3, width: "100%", maxWidth: 720, ...sx }}>
      {children}
    </Paper>
  );
}

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", py: 8 }}>
      <Container
        maxWidth="lg"
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        {/* Hero */}
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6} sx={{ textAlign: "center" }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              M3 Finance
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, color: "text.secondary" }}>
              Connect your accounts, categorize transactions, and get actionable
              insights. All in one place.
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                maxWidth: 420,
                justifyContent: "center",
                mx: "auto",
              }}
            >
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={() => signIn("google")}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Sign in with Google
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }} />

        {/* How it works */}
        <Grid container spacing={4} justifyContent="center">
          <Grid
            item
            xs={12}
            md={8}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <SectionPaper>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                How it works
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    1. Setup Your Budget
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Create the budget categories that matter to you, set your
                    limits, and let M3 track your spending against them.
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    2. Connect Your Bank
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Automatically upload your transactions securely through
                    Plaid. M3 will categorize them and keep everything up to
                    date without you lifting a finger.
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    3. Act
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Track budgets, manage paybacks, and get suggestions powered
                    by OpenAI.
                  </Typography>
                </Grid>
              </Grid>
            </SectionPaper>
          </Grid>

          {/* Features */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <SectionPaper>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Features
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Automatic categorization"
                    secondary="Smart rules and manual overrides"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Shared paybacks"
                    secondary="Easily settle debts with friends"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Budget tracking"
                    secondary="Visualize spending vs goals"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Private & secure"
                    secondary="We store minimal data and use secure providers"
                  />
                </ListItem>
              </List>
            </SectionPaper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }} />

        {/* APIs overview */}
        <Grid container spacing={4} justifyContent="center">
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <SectionPaper>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                APIs & Tech
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Plaid
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                Used to securely connect bank accounts and fetch transactions.
                Tokens are stored server-side and exchanged safely.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                MongoDB
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 1 }}
              >
                Persistent storage for users, transactions, budgets, and payback
                records. The backend uses a lightweight schema designed for fast
                queries.
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                OpenAI
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Used for classification assistance and generating helpful
                suggestions. Requests are made from the server; only minimal,
                necessary data is sent.
              </Typography>
            </SectionPaper>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <SectionPaper>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Quick overview
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Money3 integrates secure financial connections (Plaid), stores
                data in MongoDB for fast retrieval, and enriches transaction
                categorization with OpenAI. The API routes in the app handle
                auth, transactions, paybacks, and webhook events.
              </Typography>
            </SectionPaper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }} />

        {/* Footer */}
        <Box sx={{ textAlign: "center", color: "text.secondary", py: 4 }}>
          <Typography variant="body2">
            Built with Plaid, MongoDB, and OpenAI • © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
