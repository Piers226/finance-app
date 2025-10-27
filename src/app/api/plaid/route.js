import { NextResponse } from "next/server";
import getPlaidClient from "@/lib/plaidClient";
import connectToDatabase from "@/lib/mongodb";
import PlaidTransaction from "@/models/PlaidTransaction";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const plaidClient = getPlaidClient();

// Helper function to sync transactions
async function syncTransactions(userId, accessToken, cursor) {
  let newCursor = cursor;
  let added = [];
  let modified = [];
  let removed = [];
  let hasMore = true;

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: newCursor,
    });

    added = added.concat(response.data.added);
    modified = modified.concat(response.data.modified);
    removed = removed.concat(response.data.removed);
    hasMore = response.data.has_more;
    newCursor = response.data.next_cursor;
  }

  console.log(`Syncing transactions for user ${userId}. Added: ${added.length}, Modified: ${modified.length}, Removed: ${removed.length}`);

  // Process added transactions
  if (added.length > 0) {
    const addedOps = added.map((tx) => ({
      updateOne: {
        filter: { transactionId: tx.transaction_id },
        update: {
          userId,
          transactionId: tx.transaction_id,
          amount: tx.amount,
          date: new Date(tx.authorized_date || tx.date),
          description: tx.merchant_name || tx.name,
          category: tx.personal_finance_category?.primary
            ? `${tx.personal_finance_category.primary}.${tx.personal_finance_category.detailed}`
            : tx.category?.[0] || "Other",
          raw: tx,
        },
        upsert: true,
      },
    }));
    await PlaidTransaction.bulkWrite(addedOps);
  }

  // Process modified transactions
  if (modified.length > 0) {
    const modifiedOps = modified.map((tx) => ({
      updateOne: {
        filter: { transactionId: tx.transaction_id },
        update: {
          amount: tx.amount,
          date: new Date(tx.authorized_date || tx.date),
          description: tx.merchant_name || tx.name,
          category: tx.personal_finance_category?.primary
            ? `${tx.personal_finance_category.primary}.${tx.personal_finance_category.detailed}`
            : tx.category?.[0] || "Other",
          raw: tx,
        },
      },
    }));
    await PlaidTransaction.bulkWrite(modifiedOps);
  }

  // Process removed transactions
  if (removed.length > 0) {
    const removedOps = removed.map((tx) => ({
      deleteOne: {
        filter: { transactionId: tx.transaction_id },
      },
    }));
    await PlaidTransaction.bulkWrite(removedOps);
  }

  return { newCursor, added: added.length, modified: modified.length, removed: removed.length };
}

export async function POST(request) {
  await connectToDatabase();
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, public_token, userId, institutionName } = await request.json();

  if (userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden: userId mismatch" }, { status: 403 });
  }

  if (action === "create_link_token") {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "My Budget Tracker",
      products: (process.env.PLAID_PRODUCTS || 'transactions').split(','),
      country_codes: (process.env.PLAID_COUNTRY_CODES || 'US').split(','),
      language: "en",
    });
    return NextResponse.json(response.data);
  }

  if (action === "exchange_public_token") {
    try {
      const existingUser = await User.findById(userId);
      if (existingUser?.bankLinked) {
        return NextResponse.json({ error: "Bank account already linked." }, { status: 400 });
      }

      const response = await plaidClient.itemPublicTokenExchange({ public_token });
      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

      // Perform initial transaction sync
      const { newCursor, added } = await syncTransactions(userId, accessToken, null);

      await User.findByIdAndUpdate(userId, {
        plaidAccessToken: accessToken,
        plaidItemId: itemId,
        plaidCursor: newCursor,
        bankLinked: true,
        bankName: institutionName || "",
      });

      return NextResponse.json({ success: true, initial_import: added });
    } catch (err) {
      console.error("Plaid exchange_public_token error", err.response?.data || err);
      return NextResponse.json({ error: "Could not link account." }, { status: 500 });
    }
  }

  if (action === "sync_transactions") {
    try {
      const user = await User.findById(userId);
      if (!user || !user.plaidAccessToken) {
        return NextResponse.json({ error: "No access token found for user." }, { status: 400 });
      }

      const { newCursor, added, modified, removed } = await syncTransactions(userId, user.plaidAccessToken, user.plaidCursor);

      user.plaidCursor = newCursor;
      await user.save();

      return NextResponse.json({ success: true, added, modified, removed });
    } catch (err) {
      console.error("Plaid sync_transactions error", err.response?.data || err);
      return NextResponse.json({ error: "Transaction sync failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}