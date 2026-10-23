"use client";

import { Pencil, Trash2 } from "lucide-react";
import { deleteBudget } from "@/actions/budgets";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/format";
import type { BudgetStatus } from "@/types";

export function BudgetsGrid({ budgets }: { budgets: BudgetStatus[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {budgets.map((item) => {
        const badge =
          item.state === "over"
            ? { label: "Over budget", variant: "danger" as const }
            : item.state === "warning"
              ? { label: "Near limit", variant: "warning" as const }
              : { label: "On track", variant: "success" as const };

        return (
          <Card key={item.budget.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.budget.category}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {formatINR(item.spent)} spent of {formatINR(item.budget.monthlyLimit)}
                </p>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-700">
                  {item.percent.toFixed(0)}% used
                </span>
                <span
                  className={
                    item.remaining < 0 ? "text-rose-600" : "text-slate-400"
                  }
                >
                  {item.remaining < 0
                    ? `${formatINR(Math.abs(item.remaining))} over`
                    : `${formatINR(item.remaining)} left`}
                </span>
              </div>
              <Progress
                value={Math.min(100, item.percent)}
                className="h-2.5"
                indicatorClassName={
                  item.state === "over"
                    ? "bg-rose-500"
                    : item.state === "warning"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
              <BudgetDialog
                initialCategory={item.budget.category}
                initialLimit={item.budget.monthlyLimit}
                title={`Edit ${item.budget.category} budget`}
                trigger={
                  <Button variant="ghost" size="sm" className="text-slate-500">
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                }
              />
              <form
                action={deleteBudget}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Remove the ${item.budget.category} budget?`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={item.budget.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete budget"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </form>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
