"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  insights: "Intelligence",
  copilot: "AI Copilot",
  transactions: "Transactions",
  invoices: "Invoices",
  banking: "Banking",
  budgets: "Budgets",
  reports: "Reports",
  "chart-of-accounts": "Chart of Accounts",
  documents: "Documents",
  contacts: "Contacts",
  settings: "Settings",
};

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const label = PAGE_LABELS[segment] ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Workspace
        </p>
        <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/transactions"
          className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-500 shadow-sm transition-colors hover:bg-slate-50 md:flex"
        >
          <Search className="size-3.5" />
          <span>Search transactions</span>
          <kbd className="ml-4 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </Link>

        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/copilot">
            <Sparkles className="size-3.5 text-indigo-500" />
            Copilot
          </Link>
        </Button>

        <Link
          href="/insights"
          className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Open intelligence"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors hover:bg-slate-100 focus:outline-none"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-semibold text-emerald-950">
                AM
              </span>
              <span className="hidden text-left leading-tight lg:block">
                <span className="block text-xs font-medium text-slate-800">
                  Asif Mallick
                </span>
                <span className="block text-[10px] text-slate-400">
                  Demo admin
                </span>
              </span>
              <ChevronDown className="hidden size-3.5 text-slate-400 lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-xs font-medium text-slate-800">
                Asif Mallick
              </span>
              <span className="block text-[11px] font-normal text-slate-400">
                demo@finpilot.ai
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings2 />
                Workspace settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/copilot">
                <Sparkles />
                Ask the copilot
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem asChild variant="danger">
                <button type="submit" className="w-full">
                  <LogOut />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
