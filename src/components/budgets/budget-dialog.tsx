"use client";

import {
  type FormEvent,
  type ReactNode,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { saveBudget } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

const emptyState = { ok: false, message: "" };

export function BudgetDialog({
  trigger,
  initialCategory,
  initialLimit,
  title = "Set monthly budget",
}: {
  trigger?: ReactNode;
  initialCategory?: string;
  initialLimit?: number;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");

    startTransition(async () => {
      const result = await saveBudget(emptyState, formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError("");
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Target className="size-4" />
            Set budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Budgets compare this month&apos;s actual spend against your limit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="budget-category">Category</Label>
            <Select
              id="budget-category"
              name="category"
              defaultValue={initialCategory ?? EXPENSE_CATEGORIES[0]}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget-limit">Monthly limit (₹)</Label>
            <Input
              id="budget-limit"
              name="monthlyLimit"
              type="number"
              min="100"
              step="100"
              defaultValue={initialLimit}
              placeholder="50000"
              required
            />
            <p className="text-[11px] text-slate-400">
              Setting a budget for an existing category updates the limit.
            </p>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save budget"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
