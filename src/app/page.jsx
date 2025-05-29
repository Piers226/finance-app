"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import TransactionForm from "@/components/TransactionForm";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Container,
  Box,
} from "@mui/material";

export default function HomePage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/transactions?userId=${session.user.id}`)
        .then((res) => res.json())
        .then(setTransactions);
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
