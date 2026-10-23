import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Bot,
  Database,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import {
  ResetDataCard,
  SettingsForm,
} from "@/components/settings/settings-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Settings",
  description: "Business profile, invoicing defaults and workspace features.",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const db = await readDb();
  const aiEnabled = Boolean(process.env.OPENAI_API_KEY);
  const blobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Settings"
        description="Tune the workspace, invoicing defaults and demo features."
        eyebrow="Workspace"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SettingsForm settings={db.settings} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Demo environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Plan</span>
                <Badge variant="default">Demo · full access</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Business</span>
                <span className="max-w-40 truncate font-medium text-slate-800">
                  {db.settings.businessName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">GSTIN</span>
                <span className="font-mono text-[10px] text-slate-700">
                  {db.settings.gstin || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Currency</span>
                <span className="font-medium text-slate-800">
                  {db.settings.currency} · {db.settings.locale}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Timezone</span>
                <span className="font-medium text-slate-800">
                  {db.settings.timezone}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-4 text-indigo-500" />
                Copilot mode
              </CardTitle>
              <CardDescription>Model connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] leading-relaxed text-slate-500">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Sparkles className="size-3.5 text-indigo-500" />
                  {aiEnabled ? "Language model" : "Local analyst"}
                </span>
                <Badge variant={aiEnabled ? "success" : "secondary"}>
                  {aiEnabled ? "Connected" : "Offline-safe"}
                </Badge>
              </div>
              <p>
                {aiEnabled
                  ? "OPENAI_API_KEY is set. Copilot answers use the configured model and your financial snapshot."
                  : "No model key is configured. The copilot uses a deterministic analyst that reads your workspace books — nothing is sent to a model provider."}
              </p>
              <p>
                Add <span className="font-mono text-[10px]">OPENAI_API_KEY</span>{" "}
                to enable AI answers. Optionally set{" "}
                <span className="font-mono text-[10px]">AI_MODEL_CHAT</span> to
                change the model.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4 text-slate-500" />
                Data & storage
              </CardTitle>
              <CardDescription>Demo persistence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] leading-relaxed text-slate-500">
              <p className="flex items-start gap-1.5">
                <HardDrive className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                {blobStorage ? (
                  <>
                    Workspace data is stored as a private JSON document in{" "}
                    <span className="font-mono text-[10px] text-slate-700">
                      Vercel Blob
                    </span>
                    . It survives server restarts and deployments.
                  </>
                ) : (
                  <>
                    Workspace data is stored in{" "}
                    <span className="font-mono text-[10px] text-slate-700">
                      data/finpilot.json
                    </span>{" "}
                    on this machine. It survives server restarts.
                  </>
                )}
              </p>
              <p className="flex items-start gap-1.5">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                Sessions use a signed HTTP-only cookie. Set{" "}
                <span className="font-mono text-[10px]">AUTH_SECRET</span> in
                production.
              </p>
              <p className="flex items-start gap-1.5">
                <Wrench className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                For multi-user production, swap the JSON store for Supabase
                Postgres and add schema migrations.
              </p>
            </CardContent>
          </Card>

          <ResetDataCard />
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
