import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { usePlaidLink } from "react-plaid-link";
import { useSession } from "next-auth/react";

export default function PlaidLinker({ onLinked, onTransactions, variant = "contained" }) {
  const { data: session } = useSession();
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bankLinked, setBankLinked] = useState(false);
  const [bankName, setBankName] = useState("");
  // Capture Plaid OAuth redirect URI if present (Link opened in new tab)
  const receivedRedirectUri = typeof window !== "undefined" && window.location.search.includes("oauth_state_id")
    ? window.location.href
    : undefined;

  useEffect(() => {
    async function fetchBankStatus() {
      if (!session?.user?.id) return;
      const res = await fetch("/api/user/bank-status");
      const data = await res.json();
      setBankLinked(!!data.bankLinked);
      if (data.bankLinked) {
        setSuccess(true);
        if (data.bankName) setBankName(data.bankName);
      }
    }
    fetchBankStatus();
  }, [session]);

  // Step 1: Get a link token from backend
  const createLinkToken = useCallback(async () => {
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
  }, [session]);

  // Step 2: Use Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri,
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
            institutionName: metadata?.institution?.name || "",
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          setSuccess(true);
          if (onLinked) onLinked({ ...data, institution: metadata.institution });
          // Save bank name locally
          if (metadata?.institution?.name) setBankName(metadata.institution.name);
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

  // Automatically open once ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <Box sx={{ my: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {bankLinked ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Bank linked{bankName ? `: ${bankName}` : ""}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                const res = await fetch("/api/plaid", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "get_transactions",
                    userId: session?.user?.id,
                  }),
                });
                const data = await res.json();
                if (data.error) setError(data.error);
                else if (onTransactions) onTransactions(data);
              } catch (err) {
                setError(err.message || "Sync failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={16} /> : "Sync"}
          </Button>
        </Box>
      ) : (
        <Button
          variant={variant}
          onClick={createLinkToken}
          disabled={loading}
          sx={{ borderRadius: 6 }}
        >
          {loading ? <CircularProgress size={20} /> : "Link Bank Account"}
        </Button>
      )}
    </Box>
  );
}
