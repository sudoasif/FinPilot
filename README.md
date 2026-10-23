# FinPilot AI

AI-powered finance operations for Indian small businesses — cash flow, invoicing, GST-ready reports, budgets, document import and a copilot that understands your books.

This repository is a working product demo built with **Next.js 16 (App Router, Cache Components)**, **React 19**, **Tailwind CSS 4**, **Radix UI**, **Recharts**, **Zod** and the **Vercel AI SDK**.

![FinPilot AI](https://img.shields.io/badge/Next.js-16.4-000?logo=nextdotjs) ![React](https://img.shields.io/badge/React-19.3-087ea4?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript) ![License](https://img.shields.io/badge/demo-only-f59e0b)

## Demo

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with:

| Field | Value |
| --- | --- |
| Email | `demo@finpilot.ai` |
| Password | `finpilot123` |

The workspace is seeded with six months of realistic Indian business data — transactions, customers, vendors, GST invoices, budgets, bank accounts and documents.

> This is a product demo. Do not enter real financial data.

## What's included

- **Dashboard** — cash position, revenue, expenses, profit, runway, cash-flow chart, expense mix, invoice health and budget watch.
- **Transactions** — search, filter by type/category/account, add income or expenses, toggle reconciliation, delete, export CSV.
- **Invoices** — GST line items, automatic invoice numbers, status tracking (draft / sent / paid / overdue), mark paid, export CSV.
- **Banking** — balances across current, savings, cash and credit accounts plus recent account activity.
- **Budgets** — monthly limits per expense category, progress vs actuals, edit and delete.
- **Reports** — six-month P&L, margin, GST estimate, expense breakdown, receivables aging, CSV exports.
- **Chart of accounts** — a clean India-ready ledger grouped into assets, liabilities, equity, income and expenses.
- **Documents** — upload a CSV bank statement and import rows into transactions; store PDFs and images for records.
- **Intelligence** — health score, savings rate, runway and prioritised signals generated from your live numbers.
- **AI Copilot** — ask questions about spend, income, invoices, budgets, GST, cash and runway.
- **Contacts** — customers and vendors with GSTIN, contact details and billed revenue.
- **Settings** — business profile, invoice prefix, payment terms, financial year, feature toggles and demo reset.

## AI Copilot

The copilot always works out of the box. Without a model key it uses a deterministic local analyst that reads the same financial snapshot and answers questions in INR. Nothing is sent anywhere.

To enable the language-model path, add to `.env.local`:

```bash
OPENAI_API_KEY=sk-...
# optional
AI_MODEL_CHAT=gpt-4o-mini
```

If the model call fails, FinPilot automatically falls back to the local analyst.

## Tech notes

- **Next.js 16.4** with `cacheComponents` and `partialPrefetching` enabled. Dynamic data is streamed behind `<Suspense>` boundaries with page-level skeletons.
- **Server Actions** handle all mutations, with Zod validation and `revalidatePath`.
- **Auth** is a demo signed HTTP-only cookie (HMAC) verified in both `proxy.ts` and every server action/API route. Replace with NextAuth/Supabase Auth for production.
- **Storage** is a small file-backed JSON database at `data/finpilot.json`, created on first request and excluded from git. It persists across dev-server restarts on one machine.
- **AI SDK 7** is imported dynamically only when `OPENAI_API_KEY` is present, so builds and offline usage stay lean.
- **Charts** use Recharts in client components; everything else is server-rendered where possible.

### Environment variables

Only these are used by the current demo:

```bash
AUTH_SECRET=...          # optional in dev; set a 32+ char secret in production
OPENAI_API_KEY=...       # optional; enables model-backed copilot answers
AI_MODEL_CHAT=gpt-4o-mini
```

The Supabase, email and OAuth variables in `.env.example` are placeholders for a production deployment and are not required to run the demo. `src/lib/env.ts` documents the full intended configuration.

## Scripts

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
npx tsc --noEmit # type check
```

## Production checklist

This demo is intentionally self-contained. Before using it with real money or multiple users:

1. Replace the JSON store with Supabase Postgres and add schema migrations.
2. Replace demo cookie auth with NextAuth or Supabase Auth, and set `AUTH_SECRET`.
3. Move document storage to Supabase Storage or Vercel Blob.
4. Add audit logs, role-based access and backups.
5. Review GST calculations with a chartered accountant — the report estimates are planning aids, not filings.

## Project structure

```text
src/
  actions/            Server actions (auth, transactions, invoices, contacts, budgets, documents, settings)
  app/
    (auth)/login/     Demo sign-in
    (dashboard)/      App shell + all workspace pages
    api/              Copilot and CSV export route handlers
  components/
    charts/           Recharts client components
    layout/           Sidebar, topbar and app shell
    ui/               Radix + Tailwind primitives
    ...               Feature components
  lib/                Analytics, insights, copilot, seed, store, session, formatting
  proxy.ts            Auth gate (Next.js 16 Proxy)
  types/              Shared domain types
data/                 Local demo database (created at runtime, gitignored)
```

---

Built as a demonstration of a modern finance OS for Indian founders. Not affiliated with any accounting body; not financial advice.
