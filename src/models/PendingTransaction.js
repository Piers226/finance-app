// src/models/PendingTransaction.js
import mongoose from 'mongoose';

const PendingTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: String, required: true, unique: true }, // Plaid's transaction_id
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  originalCategory: { type: String },
  suggestedCategory: { type: String },
}, { timestamps: true });

export default mongoose.models.PendingTransaction || mongoose.model('PendingTransaction', PendingTransactionSchema);
