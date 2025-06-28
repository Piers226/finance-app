import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  hasSetupBudget: { type: Boolean, default: false },
  chatCount: { type: Number, default: 20 }, // Start with 20 chats
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
