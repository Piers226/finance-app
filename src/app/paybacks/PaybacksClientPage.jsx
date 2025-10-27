'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { format, subDays } from 'date-fns';

export default function PaybacksClientPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ amount: '', person: '', note: '', reminderDate: '' });
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/paybacks?userId=${session.user.id}`)
      .then((res) => res.json())
      .then(setItems);
  }, [session]);

  useEffect(() => {
    const amount = searchParams.get('amount');
    const note = searchParams.get('note');
    const reminderDate = searchParams.get('reminderDate');
    if (amount || note || reminderDate) {
      setForm((prev) => ({
        ...prev,
        amount: amount || prev.amount,
        note: note || prev.note,
        reminderDate: reminderDate ? new Date(reminderDate).toISOString().split('T')[0] : prev.reminderDate,
      }));
    }
  }, [searchParams]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleAdd = () => {
    createPayback();
  };

  const createPayback = async () => {
    try {
      const { amount, person } = form;
      let finalAmount = amount;
      if (splitEnabled) {
        finalAmount = amount / splitCount;
      }
      if (!finalAmount || !person) return;

      if (splitEnabled) {
        const pendingTransactionId = searchParams.get('pendingTransactionId');
        const category = searchParams.get('category') || 'Payback';
        // Create a new transaction
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            amount: finalAmount,
            category,
            description: form.note,
            date: pendingTransactionId ? subDays(new Date(form.reminderDate), 30).toISOString() : new Date().toISOString(),
          }),
        });

        // Delete the pending transaction if it exists
        if (pendingTransactionId) {
          await fetch(`/api/pending-transactions/${pendingTransactionId}`, { method: 'DELETE' });
        }
      }

      // Create the payback
      const res = await fetch('/api/paybacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: finalAmount, userId: session.user.id }),
      });
      const doc = await res.json();

      setItems((prev) => [doc, ...prev]);
      setForm({ amount: '', person: '', note: '', reminderDate: '' });
      router.push('/paybacks');
    } catch (error) {
      console.error("Failed to create payback", error);
    }
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
        <FormControlLabel
          control={<Checkbox checked={splitEnabled} onChange={(e) => setSplitEnabled(e.target.checked)} />}
          label="Split"
        />
        {splitEnabled && (
          <TextField
            label="People"
            type="number"
            value={splitCount}
            onChange={(e) => setSplitCount(parseInt(e.target.value))}
          />
        )}
        <Button variant="contained" onClick={handleAdd} sx={{ alignSelf: 'center' }} disabled={!form.amount || !form.person || !form.note || !form.reminderDate}>
          Add
        </Button>
      </Box>

      <List sx={{ mt: 4 }}>
        {items.map((it) => (
          <ListItem key={it._id} sx={{ borderBottom: '1px solid #ccc' }}>
            <ListItemText
              primary={`${it.amount} from ${it.person}`}
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
