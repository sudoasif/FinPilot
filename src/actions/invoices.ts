"use server";

import { z } from "zod";
import { revalidateFinance } from "@/lib/revalidate";
import { requireAuth } from "@/lib/session";
import { mutateDb } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { ActionState } from "@/types";

const invoiceSchema = z.object({
  contactId: z.string().min(1, "Choose a customer"),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an issue date"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date"),
  status: z.enum(["draft", "sent"]),
  itemDescription: z
    .string()
    .min(2, "Describe the work or product")
    .max(160, "Keep the line item under 160 characters"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  rate: z.coerce.number().positive("Rate must be positive"),
  gstRate: z.coerce.number().min(0).max(28),
  notes: z.string().max(500).optional(),
});

export async function createInvoice(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();

  const parsed = invoiceSchema.safeParse({
    contactId: formData.get("contactId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status") ?? "draft",
    itemDescription: formData.get("itemDescription"),
    quantity: formData.get("quantity") ?? 1,
    rate: formData.get("rate"),
    gstRate: formData.get("gstRate") ?? 18,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the invoice details",
    };
  }

  const data = parsed.data;

  const result = await mutateDb((db) => {
    if (!db.contacts.some((contact) => contact.id === data.contactId)) {
      return { ok: false as const, message: "Customer not found" };
    }

    const year = new Date(data.issueDate).getFullYear();
    const prefix = db.settings.invoicePrefix || "INV";
    const numbers = db.invoices
      .map((invoice) => {
        const match = invoice.number.match(/(\d+)$/);
        return match ? Number(match[1]) : 0;
      })
      .filter((value) => Number.isFinite(value));
    const next = Math.max(0, ...numbers) + 1;

    db.invoices.unshift({
      id: uid("inv"),
      number: `${prefix}-${year}-${String(next).padStart(3, "0")}`,
      contactId: data.contactId,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: data.status,
      items: [
        {
          description: data.itemDescription.trim(),
          quantity: data.quantity,
          rate: data.rate,
          gstRate: data.gstRate,
        },
      ],
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });

    return { ok: true as const, message: "Invoice created" };
  });

  if (!result.ok) return result;

  revalidateFinance();
  return result;
}

export async function markInvoicePaid(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    const invoice = db.invoices.find((item) => item.id === id);
    if (invoice) invoice.status = "paid";
  });

  revalidateFinance();
}

export async function sendInvoice(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    const invoice = db.invoices.find((item) => item.id === id);
    if (invoice && invoice.status === "draft") invoice.status = "sent";
  });

  revalidateFinance();
}

export async function deleteInvoice(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    db.invoices = db.invoices.filter((invoice) => invoice.id !== id);
  });

  revalidateFinance();
}
