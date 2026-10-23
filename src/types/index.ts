export type TransactionType = "income" | "expense";
export type TransactionStatus = "cleared" | "pending";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type ContactType = "customer" | "vendor";
export type BankAccountType = "current" | "savings" | "cash" | "credit";
export type LedgerType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  accountId: string;
  contactId?: string;
  status: TransactionStatus;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email: string;
  phone: string;
  gstin?: string;
  city?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export interface Invoice {
  id: string;
  number: string;
  contactId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  ifsc: string;
  type: BankAccountType;
  balance: number;
}

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: LedgerType;
  description: string;
}

export type DocumentKind = "csv" | "pdf" | "image" | "other";
export type DocumentStatus = "processed" | "stored" | "failed";

export interface DocumentRecord {
  id: string;
  name: string;
  kind: DocumentKind;
  sizeKb: number;
  uploadedAt: string;
  status: DocumentStatus;
  importedCount?: number;
  note?: string;
}

export interface AppSettings {
  businessName: string;
  legalName: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  locale: string;
  timezone: string;
  financialYearStart: string;
  invoicePrefix: string;
  paymentTermsDays: number;
  enableAiInsights: boolean;
  enableCopilot: boolean;
  enableDocumentImport: boolean;
}

export interface Database {
  version: 1;
  settings: AppSettings;
  accounts: BankAccount[];
  contacts: Contact[];
  transactions: Transaction[];
  invoices: Invoice[];
  budgets: Budget[];
  ledger: LedgerAccount[];
  documents: DocumentRecord[];
}

export interface MonthlyPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface CategorySlice {
  category: string;
  amount: number;
  share: number;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percent: number;
  state: "healthy" | "warning" | "over";
}

export interface InvoiceStats {
  total: number;
  paid: number;
  outstanding: number;
  overdue: number;
  draft: number;
  paidCount: number;
  openCount: number;
  overdueCount: number;
}

export interface Insight {
  id: string;
  tone: "positive" | "neutral" | "warning" | "critical";
  icon:
    | "trend"
    | "alert"
    | "target"
    | "receipt"
    | "wallet"
    | "sparkles"
    | "shield";
  title: string;
  description: string;
  metric?: string;
  href?: string;
  cta?: string;
}

export interface ActionState {
  ok: boolean;
  message: string;
}
