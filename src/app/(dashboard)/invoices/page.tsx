import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { getInvoiceStats } from "@/lib/analytics";
import { formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { todayISO } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Create GST invoices, track receivables and chase overdue payments.",
};

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <InvoicesContent />
    </Suspense>
  );
}

async function InvoicesContent() {
  const db = await readDb();
  const stats = getInvoiceStats(db);
  const customers = db.contacts.filter((contact) => contact.type === "customer");
  const contacts = customers.length > 0 ? customers : db.contacts;

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Invoices"
        description="Bill customers, track GST and keep receivables moving."
        eyebrow="Money"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/api/reports/export?type=invoices">Export CSV</Link>
            </Button>
            <InvoiceDialog
              contacts={contacts.map((contact) => ({
                id: contact.id,
                name: contact.name,
              }))}
              paymentTermsDays={db.settings.paymentTermsDays}
            />
          </>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Outstanding"
          value={formatINR(stats.outstanding)}
          hint={`${stats.openCount} open invoices`}
          icon={<Clock className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="Overdue"
          value={formatINR(stats.overdue)}
          hint={`${stats.overdueCount} need follow-up`}
          icon={<AlertTriangle className="size-4" />}
          tone="rose"
        />
        <StatCard
          label="Collected"
          value={formatINR(stats.paid)}
          hint={`${stats.paidCount} paid invoices`}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="Draft"
          value={formatINR(stats.draft)}
          hint="Not billed yet"
          icon={<FileText className="size-4" />}
          tone="violet"
        />
      </div>

      <InvoiceTable
        invoices={db.invoices}
        contacts={db.contacts}
        today={todayISO()}
      />
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  );
}
