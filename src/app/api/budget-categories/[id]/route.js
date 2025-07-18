import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import BudgetCategory from "@/models/BudgetCategory";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(request, context) {
  await connectToDatabase();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing Budget Category ID" },
      { status: 400 }
    );
  }

  try {
    await BudgetCategory.findByIdAndDelete(id);
    return NextResponse.json({ message: "Budget Category deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  await connectToDatabase();
  const { id } = await context.params;
  const body = await req.json();
  const { amount, category, description, date, isSubscription } = body;

  const existingCategory = await BudgetCategory.findById(id);
  if (!existingCategory) {
    return NextResponse.json(
      { error: "Budget Category not found" },
      { status: 404 }
    );
  }
  const oldCategoryName = existingCategory.category;

  try {
    const updatedBudgetCategory = await BudgetCategory.findByIdAndUpdate(
      id,
      { amount, category, description, date, isSubscription },
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

export async function GET(request, context) {
  await connectToDatabase();

  const params = await context.params;
  const { id } = params || {};

  if (!id) {
    return NextResponse.json(
      { error: "Missing Budget Category ID" },
      { status: 400 }
    );
  }

  // ----- Identify requesting user -----
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const category = await BudgetCategory.findOne({ _id: id, userId });

    if (!category) {
      return NextResponse.json(
        { error: "Budget Category not found" },
        { status: 404 }
      );
    }

    // Calculate spending history and stats for this user only
    const transactions = await Transaction.find({
      userId,
      category: category.category,
    });
    const spendingHistory = transactions.map((tx) => ({
      date: tx.date,
      amount: tx.amount,
    }));

    const weeklySpending = transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        const now = new Date();
        return txDate >= new Date(now.setDate(now.getDate() - 7));
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlySpending = transactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    return NextResponse.json({
      name: category.category,
      weeklySpending,
      monthlySpending,
      spendingHistory,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
