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
  IconButton,
  Switch,
  FormControlLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function ManageBudgetPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [success, setSuccess] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
    const payload = {
      userId: session.user.id,
      category: isCustomCategory ? customCategory : category,
      amount: parseFloat(amount),
      frequency,
      isSubscription,
    };

    if (isEditing && selectedItem) {
      const res = await fetch(`/api/budget-categories/${selectedItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setBudgetCategories((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        setIsEditing(false);
        setSelectedItem(null);
        setSuccess(true);
      }
    } else {
      const res = await fetch('/api/budget-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newCategory = await res.json();
        setBudgetCategories((prev) => [...prev, newCategory]);
        setSuccess(true);
      }
    }

    // Reset form
    setCategory('');
    setAmount('');
    setFrequency('weekly');
    setCustomCategory('');
    setIsCustomCategory(false);
    setIsSubscription(false);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditing(true);
    setCategory(item.category);
    setAmount(item.amount.toString());
    setFrequency(item.frequency);
    setIsSubscription(item.isSubscription || false);
    const isDefault = default_categories.includes(item.category);
    setIsCustomCategory(!isDefault);
    if (!isDefault) setCustomCategory(item.category);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/budget-categories/${id}`, { method: 'DELETE' });
    setBudgetCategories((prev) => prev.filter((item) => item._id !== id));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedItem(null);
    setCategory('');
    setAmount('');
    setFrequency('weekly');
    setCustomCategory('');
    setIsCustomCategory(false);
    setIsSubscription(false);
  };

  if (!session) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Manage Your Budget
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
          <FormControlLabel
            control={
              <Switch
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
              />
            }
            label="Subscription / Recurring"
          />
          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained">
              {isEditing ? 'Save Changes' : 'Add Category'}
            </Button>
            {isEditing && (
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button variant="text" onClick={() => router.push('/')}>
              Done
            </Button>
          </Box>
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
              <>
                <ListItem
                  key={item._id}
                  secondaryAction={
                    <Box>
                       <IconButton edge="end" onClick={() => handleEdit(item)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDelete(item._id)}>
                          <DeleteIcon />
                        </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`${item.category} - $${item.amount.toFixed(2)}`}
                    secondary={`Frequency: ${item.frequency}`}
                  />
                </ListItem>
                <Divider />
              </>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
}
