import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import BudgetCategory from "@/models/BudgetCategory";
import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/mongodb";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  const { messages } = await request.json();

  await connectToDatabase();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch user and check chatCount
  const User = (await import("@/models/User")).default;
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.chatCount <= 0) {
    return NextResponse.json(
      { error: "Chat limit reached. You have no prompts left." },
      { status: 403 }
    );
  }

  // Subtract 1 from chatCount
  user.chatCount -= 1;
  await user.save();

  const categories = await BudgetCategory.find({ userId }).lean();
  const categoryNames = categories.map((cat) => cat.category);

  if (categoryNames.length === 0) {
    return NextResponse.json(
      { error: "No budget categories found. Please create categories first." },
      { status: 400 }
    );
  }

  const transactions = await Transaction.find({ userId })
    .sort({ date: -1 })
    .limit(50)
    .lean();
  const transactionSummary = transactions
    .map((tx) => {
      const date = new Date(tx.date).toISOString().slice(0, 10);
      return `${date}: $${tx.amount} - ${tx.category} (${
        tx.description || "No description"
      })`;
    })
    .join("\n");

  const systemMessage = {
    role: "system",
    content: `The user has the following budget categories: ${categoryNames.join(
      ", "
    )}.\n\nRecent transactions:\n${
      transactionSummary || "No transactions yet."
    }\n\nUse this information to assist with any queries or transaction logging.`,
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [systemMessage, ...messages],
    tools: [
      {
        type: "function",
        function: {
          name: "add_transaction",
          description: "Create a new budget transaction",
          parameters: {
            type: "object",
            properties: {
              amount: {
                type: "number",
                description: "Transaction amount in USD",
              },
              category: {
                type: "string",
                description: `Budget category name. Must be one of: ${categoryNames.join(
                  ", "
                )}`,
                enum: categoryNames,
              },
              description: { type: "string", description: "Optional notes" },
              date: {
                type: "string",
                format: "date",
                description: "YYYY-MM-DD",
              },
            },
            required: ["amount", "category"],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  const msg = completion.choices[0].message;

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    for (const toolCall of msg.tool_calls) {
      if (toolCall.function.name === "add_transaction") {
        const args = JSON.parse(toolCall.function.arguments);

        await fetch(`${process.env.NEXTAUTH_URL}/api/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            amount: args.amount,
            category: args.category,
            description: args.description,
            date: args.date || new Date().toISOString().slice(0, 10),
          }),
        });

        return NextResponse.json({
          role: "assistant",
          content: `✔️ Logged $${args.amount} to “${args.category}”`,
        });
      }
    }
  }

  return NextResponse.json(msg);
}
