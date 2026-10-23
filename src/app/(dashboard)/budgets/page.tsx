import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, Target, TrendingUp, Wallet } from "lucide-react";
import { getBudgetStatuses } from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { BudgetsGrid } from "@/components/budgets/budgets-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Budgets",
  description: "Set monthly limits and keep discretionary spend in check.",
};

export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetsSkeleton />}>
      <BudgetsContent />
    </Suspense>
  );
}

async function BudgetsContent() {
  const db = await readDb();
  const statuses = getBudgetStatuses(db);
  const totalBudget = statuses.reduce(
    (sum, item) => sum + item.budget.monthlyLimit,
    0,
  );
  const totalSpent = statuses.reduce((sum, item) => sum + item.spent, 0);
  const over = statuses.filter((item) => item.state === "over");
  const onTrack = statuses.filter((item) => item.state === "healthy").length;

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Budgets"
        description="Monthly guardrails for every operating expense category."
        eyebrow="Money"
        actions={<BudgetDialog />}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total budget"
          value={formatINR(totalBudget)}
          hint={`${statuses.length} categories`}
          icon={<Target className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="Spent so far"
          value={formatINR(totalSpent)}
          hint={
            totalBudget > 0
              ? `${((totalSpent / totalBudget) * 100).toFixed(0)}% of budget`
              : "No budget set"
          }
          icon={<Wallet className="size-4" />}
          tone="violet"
        />
        <StatCard
          label="Remaining"
          value={formatINR(Math.max(0, totalBudget - totalSpent))}
          hint="Across all categories"
          icon={<TrendingUp className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="On track"
          value={`${onTrack}/${statuses.length}`}
          hint={`${over.length} over budget`}
          icon={<CheckCircle2 className="size-4" />}
          tone={over.length > 0 ? "rose" : "emerald"}
        />
      </div>

      {statuses.length === 0 ? (
        <EmptyState
          icon={<Target className="size-4" />}
          title="No budgets yet"
          description="Set a monthly limit for your biggest expense categories."
          action={<BudgetDialog />}
        />
      ) : (
        <BudgetsGrid budgets={statuses} />
      )}
    </div>
  );
}

function BudgetsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
