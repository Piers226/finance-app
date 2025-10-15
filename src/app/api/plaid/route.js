import { NextResponse } from "next/server";
import getPlaidClient from "@/lib/plaidClient";
import connectToDatabase from "@/lib/mongodb";
import PlaidTransaction from "@/models/PlaidTransaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const plaidClient = getPlaidClient();

export async function POST(request) {
  // Authenticate user
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Only allow actions for the logged-in user
  const { action, public_token, access_token, userId, institutionName } =
    await request.json();
  if (userId !== session.user.id) {
    return NextResponse.json(
      { error: "Forbidden: userId mismatch" },
      { status: 403 }
    );
  }

  // Step 1: Create link token
  if (action === "create_link_token") {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId || "anonymous" },
      client_name: "My Budget Tracker",
      products: [process.env.PLAID_PRODUCTS],
      country_codes: [process.env.PLAID_COUNTRY_CODES],
      language: "en",
    });
    return NextResponse.json(response.data);
  }

  // Step 2: Exchange public token for access token
  if (action === "exchange_public_token") {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    // Save access_token to user in DB
    const User = (await import("@/models/User")).default;
    const existingUser = await User.findById(userId);
    // Limit 1 bank account per user, for now, checks if they already have linked one before
    if (existingUser?.bankLinked) {
      return NextResponse.json(
        { error: "Bank account already linked, Limit 1 bank account per user" },
        { status: 400 }
      );
    }
    await User.findByIdAndUpdate(userId, {
      plaidAccessToken: response.data.access_token,
      plaidItemId: response.data.item_id,
      plaidCursor: null, // reset sync cursor
      bankLinked: true,
      bankName: institutionName || "",
    });
    return NextResponse.json({ access_token: response.data.access_token });
  }

  // Step 3: Transaction sync. Uses stored cursor for incremental syncs.
  if (action === "get_transactions") {
    try {
      await connectToDatabase();
      let at = access_token;
      let cursor = null;

      // Fetch user's access token and cursor if not provided
      const User = (await import("@/models/User")).default;
      const u = await User.findById(userId);
      if (!at) {
        if (!u?.plaidAccessToken) {
          return NextResponse.json(
            { error: "No access token" },
            { status: 400 }
          );
        }
        at = u.plaidAccessToken;
      }
      // Use stored cursor if available, otherwise null for initial sync
      if (u?.plaidCursor) {
        cursor = u.plaidCursor;
      }

      // Sync transactions from Plaid using cursor
      const response = await plaidClient.transactionsSync({
        access_token: at,
        cursor: cursor,
      });
      const { added = [], next_cursor } = response.data;

      if (added.length) {
        const docs = added.map((tx) => ({
          userId,
          transactionId: tx.transaction_id,
          amount: tx.amount,
          date: new Date(tx.authorized_date || tx.date),
          description: tx.merchant_name || tx.name,
          category: tx.personal_finance_category?.primary
            ? `${tx.personal_finance_category.primary}.${tx.personal_finance_category.detailed}`
            : tx.category?.[0] || "Other",
          raw: tx,
        }));
        const ops = docs.map((d) => ({
          updateOne: {
            filter: { transactionId: d.transactionId },
            update: d,
            upsert: true,
          },
        }));
        await PlaidTransaction.bulkWrite(ops);
      }

      // Persist the new cursor for future syncs
      if (u) {
        u.plaidCursor = next_cursor;
        await u.save();
      }

      return NextResponse.json({ imported: added.length });
    } catch (err) {
      console.error("Plaid transactionsSync error", err.response?.data || err);
      return NextResponse.json(
        { error: err.response?.data || "Plaid error" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
