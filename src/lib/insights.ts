import {
  getBudgetStatuses,
  getCategoryBreakdown,
  getExpenseGrowth,
  getInvoiceStats,
  getKpis,
  getLiquidBalance,
  getMonthlySeries,
} from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import type { Database, Insight } from "@/types";

export interface IntelligenceReport {
  score: number;
  grade: "A" | "B" | "C" | "D";
  headline: string;
  summary: string;
  savingsRate: number;
  runwayMonths: number;
  insights: Insight[];
}

export function generateIntelligence(db: Database): IntelligenceReport {
  const kpis = getKpis(db);
  const stats = getInvoiceStats(db);
  const budgets = getBudgetStatuses(db);
  const expenseGrowth = getExpenseGrowth(db);
  const categories = getCategoryBreakdown(db, 1);
  const series = getMonthlySeries(db, 6);
  const liquid = getLiquidBalance(db);
  const averageExpenses =
    series.reduce((sum, point) => sum + point.expenses, 0) / series.length;
  const runwayMonths = averageExpenses > 0 ? liquid / averageExpenses : 0;

  const overBudget = budgets.filter((item) => item.state === "over");
  const nearBudget = budgets.filter((item) => item.state === "warning");
  const topCategory = categories[0];

  let score = 58;
  score += Math.max(-10, Math.min(25, kpis.savingsRate));
  score += kpis.profit > 0 ? 10 : -12;
  score -= stats.overdueCount * 4;
  score -= overBudget.length * 3;
  score += expenseGrowth <= 0 ? 5 : -Math.min(8, expenseGrowth / 5);
  score += runwayMonths >= 3 ? 5 : 0;
  score = Math.round(Math.max(12, Math.min(98, score)));

  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";

  const insights: Insight[] = [];

  if (stats.overdueCount > 0) {
    insights.push({
      id: "overdue",
      tone: "critical",
      icon: "alert",
      title: `${stats.overdueCount} overdue invoice${stats.overdueCount === 1 ? "" : "s"} need follow-up`,
      description: `You are waiting on ${formatINR(stats.overdue)} from customers. Send a polite payment reminder to protect cash flow.`,
      metric: formatINR(stats.overdue),
      href: "/invoices",
      cta: "Review invoices",
    });
  }

  if (overBudget.length > 0) {
    const worst = overBudget[0];
    insights.push({
      id: "budget",
      tone: "warning",
      icon: "target",
      title: `${overBudget.length} budget${overBudget.length === 1 ? "" : "s"} exceeded this month`,
      description: `${worst.budget.category} is at ${worst.percent.toFixed(0)}% of its ${formatINR(worst.budget.monthlyLimit)} budget. Trim discretionary spend to get back on track.`,
      metric: `${worst.percent.toFixed(0)}%`,
      href: "/budgets",
      cta: "Open budgets",
    });
  }

  if (kpis.savingsRate >= 20) {
    insights.push({
      id: "savings",
      tone: "positive",
      icon: "trend",
      title: "Strong margin this month",
      description: `You are retaining ${kpis.savingsRate.toFixed(0)}% of revenue after operating expenses. Move the surplus into your tax reserve to build a buffer.`,
      metric: `${kpis.savingsRate.toFixed(0)}%`,
      href: "/reports",
      cta: "View P&L",
    });
  } else if (kpis.profit < 0) {
    insights.push({
      id: "loss",
      tone: "critical",
      icon: "wallet",
      title: "Expenses are ahead of revenue",
      description: `This month's spend of ${formatINR(kpis.expenses)} exceeds income of ${formatINR(kpis.income)}. Review the largest cost buckets and pending invoices.`,
      metric: formatINR(kpis.profit),
      href: "/reports",
      cta: "Inspect cash flow",
    });
  }

  if (expenseGrowth > 8) {
    insights.push({
      id: "expense-growth",
      tone: "warning",
      icon: "alert",
      title: "Discretionary spend is rising",
      description: `Expenses are up ${expenseGrowth.toFixed(0)}% versus last month. Software, travel and marketing are the usual culprits — check for overlapping subscriptions.`,
      metric: `+${expenseGrowth.toFixed(0)}%`,
      href: "/transactions",
      cta: "Review spend",
    });
  }

  if (topCategory) {
    insights.push({
      id: "top-category",
      tone: "neutral",
      icon: "receipt",
      title: `${topCategory.category} is your largest expense`,
      description: `It accounts for ${topCategory.share.toFixed(0)}% of this month's spend (${formatINR(topCategory.amount)}). Renegotiating this line has the biggest leverage.`,
      metric: formatINR(topCategory.amount),
      href: "/reports",
      cta: "See breakdown",
    });
  }

  insights.push({
    id: "runway",
    tone: runwayMonths >= 3 ? "positive" : "warning",
    icon: "shield",
    title:
      runwayMonths >= 3
        ? `${runwayMonths.toFixed(1)} months of runway`
        : "Runway is below 3 months",
    description:
      runwayMonths >= 3
        ? `Liquid cash of ${formatINR(liquid)} covers about ${runwayMonths.toFixed(1)} months of average operating expenses.`
        : `Liquid cash of ${formatINR(liquid)} would cover ${runwayMonths.toFixed(1)} months of expenses. Prioritise collections and hold non-critical hires.`,
    metric: `${runwayMonths.toFixed(1)} mo`,
    href: "/banking",
    cta: "View accounts",
  });

  const gstReserve = Math.round(kpis.income * 0.18);
  insights.push({
    id: "gst",
    tone: "neutral",
    icon: "sparkles",
    title: "Set aside GST before it is due",
    description: `Based on this month's revenue, keep roughly ${formatINR(gstReserve)} ready for GST. Your tax reserve account already holds ${formatINR(db.accounts.find((account) => account.id === "acc_icici_savings")?.balance ?? 0)}.`,
    metric: formatINR(gstReserve),
    href: "/reports",
    cta: "Open reports",
  });

  if (stats.draft > 0) {
    insights.push({
      id: "draft",
      tone: "neutral",
      icon: "receipt",
      title: "Draft invoices are not billed yet",
      description: `${formatINR(stats.draft)} of work is sitting in draft. Finalise and send those invoices to shorten your collection cycle.`,
      metric: formatINR(stats.draft),
      href: "/invoices",
      cta: "Finish drafts",
    });
  }

  const headline =
    grade === "A"
      ? "Your books are in excellent shape"
      : grade === "B"
        ? "Healthy, with a few quick wins"
        : grade === "C"
          ? "Stable, but cash needs attention"
          : "Several financial risks need action";

  const summary =
    stats.overdueCount > 0
      ? `Collections are the biggest lever right now — ${formatINR(stats.overdue)} is overdue. After that, keep ${nearBudget.length > 0 ? `${nearBudget[0].budget.category.toLowerCase()} spend` : "operating costs"} in check.`
      : kpis.profit > 0
        ? `Profitability is positive at ${formatINR(kpis.profit)} this month. Keep building the tax reserve and follow up on ${formatINR(stats.outstanding)} of open invoices.`
        : `Revenue is ${formatINR(kpis.income)} against ${formatINR(kpis.expenses)} of expenses this month. Focus on collections and defer non-essential spend.`;

  return {
    score,
    grade,
    headline,
    summary,
    savingsRate: kpis.savingsRate,
    runwayMonths,
    insights,
  };
}
