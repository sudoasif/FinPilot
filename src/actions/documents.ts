"use server";

import Papa from "papaparse";
import { revalidateFinance } from "@/lib/revalidate";
import { requireAuth } from "@/lib/session";
import { mutateDb, readDb } from "@/lib/store";
import { todayISO, uid } from "@/lib/utils";
import { ALL_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import type { ActionState, DocumentKind } from "@/types";

function documentKind(name: string): DocumentKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return "image";
  return "other";
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

function normalizeAmount(value: string) {
  const cleaned = value.replace(/[₹,\s]/g, "");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? Math.abs(amount) : null;
}

function normalizeType(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["income", "credit", "cr", "in", "receipt"].includes(normalized)) {
    return "income" as const;
  }
  if (["expense", "debit", "dr", "out", "payment"].includes(normalized)) {
    return "expense" as const;
  }
  return null;
}

export async function importDocument(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();

  const db = await readDb();
  if (!db.settings.enableDocumentImport) {
    return {
      ok: false,
      message: "Document import is turned off in Settings.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV or PDF file to upload." };
  }
  if (file.size > 2_000_000) {
    return { ok: false, message: "Keep uploads under 2 MB for this demo." };
  }

  const kind = documentKind(file.name);
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  const uploadedAt = todayISO();

  if (kind !== "csv") {
    await mutateDb((db) => {
      db.documents.unshift({
        id: uid("doc"),
        name: file.name,
        kind,
        sizeKb,
        uploadedAt,
        status: "stored",
        note:
          kind === "pdf"
            ? "PDF stored for records — CSV import is enabled in this demo."
            : "Stored for records. Only CSV transaction imports are parsed.",
      });
    });
    revalidateFinance();
    return {
      ok: true,
      message: `${file.name} stored. CSV files can be parsed into transactions.`,
    };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const required = ["date", "description", "amount"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return {
      ok: false,
      message: `CSV is missing ${missing.join(", ")}. Expected headers: date, description, amount, type, category.`,
    };
  }

  const result = await mutateDb((db) => {
    const account =
      db.accounts.find((item) => item.type !== "credit") ?? db.accounts[0];
    if (!account) {
      return { ok: false as const, message: "Add a bank account first." };
    }

    let imported = 0;
    let skipped = 0;

    for (const row of parsed.data) {
      const date = normalizeDate(String(row.date ?? ""));
      const amount = normalizeAmount(String(row.amount ?? ""));
      const description = String(row.description ?? "").trim();
      const rawType = String(row.type ?? "");
      const rawCategory = String(row.category ?? "").trim();
      const type =
        normalizeType(rawType) ??
        (INCOME_CATEGORIES.includes(rawCategory as (typeof INCOME_CATEGORIES)[number])
          ? ("income" as const)
          : ("expense" as const));

      if (!date || !amount || amount <= 0 || description.length < 2) {
        skipped += 1;
        continue;
      }

      const category = ALL_CATEGORIES.includes(
        rawCategory as (typeof ALL_CATEGORIES)[number],
      )
        ? rawCategory
        : type === "income"
          ? "Other Income"
          : "Office Supplies";

      db.transactions.unshift({
        id: uid("txn"),
        date,
        description,
        amount,
        type,
        category,
        accountId: account.id,
        status: "cleared",
        reference: "CSV import",
        createdAt: new Date().toISOString(),
      });
      imported += 1;
    }

    db.documents.unshift({
      id: uid("doc"),
      name: file.name,
      kind,
      sizeKb,
      uploadedAt,
      status: imported > 0 ? "processed" : "failed",
      importedCount: imported,
      note:
        imported > 0
          ? `${imported} transactions imported from bank statement`
          : "No valid rows found",
    });

    if (imported === 0) {
      return {
        ok: false as const,
        message:
          "No valid rows found. Check dates (YYYY-MM-DD or DD/MM/YYYY) and positive amounts.",
      };
    }

    return {
      ok: true as const,
      message: `Imported ${imported} transactions${skipped > 0 ? `, skipped ${skipped} invalid rows` : ""}.`,
    };
  });

  if (result.ok) revalidateFinance();
  return result;
}

export async function deleteDocument(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");

  await mutateDb((db) => {
    db.documents = db.documents.filter((document) => document.id !== id);
  });

  revalidateFinance();
}
