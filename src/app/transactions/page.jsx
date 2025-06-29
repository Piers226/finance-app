"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Select,
  MenuItem,
} from "@mui/material";

import TransactionForm from "@/components/TransactionForm";

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState([]);
  const [editingTx, setEditingTx] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    fetch(`/api/transactions?userId=${session.user.id}`)
      .then((res) => res.json())
      .then(setTransactions);
    fetch(`/api/budget-categories?userId=${session.user.id}`)
      .then((res) => res.json())
      .then(setBudgetCategories);
  }, [session]);

  const handleQuickCategoryChange = (id, category) => {
    fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setTransactions((prev) =>
          prev.map((tx) => (tx._id === id ? { ...tx, category } : tx))
        );
      });
  };

  const handleDelete = (id) => {
    fetch(`/api/transactions/${id}`, { method: "DELETE" }).then(() =>
      fetch(`/api/transactions?userId=${session.user.id}`)
        .then((res) => res.json())
        .then(setTransactions)
    );
  };

  const handleEdit = (tx) => {
    setEditingTx(tx);
    setShowForm(true);
    // smooth scroll to top where the form is
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!session) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Please log in to view transactions</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Manage Transactions
      </Typography>
      <Button variant="outlined" onClick={() => router.push("/")}>
        Back to Dashboard
      </Button>
      <Button
        variant="contained"
        sx={{ ml: 2 }}
        onClick={() => {
          setEditingTx(null);
          setShowForm(true);
        }}
      >
        Add Transaction
      </Button>
      {showForm && (
        <Box sx={{ mt: 4 }}>
          <TransactionForm
            userId={session.user.id}
            budgetCategories={budgetCategories}
            transaction={editingTx}
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
      <List sx={{ mt: 4 }}>
        {transactions.map((tx) => {
          const label = formatDistanceToNow(new Date(tx.date), {
            addSuffix: true,
          });
          return (
            <ListItem key={tx._id} sx={{ borderBottom: "1px solid #ccc" }}>
              <ListItemText
                primary={`$${tx.amount}`}
                secondary={`${tx.description || "No description"} - ${label}`}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Select
                  size="small"
                  value={tx.category || ""}
                  onChange={(e) => handleQuickCategoryChange(tx._id, e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    Category
                  </MenuItem>
                  {budgetCategories.map((cat) => (
                    <MenuItem key={cat._id} value={cat.category}>
                      {cat.category}
                    </MenuItem>
                  ))}
                </Select>
                <Button variant="contained" size="small" onClick={() => handleEdit(tx)}>
                  Edit
                </Button>
                <Button variant="text" color="error" size="small" onClick={() => handleDelete(tx._id)}>
                  Discard
                </Button>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
}
