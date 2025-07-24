// src/app/api/pending-transactions/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PendingTransaction from '@/models/PendingTransaction';

export async function GET(req) {
  await connectToDatabase();
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const pending = await PendingTransaction.find({ userId }).sort({ date: -1 });
  return NextResponse.json(pending);
}

// Bulk upsert pending transactions
export async function POST(req) {
  await connectToDatabase();
  const body = await req.json();
  const { userId, transactions } = body;
  if (!userId || !Array.isArray(transactions)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  // Upsert each transaction by transactionId
  const bulk = transactions.map((tx) => ({
    updateOne: {
      filter: { transactionId: tx.transaction_id },
      update: {
        $setOnInsert: {
          userId,
          transactionId: tx.transaction_id,
          amount: tx.amount,
          description: tx.name,
          date: tx.date,
          originalCategory: tx.category?.[0] ?? null,
        },
      },
      upsert: true,
    },
  }));
  if (bulk.length) {
    await PendingTransaction.bulkWrite(bulk);
  }
  return NextResponse.json({ inserted: bulk.length });
}
