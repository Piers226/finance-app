"use client";
import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Paper,
} from "@mui/material";
import { useSession } from "next-auth/react";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  async function send() {
    if (!input.trim()) return;
    setError(null);
    const userMsg = { role: "user", content: input };
    setMessages([userMsg]); // Only keep the current user message
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMsg] }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson?.error || "Server error. Please try again.");
        setLoading(false);
        return;
      }
      const botMsg = await res.json();
      setMessages([userMsg, botMsg]); // Only show the current pair
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function renderContent(msg, index) {
    const isUser = msg.role === "user";
    const align = isUser ? "flex-end" : "flex-start";
    const bgColor = isUser ? "primary.main" : "grey.300";
    const textColor = isUser ? "white" : "black";
        // avatarLetter logic inserted here
    let avatarLetter;
    if (isUser) {
      const fullName = session?.user?.name || "";
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2) {
        avatarLetter =
          parts[0].charAt(0).toUpperCase() +
          parts[parts.length - 1].charAt(0).toUpperCase();
      } else {
        avatarLetter = fullName.charAt(0).toUpperCase() || "U";
      }
    } else {
      avatarLetter = "M³";
    }

    return (
      <ListItem key={index} sx={{ justifyContent: align }}>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: isUser ? "primary.main" : "secondary.main" }}>
            {avatarLetter}
          </Avatar>
        </ListItemAvatar>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            bgcolor: bgColor,
            color: textColor,
            borderRadius: 2,
            maxWidth: "75%",
          }}
        >
          <Typography variant="body2">{msg.content}</Typography>
        </Paper>
      </ListItem>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 4 }}>
      <Box
        sx={{
          height: 400,
          mb: 2,
          bgcolor: "#fafbfc",
          borderRadius: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflowY: "auto",
        }}
      >
        <List dense disablePadding>
          {messages.map((m, i) => renderContent(m, i))}
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center", mt: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Assistant is typing…
              </Typography>
            </Box>
          )}
        </List>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          disabled={loading}
          inputProps={{ maxLength: 200 }}
          multiline
          rows={1}
        />
        <Button
          variant="contained"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
