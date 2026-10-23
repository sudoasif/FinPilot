"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { deleteContact } from "@/actions/contacts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatINR, initials } from "@/lib/format";
import type { Contact } from "@/types";

export interface ContactView extends Contact {
  referenced: boolean;
  billed: number;
}

export function ContactsGrid({ contacts }: { contacts: ContactView[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "customer" | "vendor">("all");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (type !== "all" && contact.type !== type) return false;
      if (!search) return true;
      return (
        contact.name.toLowerCase().includes(search) ||
        contact.email.toLowerCase().includes(search) ||
        (contact.city ?? "").toLowerCase().includes(search)
      );
    });
  }, [contacts, query, type]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          {(["all", "customer", "vendor"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                type === option
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {option === "all" ? "All contacts" : `${option}s`}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or city…"
            className="pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-4" />}
          title="No contacts found"
          description="Add a customer or vendor to get started."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                    contact.type === "customer"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {initials(contact.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {contact.name}
                    </p>
                    <Badge
                      variant={contact.type === "customer" ? "default" : "warning"}
                    >
                      {contact.type}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="size-3" />
                    {contact.city || "India"}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px]">
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Mail className="size-3 shrink-0 text-slate-400" />
                  <span className="truncate">{contact.email}</span>
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="size-3 shrink-0 text-slate-400" />
                  {contact.phone}
                </p>
                {contact.gstin ? (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Building2 className="size-3 shrink-0 text-slate-400" />
                    <span className="font-mono text-[10px]">{contact.gstin}</span>
                  </p>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Billed
                  </p>
                  <p className="text-xs font-semibold text-slate-800">
                    {formatINR(contact.billed)}
                  </p>
                </div>
                <form
                  action={deleteContact}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        `Remove ${contact.name}? This cannot be undone.`,
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={contact.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    disabled={contact.referenced}
                    title={
                      contact.referenced
                        ? "Linked to invoices or transactions — cannot delete"
                        : "Delete contact"
                    }
                    className="text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
