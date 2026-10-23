import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the FinPilot AI demo workspace.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden flex-1 overflow-hidden bg-[#0B1220] px-10 py-12 text-white lg:flex lg:flex-col xl:px-16">
        <div className="pointer-events-none absolute -left-24 top-24 size-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-violet-600/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-lg shadow-indigo-950/50">
            <Sparkles className="size-4 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            FinPilot <span className="text-indigo-300">AI</span>
          </span>
        </Link>

        <div className="relative mt-16 max-w-lg">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-indigo-200">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Finance OS for Indian businesses
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
            Your books,
            <br />
            on autopilot.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Cash flow, invoices, budgets and GST-ready reports in one calm
            workspace — with an AI copilot that actually understands your
            numbers.
          </p>

          <div className="mt-9 grid gap-3">
            {[
              {
                icon: Sparkles,
                title: "Copilot with context",
                description:
                  "Ask about runway, overdue invoices or where spend is leaking.",
              },
              {
                icon: IndianRupee,
                title: "Built for INR & GST",
                description:
                  "Indian financial year, GST line items and lakh/crore formatting.",
              },
              {
                icon: ShieldCheck,
                title: "Self-contained demo",
                description:
                  "No external AI service required — the copilot works offline with your workspace data.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <feature.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-auto pt-12">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>This month</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <TrendingUp className="size-3.5" /> +18.4%
              </span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-white">
                  ₹4,27,050
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Revenue across 12 transactions
                </p>
              </div>
              <ArrowUpRight className="size-5 text-indigo-300" />
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              {[38, 52, 44, 68, 58, 76, 64, 88, 72, 94, 82, 100].map(
                (height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500/40 to-indigo-300"
                    style={{ height: `${height * 0.42}px` }}
                  />
                ),
              )}
            </div>
          </div>
          <p className="mt-6 text-[11px] text-slate-500">
            FinPilot AI · Demo workspace · Built with Next.js 16
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-600/25">
              <Sparkles className="size-4 text-white" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              FinPilot <span className="text-indigo-600">AI</span>
            </span>
          </div>

          <div className="mb-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Demo workspace
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to explore six months of live financial data, reports and
              the AI copilot.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-[11px] text-slate-400">
            This is a product demo. Do not enter real financial data.
          </p>
        </div>
      </section>
    </div>
  );
}
