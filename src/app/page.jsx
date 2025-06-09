"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import LandingPage from "./landing/page";

import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Container,
  Box,
  Divider,
  LinearProgress,
  CircularProgress,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

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
    const periodTransactions = getPeriodTransactions(transactions, viewMode);
    const nonSubs = budgetCategories.filter((c) => !c.isSubscription);

    const categorySummaries = nonSubs.map((cat) => {
      const targetAmount = normalizeAmount(cat, viewMode);

      const spent = periodTransactions
        .filter((tx) => tx.category === cat.category)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const percent = Math.min((spent / targetAmount) * 100, 100);

      return { id: cat._id, name: cat.category, spent, targetAmount, percent };
    });
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

  if (loadingTransactions || loadingCategories) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">Loading...</Typography>
      </Container>
    );
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
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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
  // Calculate weekly budget vs spent for non-subscription categories
  const nonSubCategories = budgetCategories.filter(
    (cat) => !cat.isSubscription
  );
  const totalWeeklyBudget = nonSubCategories.reduce(
    (sum, cat) =>
      sum + (cat.frequency === "weekly" ? cat.amount : cat.amount / 4),
    0
  );
  const weeklyTransactions = getWeekTransactions(transactions);
  const spentNonSub = weeklyTransactions
    .filter((tx) =>
      nonSubCategories.some((cat) => cat.category === tx.category)
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
  const budgetLeft = totalWeeklyBudget - spentNonSub;

  // compute period transactions and summaries for the selected view
  const periodTransactions = getPeriodTransactions(transactions, viewMode);
  const nonSubs = budgetCategories.filter(c => !c.isSubscription);
  const categorySummaries = nonSubs.map(cat => {
    const targetAmount = normalizeAmount(cat, viewMode);
    const spent = periodTransactions
      .filter(tx => tx.category === cat.category)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const percent = Math.min((spent / targetAmount) * 100, 100);
    return {
      id: cat._id,
      name: cat.category,
      spent,
      targetAmount,
      percent
    };
  });

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Welcome, {session.user.name}
      </Typography>

      <Button
        variant="outlined"
        onClick={() => signOut()}
        sx={{ mt: 1, mb: 3 }}
      >
        Log out
      </Button>
      <Button
        variant="outlined"
        sx={{ mt: 1, mb: 3 }}
        onClick={() => router.push("/managebudget")}
      >
        Manage Budget
      </Button>

      {!showForm && (
        <Button
          variant="contained"
          onClick={() => setShowForm(true)}
          sx={{ mt: 2, mb: 4 }}
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
          Budget Overview (Weekly)
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, next) => next && setViewMode(next)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
        <Grid container spacing={2}>
          {categorySummaries.map(({ id, name, spent, targetAmount, percent }) => (
            <Grid item xs={12} sm={6} md={4} key={id}>
              <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography>{name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewMode === 'week'
                    ? `Week: $${spent.toFixed(2)} / $${targetAmount.toFixed(2)}`
                    : `Month: $${spent.toFixed(2)} / $${targetAmount.toFixed(2)}`}
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                      color:
                        percent < 75
                          ? 'success.main'
                          : percent < 100
                          ? 'warning.main'
                          : 'error.main',
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="textSecondary">
                      {`${Math.round(percent)}%`}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Subscriptions
        </Typography>
        <Grid container spacing={2}>
          {budgetCategories
            .filter((cat) => cat.isSubscription)
            .map((cat) => {
              // normalize subscription cost to current view (week or month)
              const displayAmount = normalizeAmount(cat, viewMode);
              return (
                <Grid item xs={12} sm={6} md={4} key={cat._id}>
                  <Box
                    sx={{ p: 2, border: "1px dashed #ccc", borderRadius: 1 }}
                  >
                    <Typography>
                      {cat.category}: ${displayAmount.toFixed(2)} per{" "}
                      {viewMode === "week" ? "week" : "month"}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
        </Grid>
      </Box>
      <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
        <Typography variant="h6">
          Total Spent This Week: $
          {getWeekTransactions(transactions)
            .reduce((sum, tx) => sum + tx.amount, 0)
            .toFixed(2)}
        </Typography>
      </Box>
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: budgetLeft >= 0 ? "#e8f5e9" : "#ffebee",
          borderRadius: 1,
        }}
      >
        <Typography variant="h6">
          {budgetLeft >= 0
            ? `Budget Remaining: $${budgetLeft.toFixed(2)}`
            : `Over Budget ($${totalWeeklyBudget}) by: $${Math.abs(
                budgetLeft
              ).toFixed(2)}`}
        </Typography>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Button
        variant="outlined"
        onClick={() => router.push("/transactions")}
        sx={{ mt: 2 }}
      >
        Manage Transactions
      </Button>
      <Typography variant="h6" gutterBottom>
        Recent Transactions
      </Typography>
      <List>
        {transactions.map((tx) => {
          const label = formatDistanceToNow(new Date(tx.date), {
            addSuffix: true,
          });
          return (
            <ListItem key={tx._id} sx={{ borderBottom: "1px solid #ccc" }}>
              <ListItemText
                primary={`$${tx.amount} - ${tx.category || "Uncategorized"}`}
                secondary={`${tx.description || "No description"} - ${label}`}
              />
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
}
