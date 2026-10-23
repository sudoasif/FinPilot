import type { Metadata } from "next";
import { Suspense } from "react";
import { Building2, Users, Wallet } from "lucide-react";
import { getKpis } from "@/lib/analytics";
import { invoiceTotal } from "@/lib/invoice";
import { formatINR } from "@/lib/format";
import { readDb } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ContactDialog } from "@/components/contacts/contact-dialog";
import { ContactsGrid, type ContactView } from "@/components/contacts/contacts-grid";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Contacts",
  description: "Customers and vendors with GST details and billed revenue.",
};

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsContent />
    </Suspense>
  );
}

async function ContactsContent() {
  const db = await readDb();
  const kpis = getKpis(db);

  const contacts: ContactView[] = db.contacts.map((contact) => {
    const billed = db.invoices
      .filter((invoice) => invoice.contactId === contact.id)
      .reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const referenced =
      db.invoices.some((invoice) => invoice.contactId === contact.id) ||
      db.transactions.some((transaction) => transaction.contactId === contact.id);
    return { ...contact, billed, referenced };
  });

  const customers = contacts.filter((contact) => contact.type === "customer");
  const vendors = contacts.filter((contact) => contact.type === "vendor");
  const totalBilled = contacts.reduce((sum, contact) => sum + contact.billed, 0);

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Contacts"
        description="Your customers, vendors and GST details in one place."
        eyebrow="Workspace"
        actions={<ContactDialog />}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Customers"
          value={String(customers.length)}
          hint="Currently invoiced"
          icon={<Users className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="Vendors"
          value={String(vendors.length)}
          hint="Suppliers and service providers"
          icon={<Building2 className="size-4" />}
          tone="amber"
        />
        <StatCard
          label="Lifetime billed"
          value={formatINR(totalBilled)}
          hint={`Cash position ${formatINR(kpis.cash)}`}
          icon={<Wallet className="size-4" />}
          tone="emerald"
        />
      </div>

      <ContactsGrid contacts={contacts} />
    </div>
  );
}

function ContactsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
