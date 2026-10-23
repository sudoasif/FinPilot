import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store";
import { invoiceSubtotal, invoiceTax, invoiceTotal } from "@/lib/invoice";
import { todayISO } from "@/lib/utils";

function escapeCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number)[][]) {
  return rows
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type") ?? "transactions";
  const db = await readDb();
  const date = todayISO();

  if (type === "invoices") {
    const contactMap = new Map(
      db.contacts.map((contact) => [contact.id, contact]),
    );
    const rows: (string | number)[][] = [
      [
        "Invoice",
        "Customer",
        "Issue date",
        "Due date",
        "Status",
        "Subtotal",
        "GST",
        "Total",
      ],
      ...db.invoices.map((invoice) => [
        invoice.number,
        contactMap.get(invoice.contactId)?.name ?? "Deleted contact",
        invoice.issueDate,
        invoice.dueDate,
        invoice.status,
        invoiceSubtotal(invoice).toFixed(2),
        invoiceTax(invoice).toFixed(2),
        invoiceTotal(invoice).toFixed(2),
      ]),
    ];

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="finpilot-invoices-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const accountMap = new Map(
    db.accounts.map((account) => [account.id, account.name]),
  );
  const rows: (string | number)[][] = [
    [
      "Date",
      "Description",
      "Type",
      "Category",
      "Account",
      "Status",
      "Amount",
      "Reference",
      "Notes",
    ],
    ...[...db.transactions]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((transaction) => [
        transaction.date,
        transaction.description,
        transaction.type,
        transaction.category,
        accountMap.get(transaction.accountId) ?? "",
        transaction.status,
        transaction.amount.toFixed(2),
        transaction.reference ?? "",
        transaction.notes ?? "",
      ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finpilot-transactions-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
