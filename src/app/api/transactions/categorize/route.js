import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import BudgetCategory from "@/models/BudgetCategory";
import PendingTransaction from "@/models/PendingTransaction";
import OpenAI from "openai";

import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

export const runtime = "nodejs";

// create and init client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ZOD schema for openai response
// OUTPUT: { transactions: [ { transactionId: string, category: string | null, confidence: 0-1 } ] }
function buildOutputSchema(categoryNames) {
  const CategoryEnum =
    categoryNames.length > 0 ? z.enum(categoryNames) : z.never();

  // Structured Outputs requires all fields required. set confidence nullable.
  return z.object({
    transactions: z.array(
      z.object({
        transactionId: z.string(),
        category: categoryNames.length > 0 ? CategoryEnum.nullable() : z.null(),
        confidence: z.number().min(0).max(1).nullable(),
      })
    ),
  });
}

// Prepare transaction payload for OpenAI
function safeTxPayload(pendingTransactions) {
  return pendingTransactions.map((t) => ({
    transactionId: String(t.transactionId),
    description: (t.description ?? "").slice(0, 140),
    amount:
      typeof t.amount === "number"
        ? t.amount
        : Number.isFinite(Number(t.amount))
          ? Number(t.amount)
          : null,
    personal_finance_category: t.raw?.personal_finance_category ?? null,
  }));
}

export async function POST(request) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const userId = session.user.id;

    // Load user's custom categories e.g "Groceries", "Dining Out", "Transport"
    const budgetCategories = await BudgetCategory.find({ userId }).lean();
    const categoryNames = budgetCategories
      .map((c) => c.category)
      .filter((x) => typeof x === "string" && x.trim().length > 0);
    //if no categories, return early
    if (categoryNames.length === 0) {
      return NextResponse.json(
        { message: "No custom budget categories found for this user." },
        { status: 200 }
      );
    }

    // Load pending transactions (transactions needing categorization), limit to 50 most recent
    const pendingTransactions = await PendingTransaction.find({ userId })
      .sort({ date: -1 })
      .limit(50)
      .lean();

    if (pendingTransactions.length === 0) {
      return NextResponse.json(
        { message: "No pending transactions to categorize." },
        { status: 200 }
      );
    }
    // create ZOD schema based on categories
    const OutputSchema = buildOutputSchema(categoryNames);


    const systemInstructions = [
      "You are a personal finance categorization assistant.",
      "For each transaction, select the single best category from the provided categories list.",
      "If none fit, return category: null.",
      "Return a confidence score between 0 and 1; if unsure, return null.",
      "Use personal_finance_category only as a hint (it may be wrong).",
      "Return only the structured output that matches the schema.",
    ].join(" ");

    const payload = {
      categories: categoryNames,
      transactions: safeTxPayload(pendingTransactions),
    };

    // Send to OPENAI and wait for response
    const response = await openai.responses.parse({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemInstructions },
        { role: "user", content: JSON.stringify(payload) },
      ],
      text: {
        format: zodTextFormat(OutputSchema, "transaction_categorization"),
      },
      temperature: 0,
      store: false,
    });

    const parsed = response.output_parsed;

    // parsed is already schema-validated, keep a guard anyway
    if (!parsed || !Array.isArray(parsed.transactions)) {
      return NextResponse.json(
        { error: "Malformed OpenAI structured output." },
        { status: 500 }
      );
    }

    // Apply updates to DB in bulk
    const updateOps = parsed.transactions.map((tx) => ({
      updateOne: {
        filter: { transactionId: tx.transactionId, userId },
        update: {
          $set: {
            suggestedCategory: tx.category,
            suggestedCategoryConfidence: tx.confidence,
          },
        },
        upsert: false,
      },
    }));

    if (updateOps.length > 0) {
      await PendingTransaction.bulkWrite(updateOps, { ordered: false });
    }

    return NextResponse.json({
      suggested: updateOps.length,
      model: response.model ?? "gpt-4o-mini",
      request_id: response._request_id,
    });
  } catch (error) {
    console.error("Error categorizing transactions with OpenAI:", error);
    return NextResponse.json(
      { error: "Failed to categorize transactions." },
      { status: 500 }
    );
  }
}