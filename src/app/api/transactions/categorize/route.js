import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import BudgetCategory from '@/models/BudgetCategory';
import PlaidTransaction from '@/models/PlaidTransaction';
import PendingTransaction from '@/models/PendingTransaction';
import Transaction from '@/models/Transaction';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Step 1: Get user's custom budget categories
  const budgetCategories = await BudgetCategory.find({ userId });
  const categoryNames = budgetCategories.map(c => c.category);

  // Step 2: Get all Plaid transactions for the user
  const plaidTransactions = await PlaidTransaction.find({ userId }).sort({ date: -1 }).limit(50);

  if (plaidTransactions.length === 0) {
    return NextResponse.json({ message: 'No Plaid transactions to categorize.' });
  }

  // Step 3: Call OpenAI to re-categorize
  const prompt = `You are a personal finance assistant. Re-categorize the following bank transactions based on this user's custom budget categories: [${categoryNames.join(', ')}]. For each transaction, provide a JSON object with its 'transactionId' and the most appropriate 'category' from the user's list. Use the provided 'personal_finance_category' for additional context. If a transaction does not fit any of the custom categories, set the 'category' to null. The root of your JSON response must be a key named \"transactions\" which contains an array of these objects. Here are the transactions:
${JSON.stringify(plaidTransactions.map(t => ({ transactionId: t.transactionId, description: t.description, amount: t.amount, personal_finance_category: t.raw.personal_finance_category })), null, 2)}`;

  console.log("Prompt being sent to OpenAI:", prompt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    console.log("Response from OpenAI:", response.choices[0].message.content);

    const categorizedData = JSON.parse(response.choices[0].message.content);

    // Validate the structure of the OpenAI response
    if (!categorizedData || !Array.isArray(categorizedData.transactions)) {
      console.error('Malformed OpenAI response:', response.choices[0].message.content);
      throw new Error('Malformed OpenAI response: expected a `transactions` array.');
    }

    const categorizedTransactions = categorizedData.transactions;

    const toPend = [];

    for (const tx of categorizedTransactions) {
      const originalTx = plaidTransactions.find(t => t.transactionId === tx.transactionId);
      if (!originalTx) continue;

      toPend.push({ ...originalTx.toObject(), suggestedCategory: tx.category });
    }

    // Step 4: Insert re-categorized transactions into the main Transaction collection (DISABLED FOR TESTING)
    // if (toCategorize.length > 0) {
    //   const transactionOps = toCategorize.map(tx => ({
    //     userId,
    //     amount: tx.amount,
    //     category: tx.category,
    //     description: tx.description,
    //     date: tx.date,
    //   }));
    //   await Transaction.insertMany(transactionOps);
    // }

    // Step 5: Insert transactions that couldn't be re-categorized into PendingTransaction
    if (toPend.length > 0) {
      const pendingOps = toPend.map(tx => ({
        userId,
        transactionId: tx.transactionId,
        amount: tx.amount,
        date: tx.date,
        description: tx.description,
        raw: tx.raw,
        suggestedCategory: tx.suggestedCategory,
      }));
      await PendingTransaction.insertMany(pendingOps);
    }

    // Step 6: Cleanup - remove all processed transactions from PlaidTransaction
    const processedTxIds = plaidTransactions.map(t => t.transactionId);
    await PlaidTransaction.deleteMany({ transactionId: { $in: processedTxIds } });

    return NextResponse.json({
      categorized: 0, // toCategorize.length,
      pending: toPend.length
    });

  } catch (error) {
    console.error('Error categorizing transactions with OpenAI:', error);
    return NextResponse.json({ error: 'Failed to categorize transactions.' }, { status: 500 });
  }
}
