"use client";

import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Search,
  Trash2,
} from "lucide-react";
import { deleteDocument } from "@/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import type { DocumentRecord } from "@/types";

const ICONS = {
  csv: FileSpreadsheet,
  pdf: FileText,
  image: ImageIcon,
  other: FileText,
} as const;

export function DocumentsTable({ documents }: { documents: DocumentRecord[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentRecord["status"]>("all");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...documents]
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
      .filter((document) => {
        if (status !== "all" && document.status !== status) return false;
        if (!search) return true;
        return document.name.toLowerCase().includes(search);
      });
  }, [documents, query, status]);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {(["all", "processed", "stored", "failed"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  status === option
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            className="m-4 border-0 bg-transparent"
            icon={<FileText className="size-4" />}
            title="No documents yet"
            description="Upload a bank statement CSV to import transactions."
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((document) => {
              const Icon = ICONS[document.kind];
              return (
                <div
                  key={document.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {document.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(document.uploadedAt)} · {document.sizeKb} KB
                      {document.importedCount
                        ? ` · ${document.importedCount} rows imported`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      document.status === "processed"
                        ? "success"
                        : document.status === "failed"
                          ? "danger"
                          : "secondary"
                    }
                  >
                    {document.status}
                  </Badge>
                  <form
                    action={deleteDocument}
                    onSubmit={(event) => {
                      if (
                        !window.confirm(`Delete ${document.name} from records?`)
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={document.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      className="text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete document"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
