import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  FileText,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getBudgetStatuses,
  getCategoryBreakdown,
  getInvoiceStats,
  getKpis,
  getMonthlySeries,
  getRecentTransactions,
} from "@/lib/analytics";
import { formatDate, formatINR } from "@/lib/format";
import { generateIntelligence } from "@/lib/insights";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { ExpenseDonut } from "@/components/charts/expense-donut";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Cash flow, revenue, expenses and invoice health at a glance.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const db = await readDb();
  const kpis = getKpis(db);
  const series = getMonthlySeries(db, 6);
  const categories = getCategoryBreakdown(db);
  const recent = getRecentTransactions(db, 6);
  const stats = getInvoiceStats(db);
  const budgets = getBudgetStatuses(db).slice(0, 3);
  const intelligence = db.settings.enableAiInsights
    ? generateIntelligence(db)
    : null;
  const accounts = db.accounts.map((account) => ({
    id: account.id,
    name: account.name,
    bank: account.bank,
  }));
  const invoiceBarTotal = Math.max(1, stats.paid + stats.outstanding + stats.draft);

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Good morning, Asif"
        description={`Here is what is happening across ${db.settings.businessName} this month.`}
        eyebrow="Overview"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/reports">View reports</Link>
            </Button>
            <TransactionDialog accounts={accounts} />
          </>
        }
      />

      {intelligence ? (
        <IntelligenceBanner
          intelligence={intelligence}
          copilotEnabled={db.settings.enableCopilot}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cash position"
          value={formatINR(kpis.cash)}
          hint={`${kpis.runwayMonths.toFixed(1)} months of runway`}
          icon={<Wallet className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="Revenue this month"
          value={formatINR(kpis.income)}
          delta={kpis.incomeChange}
          icon={<TrendingUp className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="Expenses this month"
          value={formatINR(kpis.expenses)}
          delta={kpis.expenseChange}
          invertDelta
          icon={<TrendingDown className="size-4" />}
          tone="rose"
        />
        <StatCard
          label="Net profit"
          value={formatINR(kpis.profit)}
          hint={`${kpis.margin.toFixed(0)}% margin`}
          delta={kpis.profitChange}
          icon={<PiggyBank className="size-4" />}
          tone="violet"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Cash flow</CardTitle>
              <CardDescription>Income vs expenses · last 6 months</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-indigo-500" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-400" /> Expenses
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CashflowChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Where money goes</CardTitle>
              <CardDescription>Expense mix this month</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports">Details</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ExpenseDonut data={categories} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Latest activity across all accounts</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transactions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="divide-y divide-slate-100">
              {recent.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-500"
                    }`}
                  >
                    {transaction.description.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {transaction.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(transaction.date)} · {transaction.category}
                    </p>
                  </div>
                  {transaction.status === "pending" ? (
                    <Badge variant="warning">Pending</Badge>
                  ) : null}
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-600"
                        : "text-slate-900"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatINR(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice health</CardTitle>
                <CardDescription>{stats.openCount} open invoices</CardDescription>
              </div>
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {formatINR(stats.outstanding)}
              </p>
              <p className="text-[11px] text-slate-400">outstanding receivables</p>

              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="bg-emerald-500"
                  style={{ width: `${(stats.paid / invoiceBarTotal) * 100}%` }}
                />
                <div
                  className="bg-indigo-400"
                  style={{
                    width: `${(stats.outstanding / invoiceBarTotal) * 100}%`,
                  }}
                />
                <div
                  className="bg-slate-300"
                  style={{ width: `${(stats.draft / invoiceBarTotal) * 100}%` }}
                />
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Collected
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatINR(stats.paid)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    Overdue
                  </span>
                  <span className="font-medium text-rose-600">
                    {formatINR(stats.overdue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="size-1.5 rounded-full bg-slate-300" />
                    Draft
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatINR(stats.draft)}
                  </span>
                </div>
              </div>

              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href="/invoices">Manage invoices</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Budget watch</CardTitle>
                <CardDescription>Top spend categories</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/budgets">All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {budgets.map((item) => (
                <div key={item.budget.id}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-700">
                      {item.budget.category}
                    </span>
                    <span
                      className={
                        item.state === "over"
                          ? "text-rose-600"
                          : item.state === "warning"
                            ? "text-amber-600"
                            : "text-slate-400"
                      }
                    >
                      {formatINR(item.spent)} / {formatINR(item.budget.monthlyLimit)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, item.percent)}
                    indicatorClassName={
                      item.state === "over"
                        ? "bg-rose-500"
                        : item.state === "warning"
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IntelligenceBanner({
  intelligence,
  copilotEnabled,
}: {
  intelligence: ReturnType<typeof generateIntelligence>;
  copilotEnabled: boolean;
}) {
  return (
    <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <span className="text-xl font-semibold">{intelligence.score}</span>
          <span className="text-[9px] uppercase tracking-wider text-indigo-200">
            score
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-200">
            <Sparkles className="size-3.5" /> FinPilot intelligence
          </p>
          <h2 className="mt-1 text-base font-semibold sm:text-lg">
            {intelligence.headline}
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-indigo-100/90">
            {intelligence.summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-white text-indigo-700 shadow-none hover:bg-indigo-50"
          >
            <Link href="/insights">
              Open insights
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          {copilotEnabled ? (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/copilot">
                <Bot className="size-4" />
                Ask AI
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="mb-4 h-28 w-full rounded-2xl" />
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
