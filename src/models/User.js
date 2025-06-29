import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  hasSetupBudget: { type: Boolean, default: false },
  chatCount: { type: Number, default: 20 }, // Start with 20 chats
  plaidAccessToken: { type: String }, // Store Plaid access token
  bankLinked: { type: Boolean, default: false }, // Track if bank is linked
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
