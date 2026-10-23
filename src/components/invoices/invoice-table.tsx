"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  deleteInvoice,
  markInvoicePaid,
  sendInvoice,
} from "@/actions/invoices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { effectiveInvoiceStatus, invoiceTotal } from "@/lib/invoice";
import { formatDate, formatINR } from "@/lib/format";
import type { Contact, Invoice } from "@/types";

const PAGE_SIZE = 8;

const STATUS_VARIANT = {
  paid: "success",
  sent: "info",
  overdue: "danger",
  draft: "secondary",
} as const;

export function InvoiceTable({
  invoices,
  contacts,
  today,
}: {
  invoices: Invoice[];
  contacts: Contact[];
  today: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Invoice["status"]>("all");
  const [page, setPage] = useState(1);

  const contactMap = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...invoices]
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
      .filter((invoice) => {
        const effective = effectiveInvoiceStatus(invoice, today);
        if (status !== "all" && effective !== status) return false;
        if (!search) return true;
        const customer = contactMap.get(invoice.contactId)?.name ?? "";
        return (
          invoice.number.toLowerCase().includes(search) ||
          customer.toLowerCase().includes(search)
        );
      });
  }, [contactMap, invoices, query, status, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const tabs: { key: "all" | Invoice["status"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "sent", label: "Open" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
    { key: "draft", label: "Draft" },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  status === tab.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search invoice or customer…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="m-4 border-0 bg-transparent"
            icon={<FileText className="size-4" />}
            title="No invoices here"
            description="Create an invoice to start tracking receivables and GST."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Issued</th>
                  <th className="px-4 py-2.5 font-medium">Due</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((invoice) => {
                  const effective = effectiveInvoiceStatus(invoice, today);
                  const customer = contactMap.get(invoice.contactId);
                  const overdueDays =
                    effective === "overdue"
                      ? Math.floor(
                          (new Date(`${today}T12:00:00`).getTime() -
                            new Date(`${invoice.dueDate}T12:00:00`).getTime()) /
                            86400000,
                        )
                      : 0;

                  return (
                    <tr
                      key={invoice.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                        {invoice.number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {customer?.name ?? "Deleted contact"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {customer?.city ?? customer?.email ?? ""}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-slate-500">
                          {formatDate(invoice.dueDate)}
                        </p>
                        {overdueDays > 0 ? (
                          <p className="text-[10px] font-medium text-rose-500">
                            {overdueDays} days late
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[effective]}>
                          {effective}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                        {formatINR(invoiceTotal(invoice))}
                        <p className="text-[10px] font-normal text-slate-400">
                          incl. GST
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {effective === "draft" ? (
                            <form action={sendInvoice}>
                              <input
                                type="hidden"
                                name="id"
                                value={invoice.id}
                              />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon-sm"
                                title="Mark as sent"
                                className="text-slate-400 hover:bg-sky-50 hover:text-sky-600"
                              >
                                <Send className="size-3.5" />
                              </Button>
                            </form>
                          ) : null}
                          {effective !== "paid" && effective !== "draft" ? (
                            <form action={markInvoicePaid}>
                              <input
                                type="hidden"
                                name="id"
                                value={invoice.id}
                              />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon-sm"
                                title="Mark as paid"
                                className="text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                              >
                                <CheckCircle2 className="size-3.5" />
                              </Button>
                            </form>
                          ) : null}
                          <form
                            action={deleteInvoice}
                            onSubmit={(event) => {
                              if (
                                !window.confirm(
                                  `Delete ${invoice.number}? This cannot be undone.`,
                                )
                              ) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <input
                              type="hidden"
                              name="id"
                              value={invoice.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon-sm"
                              title="Delete invoice"
                              className="text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
          <span>
            {filtered.length} invoice{filtered.length === 1 ? "" : "s"} · page{" "}
            {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
