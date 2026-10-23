import {
  getBudgetStatuses,
  getCategoryBreakdown,
  getInvoiceStats,
  getKpis,
  getMonthlySeries,
  getReceivablesAging,
  getTopClients,
} from "@/lib/analytics";
import { formatDate, formatINR } from "@/lib/format";
import { effectiveInvoiceStatus, invoiceTotal } from "@/lib/invoice";
import type { Database } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotAnswer {
  reply: string;
  mode: "ai" | "local";
}

function pct(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function financialContext(db: Database) {
  const kpis = getKpis(db);
  const stats = getInvoiceStats(db);
  const budgets = getBudgetStatuses(db);
  const categories = getCategoryBreakdown(db, 5);
  const series = getMonthlySeries(db, 6);
  const clients = getTopClients(db, 5);
  const aging = getReceivablesAging(db);

  return {
    business: db.settings.businessName,
    currency: "INR",
    monthToDate: {
      income: kpis.income,
      expenses: kpis.expenses,
      profit: kpis.profit,
      marginPct: Number(kpis.margin.toFixed(1)),
      incomeChangePct: Number(kpis.incomeChange.toFixed(1)),
      expenseChangePct: Number(kpis.expenseChange.toFixed(1)),
    },
    cash: {
      total: kpis.cash,
      accounts: db.accounts.map((account) => ({
        name: account.name,
        bank: account.bank,
        balance: account.balance,
      })),
      runwayMonths: Number(kpis.runwayMonths.toFixed(1)),
    },
    invoices: {
      outstanding: stats.outstanding,
      overdue: stats.overdue,
      overdueCount: stats.overdueCount,
      draft: stats.draft,
      aging: aging.map((bucket) => ({
        bucket: bucket.label,
        amount: bucket.amount,
      })),
    },
    topExpenseCategories: categories.map((slice) => ({
      category: slice.category,
      amount: slice.amount,
      sharePct: Number(slice.share.toFixed(1)),
    })),
    budgets: budgets.map((item) => ({
      category: item.budget.category,
      limit: item.budget.monthlyLimit,
      spent: item.spent,
      percent: Number(item.percent.toFixed(0)),
      state: item.state,
    })),
    topClients: clients.map((client) => ({
      name: client.name,
      billed: client.amount,
    })),
    monthlyTrend: series.map((point) => ({
      month: point.label,
      income: point.income,
      expenses: point.expenses,
      profit: point.profit,
    })),
    openInvoices: db.invoices
      .filter((invoice) => {
        const status = effectiveInvoiceStatus(invoice);
        return status === "sent" || status === "overdue";
      })
      .map((invoice) => {
        const contact = db.contacts.find((item) => item.id === invoice.contactId);
        return {
          number: invoice.number,
          customer: contact?.name ?? "Unknown",
          dueDate: invoice.dueDate,
          amount: invoiceTotal(invoice),
          status: effectiveInvoiceStatus(invoice),
        };
      }),
  };
}

function overdueInvoices(db: Database) {
  return db.invoices
    .filter((invoice) => effectiveInvoiceStatus(invoice) === "overdue")
    .map((invoice) => {
      const contact = db.contacts.find((item) => item.id === invoice.contactId);
      return {
        number: invoice.number,
        customer: contact?.name ?? "Unknown customer",
        dueDate: invoice.dueDate,
        amount: invoiceTotal(invoice),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function answerLocally(question: string, db: Database): string {
  const q = question.toLowerCase();
  const kpis = getKpis(db);
  const stats = getInvoiceStats(db);
  const budgets = getBudgetStatuses(db);
  const categories = getCategoryBreakdown(db, 3);
  const overdue = overdueInvoices(db);

  const has = (...terms: string[]) => terms.some((term) => q.includes(term));

  if (has("overdue", "receivable", "collect", "pending payment", "outstanding")) {
    if (overdue.length === 0) {
      return `You have ${formatINR(stats.outstanding)} of open invoices, but none are past due. Nice work keeping collections current.\n\nOpen invoices: ${stats.openCount}. I would still send reminders five days before each due date.`;
    }
    const list = overdue
      .slice(0, 4)
      .map(
        (invoice) =>
          `• ${invoice.number} — ${invoice.customer}: ${formatINR(invoice.amount)} (due ${formatDate(invoice.dueDate)})`,
      )
      .join("\n");
    return `You have ${formatINR(stats.overdue)} overdue across ${stats.overdueCount} invoice${stats.overdueCount === 1 ? "" : "s"}:\n\n${list}\n\nSuggested next step: send a reminder today and offer a payment link. Following up on the largest invoice first has the biggest cash impact.`;
  }

  if (has("expense", "spend", "cost", "burn")) {
    const list = categories
      .map(
        (slice) =>
          `• ${slice.category}: ${formatINR(slice.amount)} (${slice.share.toFixed(0)}%)`,
      )
      .join("\n");
    const direction =
      kpis.expenseChange > 0
        ? `up ${pct(kpis.expenseChange)} versus last month`
        : `down ${pct(Math.abs(kpis.expenseChange))} versus last month`;
    return `This month you have spent ${formatINR(kpis.expenses)}, ${direction}.\n\nBiggest buckets:\n${list}\n\nIf you need to cut, start with the largest discretionary line rather than across-the-board cuts. Fixed costs like payroll and rent should be protected.`;
  }

  if (has("income", "revenue", "sales", "earn", "client")) {
    const clients = getTopClients(db, 3)
      .map((client) => `• ${client.name}: ${formatINR(client.amount)}`)
      .join("\n");
    return `Month-to-date revenue is ${formatINR(kpis.income)}, ${pct(kpis.incomeChange)} versus last month.\n\nTop clients by billed revenue:\n${clients}\n\nConcentration risk matters: if one client is more than a third of revenue, keep a healthy cash buffer and keep your pipeline warm.`;
  }

  if (has("profit", "margin", "runway", "burn", "survive")) {
    return `You are at ${formatINR(kpis.profit)} profit this month, a ${kpis.margin.toFixed(0)}% margin.\n\n• Cash across accounts: ${formatINR(kpis.cash)}\n• Liquid runway: about ${kpis.runwayMonths.toFixed(1)} months\n• Outstanding invoices: ${formatINR(stats.outstanding)}\n\n${kpis.runwayMonths < 3 ? "Runway is tight. Prioritise collections and hold non-critical hiring or software purchases." : "Runway looks reasonable. Keep the tax reserve funded before allocating surpluses."}`;
  }

  if (has("gst", "tax", "tds", "compliance")) {
    const estimate = Math.round(kpis.income * 0.18);
    const reserve = db.accounts.find((account) => account.id === "acc_icici_savings");
    return `Based on ${formatINR(kpis.income)} of month-to-date revenue, a rough 18% GST reserve is ${formatINR(estimate)}.\n\nYour tax reserve account currently holds ${formatINR(reserve?.balance ?? 0)}. This is a planning estimate, not a tax filing — confirm the actual liability with your CA after input credits.\n\nNext step: move surplus into the tax reserve before month end.`;
  }

  if (has("budget", "limit", "overspend")) {
    const over = budgets.filter((item) => item.state === "over");
    const near = budgets.filter((item) => item.state === "warning");
    if (over.length === 0 && near.length === 0) {
      return "Every budget is currently within its limit. Keep the momentum by reviewing next month's plan before the last week of the month.";
    }
    const lines = [...over, ...near]
      .slice(0, 5)
      .map(
        (item) =>
          `• ${item.budget.category}: ${formatINR(item.spent)} of ${formatINR(item.budget.monthlyLimit)} (${item.percent.toFixed(0)}%)`,
      )
      .join("\n");
    return `${over.length} budget${over.length === 1 ? " has" : "s have"} been exceeded, and ${near.length} ${near.length === 1 ? "is" : "are"} close to the limit:\n\n${lines}\n\nFreeze the overspent categories for the rest of the month and reallocate from a category with headroom.`;
  }

  if (has("cash", "bank", "balance", "account")) {
    const list = db.accounts
      .map(
        (account) =>
          `• ${account.name} (${account.bank}): ${formatINR(account.balance)}`,
      )
      .join("\n");
    return `Here is the current cash position:\n\n${list}\n\nTotal across accounts: ${formatINR(kpis.cash)}. The credit card balance is shown as a negative because it is a liability.\n\n${kpis.runwayMonths < 3 ? "With less than three months of runway, collections should be your top priority." : `At the current spend rate, this covers about ${kpis.runwayMonths.toFixed(1)} months of operations.`}`;
  }

  if (has("invoice", "bill", "draft")) {
    return `Invoice health:\n\n• ${formatINR(stats.outstanding)} outstanding across ${stats.openCount} open invoices\n• ${formatINR(stats.overdue)} overdue across ${stats.overdueCount} invoices\n• ${formatINR(stats.draft)} still in draft\n• ${formatINR(stats.paid)} collected from ${stats.paidCount} paid invoices\n\nQuick win: finalise drafts first, then send reminders for overdue invoices. That converts work already delivered into cash.`;
  }

  if (has("advice", "what should", "improve", "health", "risk", "summary", "how are")) {
    const actions: string[] = [];
    if (stats.overdueCount > 0) {
      actions.push(`Collect ${formatINR(stats.overdue)} overdue — biggest immediate lever.`);
    }
    const over = budgets.find((item) => item.state === "over");
    if (over) {
      actions.push(`Rein in ${over.budget.category} spend (${over.percent.toFixed(0)}% of budget).`);
    }
    if (kpis.income > 0) {
      actions.push(`Reserve about ${formatINR(Math.round(kpis.income * 0.18))} for GST.`);
    }
    if (kpis.expenseChange > 8) {
      actions.push(`Review the ${kpis.expenseChange.toFixed(0)}% month-on-month expense increase.`);
    }
    if (actions.length === 0) {
      actions.push("Keep invoicing cadence steady and maintain the tax reserve.");
    }
    return `Here is the current picture: revenue ${formatINR(kpis.income)}, expenses ${formatINR(kpis.expenses)}, profit ${formatINR(kpis.profit)} this month. Cash stands at ${formatINR(kpis.cash)} with roughly ${kpis.runwayMonths.toFixed(1)} months of runway.\n\nTop actions:\n${actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}`;
  }

  if (has("hi", "hello", "hey") && q.length < 20) {
    return `Hi! I am FinPilot Copilot. I can see your live demo books — revenue, expenses, invoices, budgets and bank balances.\n\nTry asking:\n• How are my finances this month?\n• Which invoices are overdue?\n• Where am I overspending?\n• How much should I set aside for GST?`;
  }

  return `Here is a quick overview: revenue ${formatINR(kpis.income)}, expenses ${formatINR(kpis.expenses)}, profit ${formatINR(kpis.profit)} this month. Cash is ${formatINR(kpis.cash)} and ${formatINR(stats.outstanding)} is outstanding from customers.\n\nYou can ask me about expenses, income, invoices, budgets, GST, cash flow or runway. ${stats.overdueCount > 0 ? `One thing to act on: ${stats.overdueCount} invoice${stats.overdueCount === 1 ? " is" : "s are"} overdue.` : "Everything is current on collections."}`;
}

async function answerWithAI(
  messages: ChatMessage[],
  db: Database,
): Promise<string> {
  const { generateText } = await import("ai");
  const { openai } = await import("@ai-sdk/openai");
  const context = financialContext(db);
  const transcript = messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const { text } = await generateText({
    model: openai(process.env.AI_MODEL_CHAT ?? "gpt-4o-mini"),
    instructions:
      "You are FinPilot Copilot, a concise financial analyst for an Indian small business. Use INR formatting (₹, lakh/crore is fine). Base every number strictly on the supplied financial snapshot. Never invent transactions or customers. Give short, practical answers with at most 4 bullet points. Do not provide regulated tax or investment advice; for GST, call estimates approximate and suggest confirming with a CA.",
    prompt: `Financial snapshot (JSON):\n${JSON.stringify(context)}\n\nConversation:\n${transcript}\n\nAnswer the latest user message using only this snapshot.`,
  });

  return text.trim();
}

export async function askCopilot(
  messages: ChatMessage[],
  db: Database,
): Promise<CopilotAnswer> {
  const question =
    [...messages].reverse().find((message) => message.role === "user")
      ?.content ?? "";

  if (process.env.OPENAI_API_KEY) {
    try {
      const reply = await answerWithAI(messages, db);
      if (reply) return { reply, mode: "ai" };
    } catch {
      // Fall back to the deterministic analyst below.
    }
  }

  return { reply: answerLocally(question, db), mode: "local" };
}
