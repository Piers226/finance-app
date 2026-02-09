import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  newAccount: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  chatCount: { type: Number, default: 20 }, // Start with 20 chats
  plaidAccessToken: { type: String }, // Store Plaid access token
  plaidItemId: { type: String }, // Plaid item_id for webhooks
  plaidCursor: { type: String, default: null }, // Last transactionsSync cursor
  bankLinked: { type: Boolean, default: false }, // Track if bank is linked
  bankName: { type: String, default: "" }, // Institution display name
  dateCreated: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
