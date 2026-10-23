"use server";

import { z } from "zod";
import { revalidateFinance } from "@/lib/revalidate";
import { requireAuth } from "@/lib/session";
import { mutateDb, resetDb } from "@/lib/store";
import type { ActionState } from "@/types";

const settingsSchema = z.object({
  businessName: z.string().min(2, "Add a business name").max(80),
  legalName: z.string().min(2, "Add the legal name").max(120),
  gstin: z.string().max(15).optional(),
  pan: z.string().max(10).optional(),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number").max(20),
  address: z.string().max(240).optional(),
  invoicePrefix: z
    .string()
    .min(2, "Use at least 2 characters")
    .max(8, "Keep the prefix under 8 characters"),
  paymentTermsDays: z.coerce.number().int().min(1).max(90),
  financialYearStart: z
    .string()
    .regex(/^\d{2}-\d{2}$/, "Use MM-DD format"),
});

export async function updateSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();

  const parsed = settingsSchema.safeParse({
    businessName: formData.get("businessName"),
    legalName: formData.get("legalName"),
    gstin: formData.get("gstin") || undefined,
    pan: formData.get("pan") || undefined,
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") || undefined,
    invoicePrefix: formData.get("invoicePrefix"),
    paymentTermsDays: formData.get("paymentTermsDays"),
    financialYearStart: formData.get("financialYearStart"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the settings",
    };
  }

  const data = parsed.data;

  await mutateDb((db) => {
    Object.assign(db.settings, {
      businessName: data.businessName.trim(),
      legalName: data.legalName.trim(),
      gstin: data.gstin?.trim().toUpperCase() ?? "",
      pan: data.pan?.trim().toUpperCase() ?? "",
      email: data.email.trim(),
      phone: data.phone.trim(),
      address: data.address?.trim() ?? "",
      invoicePrefix: data.invoicePrefix.trim().toUpperCase(),
      paymentTermsDays: data.paymentTermsDays,
      financialYearStart: data.financialYearStart,
      enableAiInsights: formData.get("enableAiInsights") === "on",
      enableCopilot: formData.get("enableCopilot") === "on",
      enableDocumentImport: formData.get("enableDocumentImport") === "on",
    });
  });

  revalidateFinance();
  return { ok: true, message: "Workspace settings saved" };
}

export async function resetDemoData() {
  await requireAuth();
  await resetDb();
  revalidateFinance();
}
