import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
  TextField,
  IconButton,
} from "@mui/material";
import { format, addDays } from "date-fns";
import { People } from "@mui/icons-material";

export default function PendingTransactionsList({ 
  pending,
  budgetCategories,
  onCategorised,
  onDiscard,
  onSynced,
}) {
  const [selected, setSelected] = useState({});
  const [amounts, setAmounts] = useState({});
  const { data: session } = useSession();
  const [syncLoading, setSyncLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialSelected = {};
    const initialAmounts = {};
    pending.forEach(tx => {
      if (tx.suggestedCategory) {
        initialSelected[tx._id] = tx.suggestedCategory;
      }
      initialAmounts[tx._id] = tx.amount;
    });
    setSelected(initialSelected);
    setAmounts(initialAmounts);
  }, [pending]);
  const handleSync = async () => {
    if (!session?.user?.id) return;
    try {
      setSyncLoading(true);
      await fetch("/api/plaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: 'sync_transactions', userId: session.user.id }),
      });
      const res = await fetch(`/api/pending-transactions?userId=${session.user.id}`);
      const updated = await res.json();
      if (onSynced) onSynced(updated);
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleChange = (id, value) => {
    setSelected((prev) => ({ ...prev, [id]: value }));
  };

  const handleAmountChange = (id, value) => {
    setAmounts((prev) => ({ ...prev, [id]: parseFloat(value) }));
  };

  const handleSave = async (tx) => {
    const category = selected[tx._id];
    const amount = amounts[tx._id];
    if (!category) return;
    await onCategorised(tx, category, amount);
    setSelected((prev) => {
      const copy = { ...prev };
      delete copy[tx._id];
      return copy;
    });
    setAmounts((prev) => {
      const copy = { ...prev };
      delete copy[tx._id];
      return copy;
    });
  };

  const handleCollaborate = (tx) => {
    const amount = amounts[tx._id];
    const description = tx.description;
    const transactionDate = new Date(tx.date);
    const reminderDate = addDays(transactionDate, 30);
    const category = selected[tx._id];
    router.push(`/paybacks?amount=${amount}&note=${description}&reminderDate=${reminderDate.toISOString()}&pendingTransactionId=${tx._id}&category=${category}`);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleSync}
          disabled={syncLoading || !session?.user?.id}
        >
          {syncLoading ? <CircularProgress size={20} /> : "Sync Transactions"}
        </Button>
      </Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Pending Transactions
      </Typography>
      <List>
        {pending.map((tx) => {
          const options = [...budgetCategories];
          if (tx.suggestedCategory && !budgetCategories.find(c => c.category === tx.suggestedCategory)) {
            options.push({ _id: tx.suggestedCategory, category: tx.suggestedCategory });
          }

          return (
            <ListItem
              key={tx._id}
              sx={{ bgcolor: "#fff3e0", borderRadius: 2, mb: 1, px: 2 }}
            >
              <TextField
                size="small"
                type="number"
                value={amounts[tx._id] || 0}
                onChange={(e) => handleAmountChange(tx._id, e.target.value)}
                sx={{ mr: 1, width: 100 }}
              />
              <ListItemText
                primary={tx.description}
                secondary={format(new Date(tx.date), "PPP")}
              />
              <Select
                size="small"
                value={selected[tx._id] || ""}
                onChange={(e) => handleChange(tx._id, e.target.value)}
                displayEmpty
                sx={{ mr: 1, minWidth: 120 }}
              >
                <MenuItem value="" disabled>
                  Category
                </MenuItem>
                {options.map((cat) => (
                  <MenuItem key={cat._id} value={cat.category}>
                    {cat.category}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="contained"
                disabled={!selected[tx._id]}
                onClick={() => handleSave(tx)}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button variant="text" color="error" onClick={() => onDiscard(tx)}>
                Discard
              </Button>
              <IconButton onClick={() => handleCollaborate(tx)} disabled={!selected[tx._id]}>
                <People />
              </IconButton>
            </ListItem>
          )}
        )}
        {pending.length === 0 && (
          <Typography variant="body2">
            No pending transactions to review🎉
          </Typography>
        )}
      </List>
    </Box>
  );
}
