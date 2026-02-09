// src/app/setup/page.jsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

export default function SetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [success, setSuccess] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/budget-categories?userId=${session.user.id}`)
        .then((res) => res.json())
        .then(setBudgetCategories)
        .finally(() => setLoadingCategories(false));
    }
  }, [session]);

  const default_categories = [
    "Coffee",
    "Groceries",
    "Drinks",
    "Gym",
    "Eating Out",
    "Transport",
    "Household",
    "Subscriptions",
    "Trips",
    "Takeout",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/budget-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        category: isCustomCategory ? customCategory : category,
        amount: parseFloat(amount),
        frequency,
      }),
    });

    if (res.ok) {
      const newCategory = await res.json();
      setBudgetCategories((prev) => [...prev, newCategory]);
      setCategory("");
      setAmount("");
      setFrequency("weekly");
      setCustomCategory("");
      setIsCustomCategory(false);
      setSuccess(true);
    }
  };

  const handleDone = async () => {
    // mark setup complete in the DB so middleware / session logic stop treating user as new
    try {
      const res = await fetch("/api/user/complete-setup", { method: "POST" });
      if (!res.ok) {
        console.error("Failed to mark setup complete", await res.text());
        return;
      }
      // refresh the client session so the `newAccount` flag is updated
      try {
        await update();
      } catch (e) {
        console.warn("Session update failed, user may need to reload", e);
      }
    } catch (e) {
      console.error("Failed to mark setup complete", e);
      return;
    }
    router.push("/");
  };

  if (!session) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Set Up Your Budget
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Category"
            value={category}
            required
            onChange={(e) => {
              setCategory(e.target.value);
              setIsCustomCategory(e.target.value === "custom");
            }}
            select
            helperText="Select a budget category or add custom"
            defaultValue=""
          >
            <MenuItem value="" disabled>
              Select a category
            </MenuItem>
            {default_categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
            <MenuItem value="custom">+ Add Custom Category</MenuItem>
          </TextField>

          {isCustomCategory && (
            <TextField
              label="Custom Category"
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                setCategory(e.target.value);
              }}
              required
              autoFocus
              placeholder="Enter your custom category"
            />
          )}

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <TextField
            select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained">
              Add Category
            </Button>
            <Button
              variant="outlined"
              onClick={handleDone}
              disabled={budgetCategories.length === 0}
              title={
                budgetCategories.length === 0
                  ? "Add at least one category to finish setup"
                  : "Finish setup"
              }
            >
              Done
            </Button>
          </Box>
          {budgetCategories.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add at least one budget category before finishing setup.
            </Typography>
          )}
        </Stack>
      </form>
      {success && (
        <Typography variant="body2" color="green" sx={{ mt: 2 }}>
          Budget category added!
        </Typography>
      )}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Budget Categories
        </Typography>
        {loadingCategories ? (
          <Typography>Loading...</Typography>
        ) : (
          <List>
            {budgetCategories.map((item) => (
              <div key={item._id}>
                <ListItem>
                  <ListItemText
                    primary={`${item.category} - $${item.amount.toFixed(2)}`}
                    secondary={`Frequency: ${item.frequency}`}
                  />
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
}
