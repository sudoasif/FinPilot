import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Download, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { getKpis } from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Search, filter and reconcile every income and expense entry.",
};

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}

async function TransactionsContent() {
  const db = await readDb();
  const kpis = getKpis(db);
  const accounts = db.accounts.map((account) => ({
    id: account.id,
    name: account.name,
    bank: account.bank,
  }));

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Transactions"
        description="Every rupee in and out, across all of your bank accounts and cash."
        eyebrow="Money"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/reports/export?type=transactions">
                <Download className="size-3.5" />
                Export CSV
              </Link>
            </Button>
            <TransactionDialog accounts={accounts} />
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Money in · this month"
          value={formatINR(kpis.income)}
          delta={kpis.incomeChange}
          icon={<TrendingUp className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="Money out · this month"
          value={formatINR(kpis.expenses)}
          delta={kpis.expenseChange}
          invertDelta
          icon={<TrendingDown className="size-4" />}
          tone="rose"
        />
        <StatCard
          label="Net movement"
          value={formatINR(kpis.profit)}
          hint={`${kpis.margin.toFixed(0)}% margin`}
          icon={<Wallet className="size-4" />}
          tone="indigo"
        />
      </div>

      <TransactionTable transactions={db.transactions} accounts={db.accounts} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}
