'use client';

import { useState, useEffect } from 'react';
import { TextField, Button, Stack, MenuItem } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function TransactionForm({
  userId,
  onSuccess,
  onCancel,
  budgetCategories,
  transaction, // Optional prop for editing
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setCategory(transaction.category);
      setDescription(transaction.description || '');
      setDateTime(transaction.date ? new Date(transaction.date) : new Date());
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = transaction ? 'PUT' : 'POST';
    const endpoint = transaction
      ? `/api/transactions/${transaction._id}`
      : '/api/transactions';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: parseFloat(amount),
        category,
        description,
        date: dateTime.toISOString(),
      }),
    });

    if (res.ok) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDateTime(new Date());
      if (onSuccess) onSuccess();
    }
  };

  const handleCancel = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDateTime(new Date());
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
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
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Date & Time"
            value={dateTime}
            onChange={(newValue) => setDateTime(newValue)}
            renderInput={(params) => <TextField {...params} required />}
          />
        </LocalizationProvider>
        <Button type="submit" variant="contained">
          {transaction ? 'Update Transaction' : 'Add Transaction'}
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={handleCancel}
          color="secondary"
        >
          Cancel
        </Button>
      </Stack>
    </form>
  );
}