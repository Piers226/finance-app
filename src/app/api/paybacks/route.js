import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PaybackTransaction from '@/models/PaybackTransaction';

// GET /api/paybacks?userId=
export async function GET(req) {
  await connectToDatabase();
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const items = await PaybackTransaction.find({ userId }).sort({ createdAt: -1 });
  return NextResponse.json(items);
}

// POST create new payback
export async function POST(req) {
  await connectToDatabase();
  const body = await req.json();
  const { userId, amount, person, note, reminderDate } = body;
  if (!userId || !amount || !person) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const item = await PaybackTransaction.create({
    userId,
    amount,
    person,
    note,
    reminderDate: reminderDate ? new Date(reminderDate) : undefined,
  });
  return NextResponse.json(item);
}
