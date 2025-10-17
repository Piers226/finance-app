import { useState } from "react";
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
} from "@mui/material";
import { format } from "date-fns";

export default function PendingTransactionsList({
  pending,
  budgetCategories,
  onCategorised,
  onDiscard,
  onSynced,
}) {
  const [selected, setSelected] = useState({});
  const { data: session } = useSession();
  const [syncLoading, setSyncLoading] = useState(false);
// router may be used elsewhere but no longer for refresh
  const router = useRouter();

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
      // Immediately fetch updated pending transactions list
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

  const handleSave = async (tx) => {
    const category = selected[tx._id];
    if (!category) return;
    await onCategorised(tx, category);
    setSelected((prev) => {
      const copy = { ...prev };
      delete copy[tx._id];
      return copy;
    });
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
        {pending.map((tx) => (
          <ListItem
            key={tx._id}
            sx={{ bgcolor: "#fff3e0", borderRadius: 2, mb: 1, px: 2 }}
          >
            <ListItemText
              primary={`$${tx.amount.toFixed(2)} - ${tx.description}`}
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
              {budgetCategories.map((cat) => (
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
          </ListItem>
        ))}
        {pending.length === 0 && (
          <Typography variant="body2">
            No pending transactions to review🎉
          </Typography>
        )}
      </List>
    </Box>
  );
}
