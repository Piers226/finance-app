// src/app/api/transactions/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function GET(req) {
  await connectToDatabase();
  const transactions = await Transaction.find().sort({ date: -1 }).limit(50);
  return NextResponse.json(transactions);
}

export async function POST(req) {
  await connectToDatabase();
  const body = await req.json();
  const { userId, amount, category, description, date } = body;

if (!userId || !amount) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}

const transaction = await Transaction.create({
  userId,
  amount,
  category,
  description,
  date: date ? new Date(date) : new Date(),
});

  return NextResponse.json(transaction);
}