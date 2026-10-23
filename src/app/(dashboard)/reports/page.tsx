import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  getCategoryBreakdown,
  getInvoiceStats,
  getKpis,
  getMonthlySeries,
  getReceivablesAging,
} from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { ProfitBarChart } from "@/components/charts/profit-bar-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Reports",
  description: "Profit & loss, cash flow, GST estimates and receivables aging.",
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent />
    </Suspense>
  );
}

async function ReportsContent() {
  const db = await readDb();
  const series = getMonthlySeries(db, 6);
  const kpis = getKpis(db);
  const categories = getCategoryBreakdown(db);
  const aging = getReceivablesAging(db);
  const stats = getInvoiceStats(db);

  const totalIncome = series.reduce((sum, point) => sum + point.income, 0);
  const totalExpenses = series.reduce((sum, point) => sum + point.expenses, 0);
  const netProfit = totalIncome - totalExpenses;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const outputGst = Math.round(kpis.income * 0.18);
  const inputCredit = Math.round((kpis.expenses / 1.18) * 0.18);
  const netGst = outputGst - inputCredit;
  const maxAging = Math.max(1, ...aging.map((bucket) => bucket.amount));

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Reports"
        description="A clean, investor-ready view of the last six months."
        eyebrow="Books"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/reports/export?type=invoices">
                <Download className="size-3.5" />
                Invoices CSV
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/reports/export?type=transactions">
                <Download className="size-3.5" />
                Transactions CSV
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue · 6 months"
          value={formatINR(totalIncome)}
          hint="All income categories"
          icon={<TrendingUp className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="Expenses · 6 months"
          value={formatINR(totalExpenses)}
          hint={`${((totalExpenses / Math.max(1, totalIncome)) * 100).toFixed(0)}% of revenue`}
          icon={<TrendingDown className="size-4" />}
          tone="rose"
        />
        <StatCard
          label="Net profit"
          value={formatINR(netProfit)}
          hint={`${margin.toFixed(0)}% average margin`}
          icon={<PiggyBank className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="GST estimate"
          value={formatINR(Math.max(0, netGst))}
          hint="This month · confirm with CA"
          icon={<Receipt className="size-4" />}
          tone="violet"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Profit & loss</CardTitle>
            <CardDescription>Income and expenses by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfitBarChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GST snapshot</CardTitle>
            <CardDescription>Approximate this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Output GST @ 18%
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">
                {formatINR(outputGst)}
              </p>
              <p className="text-[10px] text-slate-400">
                On {formatINR(kpis.income)} of revenue
              </p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Estimated input credit</span>
              <span className="font-medium text-emerald-600">
                − {formatINR(inputCredit)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
              <span className="font-medium text-slate-700">Net GST estimate</span>
              <span className="font-semibold text-slate-900">
                {formatINR(Math.max(0, netGst))}
              </span>
            </div>
            <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[10px] leading-relaxed text-amber-700">
              A planning estimate only. Actual liability depends on invoice-level
              GST, input credits and filings. Confirm with your CA.
            </p>
            <div className="rounded-lg border border-slate-200 p-2.5 text-[11px] text-slate-500">
              <div className="flex items-center justify-between">
                <span>Outstanding receivables</span>
                <span className="font-medium text-slate-800">
                  {formatINR(stats.outstanding)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Overdue</span>
                <span className="font-medium text-rose-600">
                  {formatINR(stats.overdue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly P&L</CardTitle>
            <CardDescription>Month-by-month performance</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 font-medium">Month</th>
                    <th className="py-2 text-right font-medium">Income</th>
                    <th className="py-2 text-right font-medium">Expenses</th>
                    <th className="py-2 text-right font-medium">Profit</th>
                    <th className="py-2 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {series.map((point) => (
                    <tr key={point.month}>
                      <td className="py-2.5 font-medium text-slate-700">
                        {point.label}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatINR(point.income)}
                      </td>
                      <td className="py-2.5 text-right text-slate-600">
                        {formatINR(point.expenses)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold ${
                          point.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {formatINR(point.profit)}
                      </td>
                      <td className="py-2.5 text-right text-slate-500">
                        {point.income > 0
                          ? `${((point.profit / point.income) * 100).toFixed(0)}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 bg-slate-50/60">
                    <td className="py-2.5 font-semibold text-slate-900">Total</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {formatINR(totalIncome)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {formatINR(totalExpenses)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-semibold ${
                        netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatINR(netProfit)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {margin.toFixed(0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense mix</CardTitle>
            <CardDescription>This month by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseDonut data={categories} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Receivables aging</CardTitle>
          <CardDescription>How long customers have owed you money</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {aging.map((bucket) => (
            <div key={bucket.label}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">
                  {bucket.label}{" "}
                  <span className="text-slate-400">({bucket.count})</span>
                </span>
                <span className="font-medium text-slate-800">
                  {formatINR(bucket.amount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    bucket.label === "Current"
                      ? "bg-emerald-500"
                      : bucket.label === "1–15 days"
                        ? "bg-indigo-400"
                        : bucket.label === "16–30 days"
                          ? "bg-amber-400"
                          : "bg-rose-500"
                  }`}
                  style={{ width: `${(bucket.amount / maxAging) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link href="/invoices">
              Follow up on invoices
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
