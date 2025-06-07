// src/models/BudgetCategory.js
import mongoose from 'mongoose';



const BudgetCategorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true},
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' },
  isSubscription: { type: Boolean, default: false },
  
});

export default mongoose.models.BudgetCategory || mongoose.model('BudgetCategory', BudgetCategorySchema);