"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  Building2,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  ScanText,
  Settings2,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/insights", label: "Intelligence", icon: Sparkles },
      { href: "/copilot", label: "AI Copilot", icon: Bot, badge: "AI" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/banking", label: "Banking", icon: Building2 },
      { href: "/budgets", label: "Budgets", icon: Target },
    ],
  },
  {
    label: "Books",
    items: [
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/chart-of-accounts", label: "Chart of Accounts", icon: BookOpen },
      { href: "/documents", label: "Documents", icon: ScanText },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings2 },
    ],
  },
];

export function Sidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r border-white/5 bg-[#0B1220] text-slate-300",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-950/40">
          <Sparkles className="size-4 text-white" />
        </span>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-[15px] font-semibold tracking-tight text-white"
        >
          FinPilot <span className="text-indigo-300">AI</span>
        </Link>
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-left transition-colors hover:bg-white/[0.07]"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-semibold text-indigo-200">
            FD
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-white">
              FinPilot Demo Co.
            </span>
            <span className="block text-[10px] text-slate-500">
              Demo workspace
            </span>
          </span>
          <span className="size-1.5 rounded-full bg-emerald-400" />
        </button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 shrink-0",
                        active
                          ? "text-indigo-300"
                          : "text-slate-500 group-hover:text-slate-300",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-200">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <div className="relative overflow-hidden rounded-xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent p-3.5">
          <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-indigo-500/20 blur-2xl" />
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/25 text-indigo-200">
              <Bot className="size-3.5" />
            </span>
            <p className="text-xs font-medium text-white">Ask FinPilot</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Get answers about runway, overdue invoices and spend.
          </p>
          <Link
            href="/copilot"
            onClick={onNavigate}
            className="mt-2.5 inline-flex text-[11px] font-medium text-indigo-300 hover:text-indigo-200"
          >
            Open copilot →
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-1.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-semibold text-emerald-950">
            AM
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              Asif Mallick
            </p>
            <p className="truncate text-[10px] text-slate-500">
              demo@finpilot.ai
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
