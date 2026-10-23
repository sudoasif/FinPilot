import { revalidatePath } from "next/cache";

export function revalidateFinance() {
  for (const path of [
    "/dashboard",
    "/transactions",
    "/invoices",
    "/banking",
    "/budgets",
    "/reports",
    "/insights",
    "/documents",
    "/contacts",
    "/settings",
    "/chart-of-accounts",
    "/copilot",
  ]) {
    revalidatePath(path);
  }
}
