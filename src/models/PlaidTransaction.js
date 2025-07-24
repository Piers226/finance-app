// src/models/PlaidTransaction.js
import mongoose from 'mongoose';

const PlaidTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: String, required: true, unique: true }, // Plaid's transaction_id
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    category: { type: String },
    raw: { type: mongoose.Schema.Types.Mixed }, // store the entire Plaid tx for flexibility
  },
  { timestamps: true }
);

export default
  mongoose.models.PlaidTransaction ||
  mongoose.model('PlaidTransaction', PlaidTransactionSchema);
