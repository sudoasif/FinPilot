"use client";

import {
  type FormEvent,
  type ReactNode,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createTransaction } from "@/actions/transactions";
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
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import { todayISO } from "@/lib/utils";

const emptyState = { ok: false, message: "" };

export function TransactionDialog({
  accounts,
  trigger,
  defaultType = "expense",
}: {
  accounts: { id: string; name: string; bank: string }[];
  trigger?: ReactNode;
  defaultType?: "income" | "expense";
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");

    startTransition(async () => {
      const result = await createTransaction(emptyState, formData);
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
            <Plus className="size-4" />
            Add transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Record income or an expense against one of your accounts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {(["expense", "income"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  type === option
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />

          <div className="space-y-1.5">
            <Label htmlFor="txn-description">Description</Label>
            <Input
              id="txn-description"
              name="description"
              placeholder="e.g. Zoho subscription"
              required
              maxLength={120}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="txn-amount">Amount (₹)</Label>
              <Input
                id="txn-amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txn-date">Date</Label>
              <Input
                id="txn-date"
                name="date"
                type="date"
                defaultValue={todayISO()}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="txn-category">Category</Label>
              <Select
                key={type}
                id="txn-category"
                name="category"
                defaultValue={categories[0]}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txn-account">Account</Label>
              <Select
                id="txn-account"
                name="accountId"
                defaultValue={accounts[0]?.id}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {account.bank}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="txn-status">Status</Label>
              <Select id="txn-status" name="status" defaultValue="cleared">
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txn-reference">Reference (optional)</Label>
              <Input
                id="txn-reference"
                name="reference"
                placeholder="UPI / cheque no."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="txn-notes">Notes (optional)</Label>
            <Textarea
              id="txn-notes"
              name="notes"
              placeholder="Anything to remember about this transaction"
              className="min-h-[64px]"
            />
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
                "Add transaction"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
