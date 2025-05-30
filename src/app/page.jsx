"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import { useRouter } from "next/navigation";
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
            onSuccess={() => {
              fetch(`/api/transactions?userId=${session.user.id}`)
                .then((res) => res.json())
                .then(setTransactions);
              setShowForm(false);
            }}
          />
        </Box>
      )}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Budget Overview
        </Typography>
        {budgetCategories.map((cat) => {
          const totalSpent = transactions
            .filter((tx) => tx.category === cat.category)
            .reduce((sum, tx) => sum + tx.amount, 0);

          const progress = Math.min((totalSpent / cat.amount) * 100, 100);

          return (
            <Box key={cat._id} sx={{ mb: 2 }}>
              <Typography>
                {cat.category}: ${totalSpent.toFixed(2)} / $
                {cat.amount.toFixed(2)}
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          );
        })}
        <Divider sx={{ my: 3 }} />
      </Box>
      <Typography variant="h6" gutterBottom>
        Recent Transactions
      </Typography>
      <List>
        {transactions.map((tx) => (
          <ListItem key={tx._id} sx={{ borderBottom: "1px solid #ccc" }}>
            <ListItemText
              primary={`$${tx.amount} - ${tx.category || "Uncategorized"}`}
              secondary={tx.description}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
