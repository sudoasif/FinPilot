import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LedgerType } from "@/types";

export const metadata: Metadata = {
  title: "Chart of Accounts",
  description: "The ledger structure behind every transaction and report.",
};

const GROUPS: {
  type: LedgerType;
  label: string;
  description: string;
  tone: string;
  badge: "default" | "warning" | "success" | "info" | "danger";
}[] = [
  {
    type: "asset",
    label: "Assets",
    description: "What the business owns",
    tone: "bg-indigo-500",
    badge: "default",
  },
  {
    type: "liability",
    label: "Liabilities",
    description: "What the business owes",
    tone: "bg-amber-500",
    badge: "warning",
  },
  {
    type: "equity",
    label: "Equity",
    description: "Owner capital and retained earnings",
    tone: "bg-violet-500",
    badge: "info",
  },
  {
    type: "income",
    label: "Income",
    description: "Revenue and other income",
    tone: "bg-emerald-500",
    badge: "success",
  },
  {
    type: "expense",
    label: "Expenses",
    description: "Operating and statutory costs",
    tone: "bg-rose-500",
    badge: "danger",
  },
];

export default function ChartOfAccountsPage() {
  return (
    <Suspense fallback={<AccountsSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}

async function AccountsContent() {
  const db = await readDb();

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Chart of accounts"
        description="A simple, India-ready ledger structure. Transactions map to these groups through categories."
        eyebrow="Books"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {GROUPS.map((group) => {
          const count = db.ledger.filter((account) => account.type === group.type).length;
          return (
            <Card key={group.type} className="p-4">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${group.tone}`} />
                <p className="text-xs font-medium text-slate-600">{group.label}</p>
              </div>
              <p className="mt-1 text-xl font-semibold text-slate-900">{count}</p>
              <p className="text-[10px] text-slate-400">accounts</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {GROUPS.map((group) => {
          const accounts = db.ledger.filter((account) => account.type === group.type);
          return (
            <Card key={group.type}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${group.tone}`} />
                    {group.label}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
                <Badge variant={group.badge}>{accounts.length}</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-slate-50">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-start gap-3 py-2.5"
                    >
                      <span className="w-9 shrink-0 font-mono text-[10px] text-slate-400">
                        {account.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800">
                          {account.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {account.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 ? (
                    <p className="py-3 text-xs text-slate-400">No accounts yet.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4">
        <CardContent className="flex items-start gap-3 p-4 text-[11px] leading-relaxed text-slate-500">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-indigo-500" />
          <p>
            FinPilot categories such as <span className="font-medium text-slate-700">Software</span>,{" "}
            <span className="font-medium text-slate-700">Travel</span> and{" "}
            <span className="font-medium text-slate-700">Professional Fees</span>{" "}
            roll up into the expense group, while Sales, Consulting and Retainers
            feed income. This keeps reports consistent without asking you to pick
            ledger codes for every entry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
