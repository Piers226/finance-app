import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import BudgetCategory from '@/models/BudgetCategory';
import Transaction from '@/models/Transaction';

export async function DELETE(request, context) {
  await connectToDatabase();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing Budget Category ID' }, { status: 400 });
  }

  try {
    await BudgetCategory.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Budget Category deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  await connectToDatabase();
  const { id } = await context.params;
  const body = await req.json();
  const { amount, category, description, date } = body;

  const existingCategory = await BudgetCategory.findById(id);
  if (!existingCategory) {
    return NextResponse.json({ error: 'Budget Category not found' }, { status: 404 });
  }
  const oldCategoryName = existingCategory.category;

  try {
    const updatedBudgetCategory = await BudgetCategory.findByIdAndUpdate(
      id,
      { amount, category, description, date },
      { new: true }
    );

    // Update any transactions that used the old category name
    await Transaction.updateMany(
      { userId: updatedBudgetCategory.userId, category: oldCategoryName },
      { category: updatedBudgetCategory.category }
    );

    return NextResponse.json(updatedBudgetCategory);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}