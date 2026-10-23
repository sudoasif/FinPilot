import type {
  AppSettings,
  BankAccount,
  Budget,
  Contact,
  Database,
  DocumentRecord,
  Invoice,
  LedgerAccount,
  Transaction,
} from "@/types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function iso(year: number, monthIndex: number, day: number) {
  const date = new Date(year, monthIndex, day);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return iso(date.getFullYear(), date.getMonth(), date.getDate());
}

function ts(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString();
}

const ACCOUNT_IDS = {
  hdfc: "acc_hdfc_current",
  icici: "acc_icici_savings",
  cash: "acc_cash",
  card: "acc_hdfc_card",
};

const CONTACT_IDS = {
  aureole: "con_aureole",
  meridian: "con_meridian",
  northstar: "con_northstar",
  kiran: "con_kiran",
  lumen: "con_lumen",
  wework: "con_wework",
  zoho: "con_zoho",
  aws: "con_aws",
  sharma: "con_sharma",
  bluedart: "con_bluedart",
};

function contacts(): Contact[] {
  return [
    {
      id: CONTACT_IDS.aureole,
      name: "Aureole Technologies",
      type: "customer",
      email: "accounts@aureole.tech",
      phone: "+91 98200 11223",
      gstin: "27AABCA1234D1Z5",
      city: "Mumbai",
      createdAt: ts(210),
    },
    {
      id: CONTACT_IDS.meridian,
      name: "Meridian Retail",
      type: "customer",
      email: "finance@meridianretail.in",
      phone: "+91 98111 33445",
      gstin: "07AACCM5678E1Z2",
      city: "New Delhi",
      createdAt: ts(190),
    },
    {
      id: CONTACT_IDS.northstar,
      name: "Northstar Logistics",
      type: "customer",
      email: "ap@northstarlogistics.com",
      phone: "+91 99400 55667",
      gstin: "29AADCN9012F1Z8",
      city: "Bengaluru",
      createdAt: ts(165),
    },
    {
      id: CONTACT_IDS.kiran,
      name: "Kiran Exports",
      type: "customer",
      email: "hello@kiranexports.in",
      phone: "+91 98980 77889",
      gstin: "24AAECK3456G1Z1",
      city: "Ahmedabad",
      createdAt: ts(120),
    },
    {
      id: CONTACT_IDS.lumen,
      name: "Lumen Studio",
      type: "customer",
      email: "billing@lumen.studio",
      phone: "+91 90040 22334",
      city: "Pune",
      createdAt: ts(95),
    },
    {
      id: CONTACT_IDS.wework,
      name: "WeWork India",
      type: "vendor",
      email: "billing@wework.co.in",
      phone: "+91 80 4567 8900",
      gstin: "29AAACW7890H1Z4",
      city: "Bengaluru",
      createdAt: ts(300),
    },
    {
      id: CONTACT_IDS.zoho,
      name: "Zoho Corporation",
      type: "vendor",
      email: "ar@zoho.com",
      phone: "+91 44 6740 6000",
      gstin: "33AABCZ1234J1Z9",
      city: "Chennai",
      createdAt: ts(280),
    },
    {
      id: CONTACT_IDS.aws,
      name: "AWS India",
      type: "vendor",
      email: "aws-billing@amazon.com",
      phone: "+91 22 6612 0000",
      city: "Mumbai",
      createdAt: ts(260),
    },
    {
      id: CONTACT_IDS.sharma,
      name: "Sharma & Associates",
      type: "vendor",
      email: "ca@sharmaassociates.in",
      phone: "+91 98300 66778",
      city: "Mumbai",
      createdAt: ts(240),
    },
    {
      id: CONTACT_IDS.bluedart,
      name: "Blue Dart Express",
      type: "vendor",
      email: "corporate@bluedart.com",
      phone: "+91 1860 233 1234",
      gstin: "27AAACB1234K1Z3",
      city: "Mumbai",
      createdAt: ts(200),
    },
  ];
}

function accounts(): BankAccount[] {
  return [
    {
      id: ACCOUNT_IDS.hdfc,
      name: "Business Current",
      bank: "HDFC Bank",
      accountNumber: "•••• 4821",
      ifsc: "HDFC0000123",
      type: "current",
      balance: 482350,
    },
    {
      id: ACCOUNT_IDS.icici,
      name: "Tax Reserve",
      bank: "ICICI Bank",
      accountNumber: "•••• 7710",
      ifsc: "ICIC0000456",
      type: "savings",
      balance: 215780,
    },
    {
      id: ACCOUNT_IDS.cash,
      name: "Petty Cash",
      bank: "Cash",
      accountNumber: "—",
      ifsc: "—",
      type: "cash",
      balance: 18450,
    },
    {
      id: ACCOUNT_IDS.card,
      name: "Business Credit Card",
      bank: "HDFC Bank",
      accountNumber: "•••• 3390",
      ifsc: "—",
      type: "credit",
      balance: -42300,
    },
  ];
}

function transactions(): Transaction[] {
  const rows: Transaction[] = [];
  const now = new Date();
  let serial = 0;

  const push = (input: Omit<Transaction, "id" | "createdAt">) => {
    serial += 1;
    rows.push({
      ...input,
      id: `txn_${String(serial).padStart(4, "0")}`,
      createdAt: new Date(`${input.date}T09:00:00`).toISOString(),
    });
  };

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();
    const isCurrent = offset === 0;
    const maxDay = isCurrent
      ? now.getDate()
      : new Date(year, monthIndex + 1, 0).getDate();
    const jitter = 1 + (((offset * 7) % 5) - 2) / 100;

    const add = (
      day: number,
      type: Transaction["type"],
      description: string,
      amount: number,
      category: string,
      accountId: string,
      contactId?: string,
      status: Transaction["status"] = "cleared",
    ) => {
      if (day > maxDay) return;
      push({
        date: iso(year, monthIndex, day),
        description,
        amount: Math.round(amount),
        type,
        category,
        accountId,
        contactId,
        status,
        reference:
          type === "income"
            ? `FP-${year}${pad(monthIndex + 1)}-${pad(day)}`
            : undefined,
      });
    };

    add(1, "expense", "Team payroll", 142000, "Salaries", ACCOUNT_IDS.hdfc);
    add(3, "income", "Monthly retainer — Aureole Technologies", 185000 * jitter, "Retainers", ACCOUNT_IDS.hdfc, CONTACT_IDS.aureole);
    add(5, "expense", "Office rent — WeWork BKC", 45000, "Rent", ACCOUNT_IDS.hdfc, CONTACT_IDS.wework);
    add(7, "expense", "Zoho One subscription", 4500, "Software", ACCOUNT_IDS.card, CONTACT_IDS.zoho);
    add(8, "expense", "Airtel business broadband", 3200, "Telecom", ACCOUNT_IDS.hdfc);
    add(9, "expense", "AWS cloud hosting", 12800 + offset * 240, "Software", ACCOUNT_IDS.card, CONTACT_IDS.aws);
    add(11, "expense", "Office supplies — Stationery Mart", 6500, "Office Supplies", ACCOUNT_IDS.cash);
    add(12, "income", "ERP implementation — Meridian Retail", 95000, "Consulting", ACCOUNT_IDS.hdfc, CONTACT_IDS.meridian);
    add(14, "expense", "Performance marketing", 28000, "Marketing", ACCOUNT_IDS.card);
    add(16, "expense", "Reliance Energy bill", 8400, "Utilities", ACCOUNT_IDS.hdfc);
    add(18, "income", "Product sales — Northstar Logistics", 72000 + ((offset * 13) % 24) * 1000, "Sales", ACCOUNT_IDS.hdfc, CONTACT_IDS.northstar);
    add(20, "expense", "Travel & client visits", 12000 + (offset % 3) * 1500, "Travel", ACCOUNT_IDS.card);
    add(20, "expense", "GST payment", 42000, "Taxes", ACCOUNT_IDS.icici);
    add(22, "expense", "CA retainer — Sharma & Associates", 18000, "Professional Fees", ACCOUNT_IDS.hdfc, CONTACT_IDS.sharma);
    add(24, "income", "Brand strategy — Lumen Studio", 45000, "Consulting", ACCOUNT_IDS.hdfc, CONTACT_IDS.lumen);
    add(26, "expense", "Courier & logistics", 4200, "Office Supplies", ACCOUNT_IDS.cash, CONTACT_IDS.bluedart);
    add(28, "expense", "Bank charges & AMC", 1200, "Bank Charges", ACCOUNT_IDS.hdfc);

    if (offset === 2) {
      add(21, "income", "Website redesign — Kiran Exports", 145000, "Consulting", ACCOUNT_IDS.hdfc, CONTACT_IDS.kiran);
    }
    if (offset === 4) {
      add(15, "income", "Annual license — Meridian Retail", 88000, "Sales", ACCOUNT_IDS.hdfc, CONTACT_IDS.meridian);
    }
    if (offset === 0) {
      add(Math.min(now.getDate(), 19), "expense", "Diwali client gifting", 15600, "Marketing", ACCOUNT_IDS.card, undefined, "pending");
    }
  }

  return rows;
}

function invoices(): Invoice[] {
  const year = new Date().getFullYear();
  const rows: Invoice[] = [
    {
      id: "inv_001",
      number: `INV-${year}-001`,
      contactId: CONTACT_IDS.aureole,
      issueDate: daysAgo(64),
      dueDate: daysAgo(49),
      status: "paid",
      items: [
        { description: "Monthly growth retainer", quantity: 1, rate: 185000, gstRate: 18 },
      ],
      createdAt: ts(64),
    },
    {
      id: "inv_002",
      number: `INV-${year}-002`,
      contactId: CONTACT_IDS.meridian,
      issueDate: daysAgo(42),
      dueDate: daysAgo(27),
      status: "paid",
      items: [
        { description: "ERP implementation — phase 1", quantity: 1, rate: 95000, gstRate: 18 },
        { description: "On-site training (2 days)", quantity: 2, rate: 15000, gstRate: 18 },
      ],
      createdAt: ts(42),
    },
    {
      id: "inv_003",
      number: `INV-${year}-003`,
      contactId: CONTACT_IDS.northstar,
      issueDate: daysAgo(35),
      dueDate: daysAgo(20),
      status: "paid",
      items: [
        { description: "Logistics dashboard licence", quantity: 1, rate: 88000, gstRate: 18 },
      ],
      createdAt: ts(35),
    },
    {
      id: "inv_004",
      number: `INV-${year}-004`,
      contactId: CONTACT_IDS.kiran,
      issueDate: daysAgo(28),
      dueDate: daysAgo(13),
      status: "overdue",
      items: [
        { description: "Website redesign — milestone 2", quantity: 1, rate: 145000, gstRate: 18 },
      ],
      notes: "Follow up on payment status with Kiran's finance team.",
      createdAt: ts(28),
    },
    {
      id: "inv_005",
      number: `INV-${year}-005`,
      contactId: CONTACT_IDS.lumen,
      issueDate: daysAgo(20),
      dueDate: daysAgo(-10),
      status: "sent",
      items: [
        { description: "Brand strategy sprint", quantity: 1, rate: 45000, gstRate: 18 },
        { description: "Design workshop", quantity: 3, rate: 8000, gstRate: 18 },
      ],
      createdAt: ts(20),
    },
    {
      id: "inv_006",
      number: `INV-${year}-006`,
      contactId: CONTACT_IDS.aureole,
      issueDate: daysAgo(14),
      dueDate: daysAgo(-1),
      status: "sent",
      items: [
        { description: "Monthly growth retainer", quantity: 1, rate: 185000, gstRate: 18 },
      ],
      createdAt: ts(14),
    },
    {
      id: "inv_007",
      number: `INV-${year}-007`,
      contactId: CONTACT_IDS.meridian,
      issueDate: daysAgo(12),
      dueDate: daysAgo(2),
      status: "overdue",
      items: [
        { description: "ERP implementation — phase 2", quantity: 1, rate: 120000, gstRate: 18 },
        { description: "Data migration", quantity: 1, rate: 25000, gstRate: 18 },
      ],
      createdAt: ts(12),
    },
    {
      id: "inv_008",
      number: `INV-${year}-008`,
      contactId: CONTACT_IDS.northstar,
      issueDate: daysAgo(6),
      dueDate: daysAgo(-9),
      status: "sent",
      items: [
        { description: "API integration support", quantity: 16, rate: 4500, gstRate: 18 },
      ],
      createdAt: ts(6),
    },
    {
      id: "inv_009",
      number: `INV-${year}-009`,
      contactId: CONTACT_IDS.lumen,
      issueDate: daysAgo(3),
      dueDate: daysAgo(-12),
      status: "draft",
      items: [
        { description: "Quarterly design retainer", quantity: 1, rate: 65000, gstRate: 18 },
      ],
      createdAt: ts(3),
    },
    {
      id: "inv_010",
      number: `INV-${year}-010`,
      contactId: CONTACT_IDS.kiran,
      issueDate: daysAgo(1),
      dueDate: daysAgo(-14),
      status: "sent",
      items: [
        { description: "Website redesign — milestone 3", quantity: 1, rate: 95000, gstRate: 18 },
      ],
      createdAt: ts(1),
    },
  ];
  return rows;
}

function budgets(): Budget[] {
  return [
    { id: "bud_1", category: "Salaries", monthlyLimit: 160000 },
    { id: "bud_2", category: "Rent", monthlyLimit: 50000 },
    { id: "bud_3", category: "Software", monthlyLimit: 25000 },
    { id: "bud_4", category: "Marketing", monthlyLimit: 30000 },
    { id: "bud_5", category: "Travel", monthlyLimit: 20000 },
    { id: "bud_6", category: "Utilities", monthlyLimit: 15000 },
    { id: "bud_7", category: "Office Supplies", monthlyLimit: 10000 },
    { id: "bud_8", category: "Professional Fees", monthlyLimit: 25000 },
    { id: "bud_9", category: "Taxes", monthlyLimit: 50000 },
  ];
}

function ledger(): LedgerAccount[] {
  return [
    { id: "led_1000", code: "1000", name: "Cash & Bank", type: "asset", description: "Operating bank accounts and petty cash" },
    { id: "led_1100", code: "1100", name: "Accounts Receivable", type: "asset", description: "Amounts due from customers" },
    { id: "led_1200", code: "1200", name: "Inventory", type: "asset", description: "Goods held for resale" },
    { id: "led_1500", code: "1500", name: "Fixed Assets", type: "asset", description: "Computers, furniture and equipment" },
    { id: "led_2000", code: "2000", name: "Accounts Payable", type: "liability", description: "Amounts owed to vendors" },
    { id: "led_2100", code: "2100", name: "GST Payable", type: "liability", description: "GST collected, net of input credit" },
    { id: "led_2200", code: "2200", name: "Loans & Borrowings", type: "liability", description: "Term loans and credit facilities" },
    { id: "led_3000", code: "3000", name: "Owner's Equity", type: "equity", description: "Capital contributed by promoters" },
    { id: "led_3100", code: "3100", name: "Retained Earnings", type: "equity", description: "Accumulated profits" },
    { id: "led_4000", code: "4000", name: "Sales Revenue", type: "income", description: "Product and licence sales" },
    { id: "led_4100", code: "4100", name: "Consulting Income", type: "income", description: "Implementation and advisory fees" },
    { id: "led_4200", code: "4200", name: "Retainer Income", type: "income", description: "Recurring monthly retainers" },
    { id: "led_5000", code: "5000", name: "Salaries", type: "expense", description: "Payroll and contractor costs" },
    { id: "led_5100", code: "5100", name: "Rent", type: "expense", description: "Office and coworking rent" },
    { id: "led_5200", code: "5200", name: "Software & Subscriptions", type: "expense", description: "SaaS tools and cloud services" },
    { id: "led_5300", code: "5300", name: "Marketing", type: "expense", description: "Ads, events and brand spend" },
    { id: "led_5400", code: "5400", name: "Utilities", type: "expense", description: "Electricity and internet" },
    { id: "led_5500", code: "5500", name: "Travel", type: "expense", description: "Client visits and transport" },
    { id: "led_5600", code: "5600", name: "Office Supplies", type: "expense", description: "Consumables and courier" },
    { id: "led_5700", code: "5700", name: "Professional Fees", type: "expense", description: "Legal, audit and CA fees" },
    { id: "led_5800", code: "5800", name: "Bank Charges", type: "expense", description: "Bank fees and payment gateway charges" },
    { id: "led_5900", code: "5900", name: "Taxes", type: "expense", description: "GST, TDS and statutory dues" },
  ];
}

function documents(): DocumentRecord[] {
  return [
    {
      id: "doc_001",
      name: "hdfc-current-statement.csv",
      kind: "csv",
      sizeKb: 184,
      uploadedAt: daysAgo(9),
      status: "processed",
      importedCount: 42,
      note: "Bank statement imported and reconciled",
    },
    {
      id: "doc_002",
      name: "inv-2026-004-kiran.pdf",
      kind: "pdf",
      sizeKb: 268,
      uploadedAt: daysAgo(12),
      status: "stored",
      note: "Stored for records — PDF import coming soon",
    },
    {
      id: "doc_003",
      name: "gst-return-q2.xlsx",
      kind: "other",
      sizeKb: 96,
      uploadedAt: daysAgo(26),
      status: "stored",
      note: "Quarterly GST working file",
    },
    {
      id: "doc_004",
      name: "payroll-october.csv",
      kind: "csv",
      sizeKb: 38,
      uploadedAt: daysAgo(4),
      status: "processed",
      importedCount: 8,
      note: "8 payroll entries imported",
    },
  ];
}

function settings(): AppSettings {
  return {
    businessName: "FinPilot Demo Co.",
    legalName: "FinPilot Demo Private Limited",
    gstin: "27AABCF1234D1Z5",
    pan: "AABCF1234D",
    email: "finance@finpilotdemo.in",
    phone: "+91 98200 44556",
    address: "Unit 402, WeWork BKC, Bandra East, Mumbai 400051",
    currency: "INR",
    locale: "en-IN",
    timezone: "Asia/Kolkata",
    financialYearStart: "04-01",
    invoicePrefix: "INV",
    paymentTermsDays: 15,
    enableAiInsights: true,
    enableCopilot: true,
    enableDocumentImport: true,
  };
}

export function createSeedDatabase(): Database {
  return {
    version: 1,
    settings: settings(),
    accounts: accounts(),
    contacts: contacts(),
    transactions: transactions(),
    invoices: invoices(),
    budgets: budgets(),
    ledger: ledger(),
    documents: documents(),
  };
}

export const seedAccountIds = ACCOUNT_IDS;
export const seedContactIds = CONTACT_IDS;
