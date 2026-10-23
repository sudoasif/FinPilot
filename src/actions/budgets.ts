"use server";

import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { revalidateFinance } from "@/lib/revalidate";
import { requireAuth } from "@/lib/session";
import { mutateDb } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { ActionState } from "@/types";

const budgetSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { message: "Choose a category" }),
  monthlyLimit: z.coerce
    .number()
    .positive("Budget must be greater than zero")
    .max(100_000_000),
});

export async function saveBudget(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();

  const parsed = budgetSchema.safeParse({
    category: formData.get("category"),
    monthlyLimit: formData.get("monthlyLimit"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the budget details",
    };
  }

  const { category, monthlyLimit } = parsed.data;

  await mutateDb((db) => {
    const existing = db.budgets.find((budget) => budget.category === category);
    if (existing) {
      existing.monthlyLimit = monthlyLimit;
    } else {
      db.budgets.push({ id: uid("bud"), category, monthlyLimit });
    }
  });

  revalidateFinance();
  return { ok: true, message: `${category} budget saved` };
}

export async function deleteBudget(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    db.budgets = db.budgets.filter((budget) => budget.id !== id);
  });

  revalidateFinance();
}
