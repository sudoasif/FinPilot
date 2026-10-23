export const INCOME_CATEGORIES = [
  "Sales",
  "Consulting",
  "Retainers",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Rent",
  "Software",
  "Marketing",
  "Travel",
  "Utilities",
  "Office Supplies",
  "Professional Fees",
  "Bank Charges",
  "Taxes",
  "Telecom",
] as const;

export const ALL_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Salaries: "#6366f1",
  Rent: "#8b5cf6",
  Software: "#06b6d4",
  Marketing: "#f59e0b",
  Travel: "#ec4899",
  Utilities: "#14b8a6",
  "Office Supplies": "#84cc16",
  "Professional Fees": "#f97316",
  "Bank Charges": "#64748b",
  Taxes: "#ef4444",
  Telecom: "#0ea5e9",
  Sales: "#10b981",
  Consulting: "#22c55e",
  Retainers: "#34d399",
  "Other Income": "#a3e635",
};

export const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#ef4444",
  "#64748b",
  "#0ea5e9",
];

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#6366f1";
}
