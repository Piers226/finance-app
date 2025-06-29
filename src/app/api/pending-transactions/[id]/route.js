// src/app/api/pending-transactions/[id]/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PendingTransaction from '@/models/PendingTransaction';

export async function DELETE(request, { params }) {
  await connectToDatabase();
  const { id } = params;
  await PendingTransaction.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
