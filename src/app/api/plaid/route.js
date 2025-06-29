import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(config);

export async function POST(request) {
  const { action, public_token, access_token, userId } = await request.json();

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

  if (action === "exchange_public_token") {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    // Save access_token to user in DB
    const User = (await import("@/models/User")).default;
    await User.findByIdAndUpdate(userId, {
      plaidAccessToken: response.data.access_token,
      bankLinked: true,
    });
    return NextResponse.json({ access_token: response.data.access_token });
  }

  if (action === "get_transactions") {
    try {
      const response = await plaidClient.transactionsSync({
        access_token,
        cursor: null, // initial pull
        count: 100,
      });
      return NextResponse.json(response.data);
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
