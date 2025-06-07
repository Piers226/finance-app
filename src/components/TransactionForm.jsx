'use client';

import { useState, useEffect } from 'react';
import { TextField, Button, Stack, MenuItem } from '@mui/material';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setCategory(transaction.category);
      setDescription(transaction.description || '');
      setDate(transaction.date?.split('T')[0]); // Format to YYYY-MM-DD
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
        date,
      }),
    });

    if (res.ok) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      if (onSuccess) onSuccess();
    }
  };

  const handleCancel = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
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
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
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