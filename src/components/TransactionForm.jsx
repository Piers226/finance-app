// components/TransactionForm.jsx
'use client';

import { useState } from 'react';
import { TextField, Button, Stack, MenuItem, } from '@mui/material';


export default function TransactionForm({ userId, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = [
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
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: parseFloat(amount),
        category,
        description,
      }),
    });

    if (res.ok) {
      setAmount('');
      setCategory('');
      setDescription('');
      if (onSuccess) onSuccess();
    }
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
        >
          <MenuItem value="" disabled>
            Select a category
          </MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Add Transaction
        </Button>
      </Stack>
    </form>
  );
}