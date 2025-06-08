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
} from "@mui/material";

export default function HomePage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const router = useRouter();
  const [budgetCategories, setBudgetCategories] = useState([]);

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

  if (loadingTransactions || loadingCategories) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6">Loading...</Typography>
      </Container>
    );
  }

  const getWeekTransactions = (transactions) => {
    const now = new Date();

    // Get Monday of the current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay() + 7);
    sunday.setHours(0, 0, 0, 0);

    const mondayStr = monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const sundayStr = sunday.toISOString().slice(0, 10); // "YYYY-MM-DD"

    return transactions.filter((tx) => {
      const txStr = new Date(tx.date).toISOString().slice(0, 10);
      return txStr >= mondayStr && txStr <= sundayStr;
    });
  };

  // Calculate weekly budget vs spent for non-subscription categories
  const nonSubCategories = budgetCategories.filter((cat) => !cat.isSubscription);
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
        <Grid container spacing={2}>
          {budgetCategories.filter((cat) => !cat.isSubscription).map((cat) => {
            const weeklyTransactions = getWeekTransactions(transactions);
            const weeklySpent = weeklyTransactions
              .filter((tx) => tx.category === cat.category)
              .reduce((sum, tx) => sum + tx.amount, 0);

            const weeklyProgress = Math.min(
              (weeklySpent / cat.amount) * 100,
              100
            );

            return (
              <Grid item xs={12} sm={6} md={4} key={cat._id}>
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography>{cat.category}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Week: ${weeklySpent.toFixed(2)} / ${cat.amount.toFixed(2)}
                  </Typography>
                  <Box sx={{ position: "relative", display: "inline-flex", mt: 1 }}>
                    <CircularProgress
                      variant="determinate"
                      value={weeklyProgress}
                      sx={{
                        color:
                          weeklyProgress < 75
                            ? 'success.main'
                            : weeklyProgress < 100
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
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" component="div" color="textSecondary">
                        {`${Math.round(weeklyProgress)}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            );
          })}
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
              const displayAmount =
                cat.frequency === "weekly"
                  ? cat.amount
                  : cat.frequency === "monthly"
                  ? cat.amount / 4
                  : cat.amount;
              return (
                <Grid item xs={12} sm={6} md={4} key={cat._id}>
                  <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Typography>
                      {cat.category}: ${displayAmount.toFixed(2)} ({cat.amount} / {cat.frequency})
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
            : `Over Budget by: $${Math.abs(budgetLeft).toFixed(2)}`}
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
