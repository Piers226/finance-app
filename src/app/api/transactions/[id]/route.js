import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function DELETE(request, context) {
  await connectToDatabase();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
  }

  try {
    await Transaction.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  await connectToDatabase();
  const { id } = await context.params;
  const body = await req.json();
  const { amount, category, description, date } = body;

  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { amount, category, description, date },
      { new: true }
    );
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}