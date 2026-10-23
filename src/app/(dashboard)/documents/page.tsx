import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, FileSpreadsheet, Files, ScanText } from "lucide-react";
import { readDb } from "@/lib/store";
import { FeatureDisabled } from "@/components/layout/feature-disabled";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentsTable } from "@/components/documents/documents-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Documents",
  description: "Import bank statements and keep supporting documents together.",
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <DocumentsContent />
    </Suspense>
  );
}

async function DocumentsContent() {
  const db = await readDb();
  const importEnabled = db.settings.enableDocumentImport;
  const processed = db.documents.filter(
    (document) => document.status === "processed",
  ).length;
  const importedRows = db.documents.reduce(
    (sum, document) => sum + (document.importedCount ?? 0),
    0,
  );

  return (
    <div className="fp-fade-up">
      <PageHeader
        title="Documents"
        description="Drop in a bank statement, invoice or receipt. CSV rows can be imported straight into your books."
        eyebrow="Books"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Documents"
          value={String(db.documents.length)}
          hint="In the demo vault"
          icon={<Files className="size-4" />}
          tone="indigo"
        />
        <StatCard
          label="Processed"
          value={String(processed)}
          hint="Parsed without errors"
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
        />
        <StatCard
          label="Rows imported"
          value={String(importedRows)}
          hint="Across all statements"
          icon={<FileSpreadsheet className="size-4" />}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {importEnabled ? (
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanText className="size-4 text-indigo-500" />
                Upload document
              </CardTitle>
              <CardDescription>
                CSV statements are parsed into transactions automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload />
            </CardContent>
          </Card>
        ) : (
          <FeatureDisabled
            title="Document import"
            description="Uploading and importing statements is disabled for this workspace. Re-enable it in Settings to import a CSV."
          />
        )}

        <div className="xl:col-span-2">
          <DocumentsTable documents={db.documents} />
        </div>
      </div>
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
      </div>
    </div>
  );
}
