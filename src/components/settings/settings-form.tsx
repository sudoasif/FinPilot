"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, Save } from "lucide-react";
import { resetDemoData, updateSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState, AppSettings } from "@/types";

const initialState: ActionState = { ok: false, message: "" };

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(
    updateSettings,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>
            Appears on invoices, reports and the workspace switcher.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Trading name</Label>
            <Input
              id="businessName"
              name="businessName"
              defaultValue={settings.businessName}
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legalName">Legal name</Label>
            <Input
              id="legalName"
              name="legalName"
              defaultValue={settings.legalName}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              name="gstin"
              defaultValue={settings.gstin}
              maxLength={15}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              name="pan"
              defaultValue={settings.pan}
              maxLength={10}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Finance email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={settings.email}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={settings.phone}
              required
              minLength={6}
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Registered address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={settings.address}
              className="min-h-[72px]"
              maxLength={240}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoicing & compliance</CardTitle>
          <CardDescription>
            Defaults applied to new invoices and reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="invoicePrefix">Invoice prefix</Label>
            <Input
              id="invoicePrefix"
              name="invoicePrefix"
              defaultValue={settings.invoicePrefix}
              required
              minLength={2}
              maxLength={8}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
            <Input
              id="paymentTermsDays"
              name="paymentTermsDays"
              type="number"
              min={1}
              max={90}
              defaultValue={settings.paymentTermsDays}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="financialYearStart">Financial year starts</Label>
            <Select
              id="financialYearStart"
              name="financialYearStart"
              defaultValue={settings.financialYearStart}
            >
              <option value="04-01">1 April (India)</option>
              <option value="01-01">1 January</option>
              <option value="07-01">1 July</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Turn demo capabilities on or off for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            {
              name: "enableAiInsights",
              label: "Intelligence signals",
              description:
                "Health score, risk alerts and prioritised recommendations.",
              defaultChecked: settings.enableAiInsights,
            },
            {
              name: "enableCopilot",
              label: "AI copilot",
              description:
                "Chat with your books. Falls back to a local analyst without a model key.",
              defaultChecked: settings.enableCopilot,
            },
            {
              name: "enableDocumentImport",
              label: "Document import",
              description:
                "Parse CSV bank statements into transactions and store PDFs.",
              defaultChecked: settings.enableDocumentImport,
            },
          ].map((feature) => (
            <label
              key={feature.name}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50/70"
            >
              <input
                type="checkbox"
                name={feature.name}
                defaultChecked={feature.defaultChecked}
                className="mt-0.5 size-4 rounded border-slate-300 accent-indigo-600"
              />
              <span>
                <span className="block text-xs font-medium text-slate-800">
                  {feature.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  {feature.description}
                </span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {state.message ? (
          <p
            className={`flex items-center gap-1.5 text-[11px] ${
              state.ok ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {state.ok ? <CheckCircle2 className="size-3.5" /> : null}
            {state.message}
          </p>
        ) : (
          <span className="text-[11px] text-slate-400">
            Changes apply immediately across the demo workspace.
          </span>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function ResetDataCard() {
  return (
    <Card className="border-rose-200">
      <CardHeader>
        <CardTitle className="text-rose-700">Demo data</CardTitle>
        <CardDescription>
          Restore the original six months of seeded transactions, invoices,
          contacts and budgets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={resetDemoData}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Reset the workspace to the original demo data? Your local changes will be lost.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <Button type="submit" variant="danger" size="sm">
            <RotateCcw className="size-3.5" />
            Reset demo data
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
