"use server";

import { z } from "zod";
import { revalidateFinance } from "@/lib/revalidate";
import { requireAuth } from "@/lib/session";
import { mutateDb } from "@/lib/store";
import { uid } from "@/lib/utils";
import { ALL_CATEGORIES } from "@/lib/categories";
import type { ActionState } from "@/types";

const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
  description: z
    .string()
    .min(2, "Add a short description")
    .max(120, "Keep the description under 120 characters"),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(1_000_000_000, "Amount is too large"),
  type: z.enum(["income", "expense"], { message: "Choose income or expense" }),
  category: z.enum(ALL_CATEGORIES, { message: "Choose a category" }),
  accountId: z.string().min(1, "Choose an account"),
  status: z.enum(["cleared", "pending"]).default("cleared"),
  reference: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

export async function createTransaction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();

  const parsed = transactionSchema.safeParse({
    date: formData.get("date"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    category: formData.get("category"),
    accountId: formData.get("accountId"),
    status: formData.get("status") ?? "cleared",
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the transaction details",
    };
  }

  const data = parsed.data;

  await mutateDb((db) => {
    if (!db.accounts.some((account) => account.id === data.accountId)) {
      throw new Error("Account not found");
    }
    db.transactions.unshift({
      id: uid("txn"),
      date: data.date,
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      category: data.category,
      accountId: data.accountId,
      status: data.status,
      reference: data.reference,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
  });

  revalidateFinance();
  return { ok: true, message: "Transaction added" };
}

export async function toggleTransactionStatus(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    const transaction = db.transactions.find((item) => item.id === id);
    if (transaction) {
      transaction.status =
        transaction.status === "cleared" ? "pending" : "cleared";
    }
  });

  revalidateFinance();
}

export async function deleteTransaction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    db.transactions = db.transactions.filter((item) => item.id !== id);
  });

  revalidateFinance();
}
