import { todayISO } from "@/lib/utils";
import type { Invoice, InvoiceItem } from "@/types";

export function itemSubtotal(item: InvoiceItem) {
  return item.quantity * item.rate;
}

export function itemTax(item: InvoiceItem) {
  return itemSubtotal(item) * (item.gstRate / 100);
}

export function invoiceSubtotal(invoice: Invoice) {
  return invoice.items.reduce((sum, item) => sum + itemSubtotal(item), 0);
}

export function invoiceTax(invoice: Invoice) {
  return invoice.items.reduce((sum, item) => sum + itemTax(item), 0);
}

export function invoiceTotal(invoice: Invoice) {
  return invoiceSubtotal(invoice) + invoiceTax(invoice);
}

export function effectiveInvoiceStatus(
  invoice: Invoice,
  today = todayISO(),
): Invoice["status"] {
  if (invoice.status === "sent" && invoice.dueDate < today) {
    return "overdue";
  }
  return invoice.status;
}
