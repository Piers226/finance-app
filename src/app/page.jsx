"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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
            router.push("/setup");
          }
        })
        .finally(() => setLoadingCategories(false));
    }
  }, [session]);

  if (!session) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Please log in
        </Typography>
        <Button variant="contained" onClick={() => signIn("google")}>
          Sign in with Google
        </Button>
      </Container>
    );
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
        onClick={() => router.push("/setup")}
      >
        Edit Budget
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
          Budget Overview
        </Typography>
        {budgetCategories.map((cat) => {
          const weeklyTransactions = getWeekTransactions(transactions);
          const weeklySpent = weeklyTransactions
            .filter((tx) => tx.category === cat.category)
            .reduce((sum, tx) => sum + tx.amount, 0);

          const weeklyProgress = Math.min(
            (weeklySpent / cat.amount) * 100,
            100
          );

          return (
            <Box key={cat._id} sx={{ mb: 3 }}>
              <Typography>{cat.category}</Typography>
              <Typography variant="body2" color="text.secondary">
                Week: ${weeklySpent.toFixed(2)} / ${cat.amount.toFixed(2)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={weeklyProgress}
                sx={{ height: 8 }}
              />
            </Box>
          );
        })}
        <Divider sx={{ my: 3 }} />
      </Box>
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
