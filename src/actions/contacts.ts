"use server";

import { z } from "zod";
import { revalidateFinance } from "@/lib/revalidate";
import { requireAuth } from "@/lib/session";
import { mutateDb } from "@/lib/store";
import { uid } from "@/lib/utils";
import type { ActionState } from "@/types";

const contactSchema = z.object({
  name: z.string().min(2, "Add the contact name").max(80),
  type: z.enum(["customer", "vendor"], { message: "Choose a contact type" }),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number").max(20),
  gstin: z.string().max(15).optional(),
  city: z.string().max(60).optional(),
});

export async function createContact(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    gstin: formData.get("gstin") || undefined,
    city: formData.get("city") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the contact details",
    };
  }

  const data = parsed.data;

  await mutateDb((db) => {
    db.contacts.unshift({
      id: uid("con"),
      name: data.name.trim(),
      type: data.type,
      email: data.email.trim(),
      phone: data.phone.trim(),
      gstin: data.gstin?.trim().toUpperCase(),
      city: data.city?.trim(),
      createdAt: new Date().toISOString(),
    });
  });

  revalidateFinance();
  return { ok: true, message: "Contact added" };
}

export async function deleteContact(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    const referenced =
      db.invoices.some((invoice) => invoice.contactId === id) ||
      db.transactions.some((transaction) => transaction.contactId === id);
    if (!referenced) {
      db.contacts = db.contacts.filter((contact) => contact.id !== id);
    }
  });

  revalidateFinance();
}
