import { useState, useEffect } from "react";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { usePlaidLink } from "react-plaid-link";
import { useSession } from "next-auth/react";

export default function PlaidLinker({ onLinked, onTransactions }) {
  const { data: session } = useSession();
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bankLinked, setBankLinked] = useState(false);

  useEffect(() => {
    async function fetchBankStatus() {
      if (!session?.user?.id) return;
      const res = await fetch("/api/user/bank-status");
      const data = await res.json();
      setBankLinked(!!data.bankLinked);
      if (data.bankLinked) setSuccess(true);
    }
    fetchBankStatus();
  }, [session]);

  // Step 1: Get a link token from backend
  async function createLinkToken() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_link_token",
          userId: session?.user?.id,
        }),
      });
      const data = await res.json();
      if (data.link_token) setLinkToken(data.link_token);
      else setError(data.error || "Could not get link token");
    } catch (err) {
      setError(err.message || "Could not get link token");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Use Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      setLoading(true);
      setError(null);
      try {
        // Step 3: Exchange public_token for access_token
        const res = await fetch("/api/plaid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "exchange_public_token",
            public_token,
            userId: session?.user?.id,
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          setSuccess(true);
          if (onLinked) onLinked(data);
          // Step 4: Fetch transactions
          const txRes = await fetch("/api/plaid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "get_transactions",
              access_token: data.access_token,
            }),
          });
          const txData = await txRes.json();
          console.log("Plaid transactions:", txData);
          if (onTransactions) onTransactions(txData);
        } else {
          setError(data.error || "Could not exchange token");
        }
      } catch (err) {
        setError(err.message || "Could not link account");
      } finally {
        setLoading(false);
      }
    },
    onExit: (err) => {
      if (err) setError("Plaid Link exited: " + err.error_message);
    },
  });

  return (
    <Box sx={{ my: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {bankLinked && <Alert severity="success">Bank account linked!</Alert>}
      <Button
        variant="contained"
        onClick={linkToken ? open : createLinkToken}
        disabled={loading || (linkToken && !ready)}
      >
        {loading ? (
          <CircularProgress size={20} />
        ) : linkToken ? (
          "Link Bank Account"
        ) : (
          "Start Bank Link"
        )}
      </Button>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Securely link your bank to import recent transactions.
      </Typography>
    </Box>
  );
}
