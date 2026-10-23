import {
  effectiveInvoiceStatus,
  invoiceTotal,
} from "@/lib/invoice";
import { monthKey, todayISO } from "@/lib/utils";
import type {
  BudgetStatus,
  CategorySlice,
  Database,
  InvoiceStats,
  MonthlyPoint,
} from "@/types";

function monthStart(offset = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
}

function inMonth(iso: string, key: string) {
  return monthKey(iso) === key;
}

export function getMonthlySeries(db: Database, months = 6): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = monthStart(-offset);
    const key = monthKey(date);
    const rows = db.transactions.filter((txn) => inMonth(txn.date, key));
    const income = rows
      .filter((txn) => txn.type === "income")
      .reduce((sum, txn) => sum + txn.amount, 0);
    const expenses = rows
      .filter((txn) => txn.type === "expense")
      .reduce((sum, txn) => sum + txn.amount, 0);
    points.push({
      month: key,
      label: monthLabel(date),
      income,
      expenses,
      profit: income - expenses,
    });
  }
  return points;
}

export function getCashBalance(db: Database) {
  return db.accounts.reduce((sum, account) => sum + account.balance, 0);
}

export function getLiquidBalance(db: Database) {
  return db.accounts
    .filter((account) => account.type !== "credit")
    .reduce((sum, account) => sum + account.balance, 0);
}

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export interface Kpis {
  income: number;
  expenses: number;
  profit: number;
  margin: number;
  cash: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  savingsRate: number;
  incomeChange: number;
  expenseChange: number;
  profitChange: number;
  runwayMonths: number;
}

export function getKpis(db: Database): Kpis {
  const currentKey = monthKey(new Date());
  const previousKey = monthKey(monthStart(-1));

  const current = db.transactions.filter((txn) => inMonth(txn.date, currentKey));
  const previous = db.transactions.filter((txn) =>
    inMonth(txn.date, previousKey),
  );

  const income = current
    .filter((txn) => txn.type === "income")
    .reduce((sum, txn) => sum + txn.amount, 0);
  const expenses = current
    .filter((txn) => txn.type === "expense")
    .reduce((sum, txn) => sum + txn.amount, 0);
  const previousIncome = previous
    .filter((txn) => txn.type === "income")
    .reduce((sum, txn) => sum + txn.amount, 0);
  const previousExpenses = previous
    .filter((txn) => txn.type === "expense")
    .reduce((sum, txn) => sum + txn.amount, 0);

  const stats = getInvoiceStats(db);
  const profit = income - expenses;
  const averageExpenses =
    getMonthlySeries(db, 3).reduce((sum, point) => sum + point.expenses, 0) / 3;

  return {
    income,
    expenses,
    profit,
    margin: income > 0 ? (profit / income) * 100 : 0,
    cash: getCashBalance(db),
    outstanding: stats.outstanding,
    overdueAmount: stats.overdue,
    overdueCount: stats.overdueCount,
    savingsRate: income > 0 ? (profit / income) * 100 : 0,
    incomeChange: change(income, previousIncome),
    expenseChange: change(expenses, previousExpenses),
    profitChange: change(profit, previousIncome - previousExpenses),
    runwayMonths: averageExpenses > 0 ? getLiquidBalance(db) / averageExpenses : 0,
  };
}

export function getCategoryBreakdown(
  db: Database,
  limit = 6,
): CategorySlice[] {
  const key = monthKey(new Date());
  const rows = db.transactions.filter(
    (txn) => txn.type === "expense" && inMonth(txn.date, key),
  );
  const totals = new Map<string, number>();
  for (const txn of rows) {
    totals.set(txn.category, (totals.get(txn.category) ?? 0) + txn.amount);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const sorted = [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (sorted.length <= limit) return sorted;
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const restTotal = rest.reduce((sum, slice) => sum + slice.amount, 0);
  return [
    ...head,
    {
      category: "Other",
      amount: restTotal,
      share: total > 0 ? (restTotal / total) * 100 : 0,
    },
  ];
}

export function getInvoiceStats(db: Database): InvoiceStats {
  const stats: InvoiceStats = {
    total: 0,
    paid: 0,
    outstanding: 0,
    overdue: 0,
    draft: 0,
    paidCount: 0,
    openCount: 0,
    overdueCount: 0,
  };

  for (const invoice of db.invoices) {
    const status = effectiveInvoiceStatus(invoice);
    const total = invoiceTotal(invoice);
    stats.total += total;
    if (status === "paid") {
      stats.paid += total;
      stats.paidCount += 1;
    } else if (status === "draft") {
      stats.draft += total;
    } else {
      stats.outstanding += total;
      stats.openCount += 1;
      if (status === "overdue") {
        stats.overdue += total;
        stats.overdueCount += 1;
      }
    }
  }

  return stats;
}

export function getBudgetStatuses(db: Database): BudgetStatus[] {
  const key = monthKey(new Date());
  return db.budgets
    .map((budget) => {
      const spent = db.transactions
        .filter(
          (txn) =>
            txn.type === "expense" &&
            txn.category === budget.category &&
            inMonth(txn.date, key),
        )
        .reduce((sum, txn) => sum + txn.amount, 0);
      const percent =
        budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
      return {
        budget,
        spent,
        remaining: budget.monthlyLimit - spent,
        percent,
        state:
          percent > 100 ? "over" : percent >= 80 ? "warning" : "healthy",
      } as BudgetStatus;
    })
    .sort((a, b) => b.percent - a.percent);
}

export function getRecentTransactions(db: Database, limit = 6) {
  return [...db.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

export function getTopClients(db: Database, limit = 5) {
  const totals = new Map<string, number>();
  for (const txn of db.transactions) {
    if (txn.type !== "income" || !txn.contactId) continue;
    totals.set(txn.contactId, (totals.get(txn.contactId) ?? 0) + txn.amount);
  }

  return [...totals.entries()]
    .map(([contactId, amount]) => {
      const contact = db.contacts.find((item) => item.id === contactId);
      return {
        contactId,
        name: contact?.name ?? "Unknown",
        city: contact?.city ?? "",
        amount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function getReceivablesAging(db: Database) {
  const buckets = [
    { label: "Current", min: -9999, max: 0, amount: 0, count: 0 },
    { label: "1–15 days", min: 1, max: 15, amount: 0, count: 0 },
    { label: "16–30 days", min: 16, max: 30, amount: 0, count: 0 },
    { label: "31–60 days", min: 31, max: 60, amount: 0, count: 0 },
    { label: "60+ days", min: 61, max: 99999, amount: 0, count: 0 },
  ];
  const today = new Date(`${todayISO()}T12:00:00`);

  for (const invoice of db.invoices) {
    const status = effectiveInvoiceStatus(invoice);
    if (status === "paid" || status === "draft") continue;
    const due = new Date(`${invoice.dueDate}T12:00:00`);
    const daysLate = Math.floor(
      (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );
    const bucket = buckets.find(
      (item) => daysLate >= item.min && daysLate <= item.max,
    );
    if (bucket) {
      bucket.amount += invoiceTotal(invoice);
      bucket.count += 1;
    }
  }

  return buckets;
}

export function getTrendData(db: Database) {
  const series = getMonthlySeries(db, 6);
  return series.map((point) => ({
    ...point,
    margin: point.income > 0 ? (point.profit / point.income) * 100 : 0,
  }));
}

export function getExpenseGrowth(db: Database) {
  const series = getMonthlySeries(db, 2);
  const [previous, current] = series;
  if (!previous || !current) return 0;
  if (previous.expenses === 0) return current.expenses > 0 ? 100 : 0;
  return ((current.expenses - previous.expenses) / previous.expenses) * 100;
}
