import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function DELETE(req, { params }) {
  await connectToDatabase();

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
  }

  try {
    await Transaction.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}