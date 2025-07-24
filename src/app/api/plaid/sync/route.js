import { NextResponse } from "next/server";
import getPlaidClient from "@/lib/plaidClient";
import connectToDatabase from "@/lib/mongodb";
import PendingTransaction from "@/models/PendingTransaction";
import User from "@/models/User";

// Obtain singleton Plaid client
const plaidClient = getPlaidClient();

// POST /api/plaid/sync  { userId }
export async function POST(request) {
  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(userId);
  if (!user?.plaidAccessToken) {
    return NextResponse.json({ error: "User has no Plaid access token" }, { status: 400 });
  }

  try {
    let cursor = user.plaidCursor || null;
    let totalAdded = 0;

    // Retrieve only the most recent 20 transactions since the last cursor
    const resp = await plaidClient.transactionsSync({
      access_token: user.plaidAccessToken,
      cursor,
      count: 20,
    });

    const { added = [], removed = [], next_cursor } = resp.data;

      // Upsert new or updated transactions
      if (added.length) {
        const docs = added.map((tx) => ({
          userId: user._id,
          transactionId: tx.transaction_id,
          amount: tx.amount,
          date: new Date(tx.authorized_date || tx.date),
          description: tx.merchant_name || tx.name,
          originalCategory: tx.personal_finance_category?.primary
            ? `${tx.personal_finance_category.primary}.${tx.personal_finance_category.detailed}`
            : tx.category?.[0] || "Other",
        }));

        const operations = docs.map((d) => ({
          updateOne: {
            filter: { transactionId: d.transactionId },
            update: d,
            upsert: true,
          },
        }));
        await PendingTransaction.bulkWrite(operations);
        totalAdded += docs.length;
      }

      // Delete removed transactions
      if (removed.length) {
        const ids = removed.map((r) => r.transaction_id);
        await PendingTransaction.deleteMany({ transactionId: { $in: ids } });
      }

      // update cursor to latest position for next incremental call
      cursor = next_cursor;

      // Persist cursor for next sync
      user.plaidCursor = cursor;
      await user.save();

      return NextResponse.json({ addedCount: totalAdded });
  } 
  catch (err) {
    console.error("Plaid sync error", err.response?.data || err);
    return NextResponse.json({ error: "Plaid sync failed" }, { status: 500 });
  }
}
