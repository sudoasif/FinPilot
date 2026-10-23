"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { importDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/types";

const initialState: ActionState = { ok: false, message: "" };

export function DocumentUpload() {
  const [state, setState] = useState<ActionState>(initialState);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await importDocument(initialState, formData);
      setState(result);
      if (result.ok) {
        form.reset();
        setFileName("");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label
        htmlFor="document-file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white text-indigo-500 shadow-sm">
          <UploadCloud className="size-5" />
        </span>
        <span className="text-xs font-medium text-slate-700">
          {fileName || "Choose a CSV, PDF or image"}
        </span>
        <span className="text-[10px] text-slate-400">
          CSV imports transactions · max 2 MB
        </span>
        <input
          id="document-file"
          name="file"
          type="file"
          accept=".csv,.pdf,.png,.jpg,.jpeg,.webp"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          required
        />
      </label>

      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[10px] leading-relaxed text-slate-500">
        <p className="font-medium text-slate-600">CSV format</p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
          date, description, amount, type, category
        </p>
        <p className="mt-1">
          Dates can be YYYY-MM-DD or DD/MM/YYYY. Type can be income/expense or
          credit/debit.
        </p>
      </div>

      {state.message ? (
        <p
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          ) : null}
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        size="sm"
        disabled={pending || !fileName}
        className="w-full"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <FileSpreadsheet className="size-4" />
            Upload & import
          </>
        )}
      </Button>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <FileText className="size-3" />
        PDFs are stored for records; CSV rows become transactions.
      </p>
    </form>
  );
}
