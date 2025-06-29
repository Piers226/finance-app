"use client";

import React, { Fragment } from "react";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import LandingPage from "./landing/page";
import PlaidLinker from "@/components/PlaidLinker";

import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Container,
  Box,
  Divider,
  CircularProgress,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import ChatWindow from "@/components/ChatWindow";
import { Chat } from "openai/resources/index";

export default function HomePage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const router = useRouter();
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [viewMode, setViewMode] = useState("week"); // or 'month'

  useEffect(() => {
    if (session?.user?.id) {
      setLoadingTransactions(true);
      fetch(`/api/transactions?userId=${session.user.id}`)
        .then((res) => res.json())
        .then(setTransactions)
        .finally(() => setLoadingTransactions(false));
      fetch(`/api/budget-categories?userId=${session.user.id}`)
        .then((res) => res.json())
        .then(setBudgetCategories)
        .finally(() => setLoadingCategories(false));
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      setLoadingCategories(true);
      fetch(`/api/budget-categories?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length === 0) {
            alert("Please set up your budget categories first.");
            router.push("/setup");
          }
        })
        .finally(() => setLoadingCategories(false));
    }
  }, [session]);

  if (!session) {
    return <LandingPage />;
  }

  function getWeekTransactions(transactions) {
    const now = new Date();
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day + 6) % 7; // how many days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= monday && txDate <= sunday;
    });
  }

  // 1) getPeriodTransactions: returns only txs in the current week or month
  function getPeriodTransactions(transactions, mode) {
    if (mode === "week") {
      return getWeekTransactions(transactions);
    }
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d <= end;
    });
  }

  function normalizeAmount(cat, mode) {
    const { amount, frequency } = cat; // weekly | monthly
    if (mode === "week") {
      return frequency === "weekly" ? amount : amount / 4; // monthly → weekly
    } else {
      return frequency === "monthly" ? amount : amount * 4; // weekly → monthly
    }
  }
  // compute period transactions and summaries for the selected view
  const periodTransactions = getPeriodTransactions(transactions, viewMode);
  const nonSubs = budgetCategories.filter((c) => !c.isSubscription);
  const categorySummaries = nonSubs.map((cat) => {
    const targetAmount = normalizeAmount(cat, viewMode);
    const spent = periodTransactions
      .filter((tx) => tx.category === cat.category)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const percent = Math.min((spent / targetAmount) * 100, 100);
    return {
      id: cat._id,
      name: cat.category,
      spent,
      targetAmount,
      percent,
    };
  });

  // compute total spent and budget left for the selected view
  const totalBudget = nonSubs.reduce(
    (sum, cat) => sum + normalizeAmount(cat, viewMode),
    0
  );
  const totalSpent = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const viewBudgetLeft = totalBudget - totalSpent;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
      <AppBar
        position="static"
        sx={{
          bgcolor: "background.default",
          boxShadow: "none",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          mb: 4,
        }}
      >
        <Toolbar
          sx={{ display: "flex", justifyContent: "space-between", py: 2 }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              fontSize: "1.5rem",
              letterSpacing: "-0.5px",
            }}
          >
            M<sup>3</sup>
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              sx={{
                borderRadius: 6,
                textTransform: "none",
                fontWeight: 500,
              }}
              onClick={() => router.push("/managebudget")}
            >
              Manage Budget
            </Button>
            {session && (
              <Button
                onClick={() => signOut()}
                sx={{
                  bgcolor: "transparent",
                  color: "text.primary",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.05)",
                  },
                }}
              >
                Log out
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, px: { xs: 0.5, sm: 2 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: 3,
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ mb: { xs: 1, sm: 0 } }}>
            Welcome, {session.user.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "flex-start", sm: "flex-end" },
              gap: 2,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 5,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                width: { xs: "100%", sm: "auto" },
                mb: { xs: 1, sm: 0 },
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 500, fontSize: { xs: "1rem", sm: "1.1rem" } }}
              >
                Total Spent This {viewMode === "week" ? "Week" : "Month"}: $
                {totalSpent.toFixed(2)}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: viewBudgetLeft >= 0 ? "#e8f5e9" : "#ffebee",
                borderRadius: 5,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 500, fontSize: { xs: "1rem", sm: "1.1rem" } }}
              >
                {viewBudgetLeft >= 0
                  ? `Budget Remaining: $${viewBudgetLeft.toFixed(2)}`
                  : `Over Budget by: $${Math.abs(viewBudgetLeft).toFixed(
                      2
                    )} (Budget: $${totalBudget.toFixed(2)})`}
              </Typography>
            </Box>
          </Box>
        </Box>

        {!showForm && (
          <Button
            variant="contained"
            onClick={() => setShowForm(true)}
            sx={{
              mt: { xs: 1, sm: 2 },
              mb: 1,
              borderRadius: 6,
              textTransform: "none",
              fontWeight: 500,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Add Transaction
          </Button>
        )}

        {showForm && (
          <Box sx={{ mb: 4 }}>
            <TransactionForm
              userId={session.user.id}
              budgetCategories={budgetCategories}
              onSuccess={() => {
                fetch(`/api/transactions?userId=${session.user.id}`)
                  .then((res) => res.json())
                  .then(setTransactions);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Budget Overview ({viewMode === "week" ? "Week" : "Month"})
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              sx={{
                bgcolor: "background.paper",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "8px",
                overflow: "hidden",
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: "0",
                  mx: 0,
                  px: 3,
                  py: 1,
                  color: "text.secondary",
                  fontWeight: 500,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.light",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "primary.main",
                    },
                  },
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.05)",
                  },
                },
              }}
            >
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {/*<ChatWindow />*/}
          <PlaidLinker />
          <Box
            sx={{
              bgcolor: "#f5f5f5",
              color: "text.secondary",
              borderRadius: 99,
              px: 2,
              py: 0.25,
              fontSize: "0.8rem",
              fontWeight: 400,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              letterSpacing: 0.1,
              display: "inline-block",
              mt: 1,
              ml: 0,
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            Click Each Category to View Details
          </Box>
          <List
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              bgcolor: "transparent",
            }}
          >
            {categorySummaries.map(
              ({ id, name, spent, targetAmount, percent }) => (
                <Fragment key={id}>
                  <ListItem
                    sx={{
                      px: 3,
                      py: 2.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                      bgcolor: "background.paper",
                      borderRadius: 5,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer", // Add pointer cursor
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      },
                    }}
                    onClick={() => router.push(`/category/${id}`)}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{ fontWeight: 500, color: "text.primary", mb: 0.5 }}
                      >
                        {name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${spent.toFixed(2)} spent of ${targetAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        minWidth: 100,
                        justifyContent: "flex-end",
                      }}
                    >
                      <Box
                        sx={{ position: "relative", display: "inline-flex" }}
                      >
                        <CircularProgress
                          size={48}
                          thickness={4}
                          variant="determinate"
                          value={percent}
                          sx={{
                            color:
                              percent < 75
                                ? "success.main"
                                : percent < 100
                                ? "warning.main"
                                : "error.main",
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color:
                              percent < 75
                                ? "success.main"
                                : percent < 100
                                ? "warning.main"
                                : "error.main",
                          }}
                        >
                          {Math.round(percent)}%
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                </Fragment>
              )
            )}
          </List>
        </Box>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Subscriptions
          </Typography>
          <List
            sx={{
              borderRadius: 5,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              p: 2,
            }}
          >
            {budgetCategories
              .filter((cat) => cat.isSubscription)
              .map((cat) => {
                const displayAmount = normalizeAmount(cat, viewMode);
                return (
                  <ListItem
                    key={cat._id}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      px: 2,
                      py: 1,
                      bgcolor: "rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <ListItemText
                      primary={cat.category}
                      secondary={`$${displayAmount.toFixed(2)} per ${
                        viewMode === "week" ? "week" : "month"
                      }`}
                    />
                  </ListItem>
                );
              })}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />
        <Button
          variant="outlined"
          onClick={() => router.push("/transactions")}
          sx={{
            mt: 2,
            borderRadius: 6,
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          Manage Transactions
        </Button>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Recent Transactions
        </Typography>
        <List>
          {transactions.slice(0, 10).map((tx) => {
            const label = formatDistanceToNow(new Date(tx.date), {
              addSuffix: true,
            });
            return (
              <ListItem
                key={tx._id}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  px: 2,
                  py: 1,
                  bgcolor: "#fafafa",
                }}
              >
                <ListItemText
                  primary={`$${tx.amount} - ${tx.category || "Uncategorized"}`}
                  secondary={`${tx.description || "No description"} - ${label}`}
                />
              </ListItem>
            );
          })}
        </List>
      </Container>
    </Box>
  );
}
