"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import { format } from 'date-fns';

export default function PaybacksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ amount: '', person: '', note: '', reminderDate: '' });

  useEffect(() => {
    if (!session) return;
    fetch(`/api/paybacks?userId=${session.user.id}`)
      .then((res) => res.json())
      .then(setItems);
  }, [session]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleAdd = () => {
    const { amount, person } = form;
    if (!amount || !person) return;
    fetch('/api/paybacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId: session.user.id }),
    })
      .then((res) => res.json())
      .then((doc) => {
        setItems((prev) => [doc, ...prev]);
        setForm({ amount: '', person: '', note: '', reminderDate: '' });
      });
  };

  const handlePaid = (id) => {
    fetch(`/api/paybacks/${id}`, { method: 'DELETE' }).then(() => {
      setItems((prev) => prev.filter((it) => it._id !== id));
    });
  };

  if (!session) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Please log in to manage paybacks</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Payback Tracker
      </Typography>
      <Button variant="outlined" onClick={() => router.push('/')}>Back to Dashboard</Button>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Amount"
          type="number"
          value={form.amount}
          onChange={handleChange('amount')}
        />
        <TextField
          label="Person"
          value={form.person}
          onChange={handleChange('person')}
        />
        <TextField
          label="Note"
          value={form.note}
          onChange={handleChange('note')}
        />
        <TextField
          label="Reminder Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={form.reminderDate}
          onChange={handleChange('reminderDate')}
        />
        <Button variant="contained" onClick={handleAdd} sx={{ alignSelf: 'center' }}>
          Add
        </Button>
      </Box>

      <List sx={{ mt: 4 }}>
        {items.map((it) => (
          <ListItem key={it._id} sx={{ borderBottom: '1px solid #ccc' }}>
            <ListItemText
              primary={`$${it.amount} from ${it.person}`}
              secondary={`${it.note || 'No note'} • Reminder: ${it.reminderDate ? format(new Date(it.reminderDate), 'PPP') : 'N/A'}`}
            />
            <Button variant="text" color="error" onClick={() => handlePaid(it._id)}>
              Paid Back
            </Button>
          </ListItem>
        ))}
        {items.length === 0 && <Typography>No outstanding paybacks 🎉</Typography>}
      </List>
    </Container>
  );
}
