import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BudgetCategory from '@/models/BudgetCategory';

export async function POST(req) {
  await connectToDatabase();
  const { userId, category, amount, frequency = 'weekly' } = await req.json();

  if (!userId || !category || !amount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const newCategory = await BudgetCategory.create({
    userId,
    category,
    amount,
    frequency,
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