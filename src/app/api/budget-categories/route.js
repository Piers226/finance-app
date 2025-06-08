import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BudgetCategory from '@/models/BudgetCategory';

export async function POST(req) {
  await connectToDatabase();
  const { userId, category, amount, frequency = 'weekly', isSubscription = false } = await req.json();

  if (!userId || !category || amount == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const newCategory = await BudgetCategory.create({
    userId,
    category,
    amount,
    frequency,
    isSubscription,
  });

  return NextResponse.json(newCategory);
}

export async function GET(req) {
  await connectToDatabase();

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const categories = await BudgetCategory.find({ userId });
  return NextResponse.json(categories);
}