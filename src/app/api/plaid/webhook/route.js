import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  const body = await request.json();
  // Only interested in TRANSACTIONS sync notification
  if (body.webhook_type !== "TRANSACTIONS" || body.webhook_code !== "SYNC_UPDATES_AVAILABLE") {
    return NextResponse.json({ status: "ignored" });
  }

  const { item_id } = body;
  if (!item_id) return NextResponse.json({ error: "item_id missing" }, { status: 400 });

  await connectToDatabase();
  const user = await User.findOne({ plaidItemId: item_id });
  if (!user) {
    return NextResponse.json({ error: "User not found for item_id" }, { status: 404 });
  }

  // Trigger internal sync for this user
  await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/plaid/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user._id.toString() }),
  });

  return NextResponse.json({ status: "sync triggered" });
}
