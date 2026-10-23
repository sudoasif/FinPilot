"use client";

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createInvoice } from "@/actions/invoices";
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
import { formatINR } from "@/lib/format";
import { addDaysISO, todayISO } from "@/lib/utils";

const emptyState = { ok: false, message: "" };

export function InvoiceDialog({
  contacts,
  trigger,
  paymentTermsDays = 15,
}: {
  contacts: { id: string; name: string }[];
  trigger?: ReactNode;
  paymentTermsDays?: number;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const totals = useMemo(() => {
    const subtotal = (Number(quantity) || 0) * (Number(rate) || 0);
    const tax = subtotal * ((Number(gstRate) || 0) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [quantity, rate, gstRate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");

    startTransition(async () => {
      const result = await createInvoice(emptyState, formData);
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
            New invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
          <DialogDescription>
            Bill a customer with GST. You can edit details later in this demo by
            recreating the invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-customer">Customer</Label>
              <Select
                id="inv-customer"
                name="contactId"
                required
                defaultValue={contacts[0]?.id}
              >
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-status">Status</Label>
              <Select id="inv-status" name="status" defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-item">Line item</Label>
            <Input
              id="inv-item"
              name="itemDescription"
              placeholder="e.g. Monthly growth retainer"
              required
              maxLength={160}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inv-qty">Quantity</Label>
              <Input
                id="inv-qty"
                name="quantity"
                type="number"
                min="0.5"
                step="0.5"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-rate">Rate (₹)</Label>
              <Input
                id="inv-rate"
                name="rate"
                type="number"
                min="1"
                step="0.01"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-gst">GST %</Label>
              <Select
                id="inv-gst"
                name="gstRate"
                value={gstRate}
                onChange={(event) => setGstRate(event.target.value)}
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-issue">Issue date</Label>
              <Input
                id="inv-issue"
                name="issueDate"
                type="date"
                defaultValue={todayISO()}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-due">Due date</Label>
              <Input
                id="inv-due"
                name="dueDate"
                type="date"
                defaultValue={addDaysISO(todayISO(), paymentTermsDays)}
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-slate-500">
              <span>GST</span>
              <span>{formatINR(totals.tax)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatINR(totals.total)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-notes">Notes (optional)</Label>
            <Textarea
              id="inv-notes"
              name="notes"
              placeholder="Payment terms, PO number or a short note"
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
                  Creating…
                </>
              ) : (
                "Create invoice"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
