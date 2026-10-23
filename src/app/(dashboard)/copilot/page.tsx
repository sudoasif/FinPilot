import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertTriangle, Bot, Clock, Wallet } from "lucide-react";
import { getInvoiceStats, getKpis } from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { FeatureDisabled } from "@/components/layout/feature-disabled";
import { PageHeader } from "@/components/layout/page-header";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "AI Copilot",
  description:
    "Ask questions about cash flow, invoices, budgets and GST in plain English.",
};

export default function CopilotPage() {
  return (
    <Suspense fallback={<CopilotSkeleton />}>
      <CopilotContent />
    </Suspense>
  );
}

async function CopilotContent() {
  const db = await readDb();

  if (!db.settings.enableCopilot) {
    return (
      <div className="fp-fade-up">
        <PageHeader
          title="AI Copilot"
          description="A finance analyst that can see your revenue, spend, invoices and runway."
          eyebrow="Overview"
        />
        <FeatureDisabled
          title="The AI copilot"
          description="The copilot is disabled for this workspace. Re-enable it in Settings to ask questions about your books again."
        />
      </div>
    );
  }

  const kpis = getKpis(db);
  const stats = getInvoiceStats(db);

  const context = {
    business: db.settings.businessName,
    cash: kpis.cash,
    income: kpis.income,
    expenses: kpis.expenses,
    profit: kpis.profit,
    outstanding: stats.outstanding,
    overdue: stats.overdue,
    overdueCount: stats.overdueCount,
    openCount: stats.openCount,
  };

  const aiEnabled = Boolean(process.env.OPENAI_API_KEY);

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="AI Copilot"
        description="A finance analyst that can see your revenue, spend, invoices and runway."
        eyebrow="Overview"
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <CopilotChat context={context} aiEnabled={aiEnabled} />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-4 text-indigo-500" />
                What I can see
              </CardTitle>
              <CardDescription>
                My answers are grounded in this snapshot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Wallet className="size-3.5 text-slate-400" /> Cash
                </span>
                <span className="font-medium text-slate-900">
                  {formatINR(context.cash)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="size-3.5 text-slate-400" /> Outstanding
                </span>
                <span className="font-medium text-slate-900">
                  {formatINR(context.outstanding)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <AlertTriangle className="size-3.5 text-slate-400" /> Overdue
                </span>
                <span className="font-medium text-rose-600">
                  {formatINR(context.overdue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Revenue this month</span>
                <span className="font-medium text-slate-900">
                  {formatINR(context.income)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Profit this month</span>
                <span className="font-medium text-slate-900">
                  {formatINR(context.profit)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Demo-safe by design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] leading-relaxed text-slate-500">
              <p>
                FinPilot builds a compact financial context from your local
                workspace and asks a model only the question you typed.
              </p>
              <p>
                If no model key is configured, a deterministic analyst answers
                from the same numbers — so the copilot always works offline.
              </p>
              <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] text-slate-500">
                {aiEnabled
                  ? "AI mode is active for this workspace."
                  : "Local analyst mode is active. Add OPENAI_API_KEY to enable the language model."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="p-4 text-[11px] leading-relaxed text-amber-800">
              Estimates only. For GST filings, payroll decisions or investments,
              confirm with a qualified professional.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CopilotSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Skeleton className="h-[600px] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
