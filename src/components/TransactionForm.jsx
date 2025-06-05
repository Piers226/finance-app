// components/TransactionForm.jsx
'use client';

import { useState } from 'react';
import { TextField, Button, Stack, MenuItem, } from '@mui/material';


export default function TransactionForm({ userId, onSuccess, onCancel, budgetCategories }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  // Format initial date to YYYY-MM-DD
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);


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
        date: date, // This will now be YYYY-MM-DD format
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
          {budgetCategories.map((cat) => (
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
          Add Transaction
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