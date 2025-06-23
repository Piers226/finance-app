"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Stack,
  MenuItem,
  Paper,
  Typography,
  InputAdornment,
  Box,
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function TransactionForm({
  userId,
  onSuccess,
  onCancel,
  budgetCategories,
  transaction, // Optional prop for editing
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setCategory(transaction.category);
      setDescription(transaction.description || "");
      setDateTime(transaction.date ? new Date(transaction.date) : new Date());
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const method = transaction ? "PUT" : "POST";
    const endpoint = transaction
      ? `/api/transactions/${transaction._id}`
      : "/api/transactions";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        amount: parseFloat(amount),
        category,
        description,
        date: dateTime.toISOString(),
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setAmount("");
      setCategory("");
      setDescription("");
      setDateTime(new Date());
      if (onSuccess) onSuccess();
    }
  };

  const handleCancel = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setDateTime(new Date());
    if (onCancel) onCancel();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 4 },
        borderRadius: 4,
        maxWidth: 420,
        mx: "auto",
        mt: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: 600, textAlign: "center" }}
      >
        {transaction ? "Edit Transaction" : "Add Transaction"}
      </Typography>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Stack spacing={2}>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyIcon color="primary" />
                </InputAdornment>
              ),
              inputProps: { min: 0, step: 0.01 },
            }}
            fullWidth
          />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CategoryIcon color="primary" />
                </InputAdornment>
              ),
            }}
            fullWidth
          >
            <MenuItem value="" disabled>
              Select a category
            </MenuItem>
            {budgetCategories
              .filter((cat) => !cat.isSubscription)
              .map((cat) => (
                <MenuItem key={cat._id} value={cat.category}>
                  {cat.category}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionIcon color="primary" />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={dateTime}
              onChange={(newValue) => setDateTime(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </LocalizationProvider>
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitting}
              sx={{ fontWeight: 600, borderRadius: 3 }}
            >
              {transaction ? "Update" : "Add"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={handleCancel}
              color="secondary"
              fullWidth
              sx={{ fontWeight: 600, borderRadius: 3 }}
            >
              Cancel
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}
