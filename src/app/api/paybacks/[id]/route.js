import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PaybackTransaction from '@/models/PaybackTransaction';

// DELETE marks as paid back by deleting the record
export async function DELETE(request, { params }) {
  await connectToDatabase();
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  await PaybackTransaction.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
