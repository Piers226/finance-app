
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.chatCount > 0) {
      user.chatCount -= 1;
      await user.save();
    }

    return NextResponse.json({ chatCount: user.chatCount });
  } catch (error) {
    console.error('Error decrementing user chat count:', error);
    return NextResponse.json({ error: 'Failed to decrement chat count.' }, { status: 500 });
  }
}
