"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Trash2,
} from "lucide-react";
import {
  deleteTransaction,
  toggleTransactionStatus,
} from "@/actions/transactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { formatDate, formatINR } from "@/lib/format";
import type { BankAccount, Transaction } from "@/types";

const PAGE_SIZE = 10;

export function TransactionTable({
  transactions,
  accounts,
}: {
  transactions: Transaction[];
  accounts: BankAccount[];
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState("all");
  const [account, setAccount] = useState("all");
  const [page, setPage] = useState(1);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );

  const categories = useMemo(
    () => [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
    [],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...transactions]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      )
      .filter((transaction) => {
        if (type !== "all" && transaction.type !== type) return false;
        if (category !== "all" && transaction.category !== category) return false;
        if (account !== "all" && transaction.accountId !== account) return false;
        if (!search) return true;
        return (
          transaction.description.toLowerCase().includes(search) ||
          transaction.category.toLowerCase().includes(search) ||
          (transaction.reference ?? "").toLowerCase().includes(search)
        );
      });
  }, [account, category, query, transactions, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const totals = useMemo(() => {
    const income = filtered
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = filtered
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  const resetFilters = () => {
    setQuery("");
    setType("all");
    setCategory("all");
    setAccount("all");
    setPage(1);
  };

  const filtersActive =
    query !== "" || type !== "all" || category !== "all" || account !== "all";

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search description, category or reference…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(["all", "income", "expense"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setType(option);
                      setPage(1);
                    }}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                      type === option
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="w-auto min-w-36"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select
                value={account}
                onChange={(event) => {
                  setAccount(event.target.value);
                  setPage(1);
                }}
                className="w-auto min-w-36"
                aria-label="Filter by account"
              >
                <option value="all">All accounts</option>
                {accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              {filtersActive ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-500">
            <span>
              {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
            </span>
            <span>
              In <span className="font-medium text-emerald-600">{formatINR(totals.income)}</span>
            </span>
            <span>
              Out <span className="font-medium text-rose-600">{formatINR(totals.expenses)}</span>
            </span>
            <span>
              Net{" "}
              <span
                className={`font-medium ${
                  totals.net >= 0 ? "text-slate-900" : "text-rose-600"
                }`}
              >
                {formatINR(totals.net)}
              </span>
            </span>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            className="m-4 border-0 bg-transparent"
            icon={<ArrowLeftRight className="size-4" />}
            title="No transactions match those filters"
            description="Try clearing search or choosing a different category."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Account</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visible.map((transaction) => {
                  const accountInfo = accountMap.get(transaction.accountId);
                  return (
                    <tr
                      key={transaction.id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {transaction.description}
                        </p>
                        {transaction.reference ? (
                          <p className="text-[10px] text-slate-400">
                            {transaction.reference}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{transaction.category}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {accountInfo?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleTransactionStatus}>
                          <input type="hidden" name="id" value={transaction.id} />
                          <button
                            type="submit"
                            title="Toggle cleared / pending"
                            className="inline-flex"
                          >
                            <Badge
                              variant={
                                transaction.status === "cleared"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {transaction.status === "cleared" ? (
                                <CheckCircle2 className="size-2.5" />
                              ) : (
                                <Clock className="size-2.5" />
                              )}
                              {transaction.status}
                            </Badge>
                          </button>
                        </form>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                          transaction.type === "income"
                            ? "text-emerald-600"
                            : "text-slate-900"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatINR(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form
                          action={deleteTransaction}
                          onSubmit={(event) => {
                            if (
                              !window.confirm(
                                "Delete this transaction? This cannot be undone.",
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                          className="inline-flex"
                        >
                          <input type="hidden" name="id" value={transaction.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            className="text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
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
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
