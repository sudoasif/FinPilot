import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getCategoryBreakdown, getKpis } from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import { generateIntelligence } from "@/lib/insights";
import { readDb } from "@/lib/store";
import { FeatureDisabled } from "@/components/layout/feature-disabled";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight } from "@/types";

export const metadata: Metadata = {
  title: "Intelligence",
  description: "A health score and prioritised actions generated from your books.",
};

const ICONS = {
  trend: TrendingUp,
  alert: AlertTriangle,
  target: Target,
  receipt: Receipt,
  wallet: Wallet,
  sparkles: Sparkles,
  shield: ShieldCheck,
} as const;

const TONES = {
  positive: {
    badge: "success" as const,
    icon: "bg-emerald-50 text-emerald-600",
    label: "Opportunity",
  },
  neutral: {
    badge: "info" as const,
    icon: "bg-sky-50 text-sky-600",
    label: "Insight",
  },
  warning: {
    badge: "warning" as const,
    icon: "bg-amber-50 text-amber-600",
    label: "Watch",
  },
  critical: {
    badge: "danger" as const,
    icon: "bg-rose-50 text-rose-600",
    label: "Action needed",
  },
};

export default function InsightsPage() {
  return (
    <Suspense fallback={<InsightsSkeleton />}>
      <InsightsContent />
    </Suspense>
  );
}

async function InsightsContent() {
  const db = await readDb();

  if (!db.settings.enableAiInsights) {
    return (
      <div className="fp-fade-up">
        <PageHeader
          title="Intelligence"
          description="Signals generated from your live books — prioritised by cash impact."
          eyebrow="Overview"
        />
        <FeatureDisabled
          title="Intelligence signals"
          description="Health scoring, risk alerts and recommendations are disabled for this workspace. Re-enable them in Settings to see them again."
        />
      </div>
    );
  }

  const report = generateIntelligence(db);
  const kpis = getKpis(db);
  const categories = getCategoryBreakdown(db, 3);
  const critical = report.insights.filter(
    (insight) => insight.tone === "critical",
  ).length;
  const warnings = report.insights.filter(
    (insight) => insight.tone === "warning",
  ).length;

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Intelligence"
        description="Signals generated from your live books — prioritised by cash impact."
        eyebrow="Overview"
        actions={
          db.settings.enableCopilot ? (
            <Button asChild size="sm">
              <Link href="/copilot">
                <Bot className="size-4" />
                Ask the copilot
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4 overflow-hidden border-0 bg-[#0B1220] text-white shadow-lg shadow-slate-950/10">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="relative flex size-28 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#818cf8 ${report.score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-[#0B1220]" />
            <div className="relative flex flex-col items-center">
              <span className="text-3xl font-semibold tracking-tight">
                {report.score}
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                Grade {report.grade}
              </span>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-300">
              <Sparkles className="size-3.5" /> Financial health
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
              {report.headline}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-400">
              {report.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-400">
              <span>
                Savings rate{" "}
                <span className="font-medium text-white">
                  {report.savingsRate.toFixed(0)}%
                </span>
              </span>
              <span>
                Runway{" "}
                <span className="font-medium text-white">
                  {report.runwayMonths.toFixed(1)} months
                </span>
              </span>
              <span>
                Critical signals{" "}
                <span className="font-medium text-rose-300">{critical}</span>
              </span>
              <span>
                Warnings{" "}
                <span className="font-medium text-amber-300">{warnings}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {report.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>This month</CardTitle>
              <CardDescription>Snapshot used by the copilot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Revenue</span>
                <span className="font-medium text-slate-900">
                  {formatINR(kpis.income)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Expenses</span>
                <span className="font-medium text-slate-900">
                  {formatINR(kpis.expenses)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Net profit</span>
                <span
                  className={`font-medium ${
                    kpis.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatINR(kpis.profit)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Cash</span>
                <span className="font-medium text-slate-900">
                  {formatINR(kpis.cash)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Outstanding</span>
                <span className="font-medium text-slate-900">
                  {formatINR(kpis.outstanding)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top expense buckets</CardTitle>
              <CardDescription>Where to look first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((slice) => (
                <div key={slice.category}>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{slice.category}</span>
                    <span className="font-medium text-slate-800">
                      {formatINR(slice.amount)}
                    </span>
                  </div>
                  <Progress value={slice.share} className="h-1.5" />
                </div>
              ))}
              <Button asChild variant="outline" size="sm" className="mt-1 w-full">
                <Link href="/reports">Open reports</Link>
              </Button>
            </CardContent>
          </Card>

          {db.settings.enableCopilot ? (
            <Card className="border-indigo-100 bg-indigo-50/50">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                  <Bot className="size-4" /> Need a second opinion?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-indigo-800/70">
                  The copilot can explain any signal, draft a payment reminder or
                  compare months. It uses the same numbers shown here.
                </p>
                <Button asChild size="sm" className="mt-3 w-full">
                  <Link href="/copilot">
                    Open copilot
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const tone = TONES[insight.tone];
  const Icon = ICONS[insight.icon];

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
            <Badge variant={tone.badge}>{tone.label}</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {insight.description}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            {insight.metric ? (
              <span className="text-xs font-semibold text-slate-900">
                {insight.metric}
              </span>
            ) : (
              <span />
            )}
            {insight.href && insight.cta ? (
              <Link
                href={insight.href}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
              >
                {insight.cta}
                <ArrowRight className="size-3" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="mb-4 h-52 rounded-2xl" />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
