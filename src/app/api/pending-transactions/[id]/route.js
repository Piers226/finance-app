// src/app/api/pending-transactions/[id]/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PendingTransaction from '@/models/PendingTransaction';

export async function PUT(request, context) {
  await connectToDatabase();
  const { id } = await context.params;
  const { category, amount } = await request.json();
  const updatedTransaction = await PendingTransaction.findByIdAndUpdate(
    id,
    { suggestedCategory: category, amount },
    { new: true }
  );
  return NextResponse.json(updatedTransaction);
}

export async function DELETE(request, context) {
  await connectToDatabase();
  const { id } = await context.params;
  await PendingTransaction.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
