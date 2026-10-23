import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Building2,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";
import { getCashBalance, getLiquidBalance, getRecentTransactions } from "@/lib/analytics";
import { formatDate, formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Banking",
  description: "Balances across current accounts, savings, cash and credit cards.",
};

export default function BankingPage() {
  return (
    <Suspense fallback={<BankingSkeleton />}>
      <BankingContent />
    </Suspense>
  );
}

async function BankingContent() {
  const db = await readDb();
  const cash = getCashBalance(db);
  const liquid = getLiquidBalance(db);
  const card = db.accounts.find((account) => account.type === "credit");
  const recent = getRecentTransactions(db, 12);
  const accountMap = new Map(db.accounts.map((account) => [account.id, account]));

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Banking"
        description="Every operating account, cash box and credit line in one view."
        eyebrow="Money"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total balance"
          value={formatINR(cash)}
          hint="Net of credit card dues"
          icon={<Wallet className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="Liquid funds"
          value={formatINR(liquid)}
          hint="Current + savings + cash"
          icon={<Landmark className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="Card outstanding"
          value={formatINR(Math.abs(card?.balance ?? 0))}
          hint={card ? card.name : "No credit card"}
          icon={<CreditCard className="size-4" />}
          tone="rose"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {db.accounts.map((account) => (
          <Card key={account.id} className="overflow-hidden">
            <div
              className={`h-1.5 w-full ${
                account.type === "current"
                  ? "bg-indigo-500"
                  : account.type === "savings"
                    ? "bg-emerald-500"
                    : account.type === "cash"
                      ? "bg-amber-400"
                      : "bg-rose-500"
              }`}
            />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {account.name}
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {account.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <Building2 className="size-3" />
                    {account.bank} · {account.accountNumber}
                  </p>
                </div>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${
                    account.type === "credit"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {account.type === "credit" ? (
                    <CreditCard className="size-4" />
                  ) : (
                    <Landmark className="size-4" />
                  )}
                </span>
              </div>

              <p
                className={`mt-4 text-2xl font-semibold tracking-tight ${
                  account.balance < 0 ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {formatINR(account.balance)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>IFSC {account.ifsc}</span>
                <span>
                  {account.balance < 0 ? "Amount due" : "Available balance"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Account activity</CardTitle>
          <CardDescription>Latest 12 movements across all accounts</CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="divide-y divide-slate-100">
            {recent.map((transaction) => {
              const account = accountMap.get(transaction.accountId);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {transaction.type === "income" ? "IN" : "OUT"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {transaction.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(transaction.date)} · {account?.name ?? "Account"}{" "}
                      · {transaction.category}
                    </p>
                  </div>
                  <Badge variant="outline">{transaction.status}</Badge>
                  <span
                    className={`w-24 shrink-0 text-right text-xs font-semibold ${
                      transaction.type === "income"
                        ? "text-emerald-600"
                        : "text-slate-900"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatINR(transaction.amount)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
            Demo balances are illustrative. In production these would sync from
            your bank feed or a CSV statement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BankingSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
