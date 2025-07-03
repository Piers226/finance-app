import mongoose from 'mongoose';

const PaybackTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    person: {
      type: String,
      required: true,
    },
    note: String,
    reminderDate: Date,
  },
  { timestamps: true }
);

export default mongoose.models.PaybackTransaction ||
  mongoose.model('PaybackTransaction', PaybackTransactionSchema);
