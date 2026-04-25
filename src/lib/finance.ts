import type { Enums, Tables, TablesInsert } from "@/integrations/supabase/types";

export type FinanceAccount = Tables<"accounts">;
export type FinanceBudgetRow = Tables<"budgets">;
export type FinanceCategory = Tables<"categories">;
export type FinanceGoal = Tables<"goals">;
export type FinanceTransaction = Tables<"transactions">;

export type FinanceAccountType = Enums<"account_type">;
export type FinanceCurrency = Enums<"currency_code">;
export type FinanceTransactionType = Enums<"transaction_type">;

export interface FinanceBudgetSummary {
  id: string;
  categoryId: string;
  limit: number;
  spent: number;
  currency: FinanceCurrency;
}

export const DEFAULT_CATEGORIES: Array<
  Pick<TablesInsert<"categories">, "name" | "icon" | "color" | "type">
> = [
  {
    name: "Food & Drink",
    icon: "Utensils",
    color: "oklch(0.78 0.18 30)",
    type: "expense",
  },
  {
    name: "Transport",
    icon: "Car",
    color: "oklch(0.7 0.16 220)",
    type: "expense",
  },
  {
    name: "Shopping",
    icon: "ShoppingBag",
    color: "oklch(0.7 0.16 290)",
    type: "expense",
  },
  {
    name: "Rent",
    icon: "House",
    color: "oklch(0.7 0.14 200)",
    type: "expense",
  },
  {
    name: "Entertainment",
    icon: "Film",
    color: "oklch(0.78 0.16 340)",
    type: "expense",
  },
  {
    name: "Salary",
    icon: "Briefcase",
    color: "oklch(0.78 0.18 155)",
    type: "income",
  },
  {
    name: "Freelance",
    icon: "Laptop",
    color: "oklch(0.78 0.16 180)",
    type: "income",
  },
];

const currencyLocale: Record<FinanceCurrency, string> = {
  INR: "en-IN",
  USD: "en-US",
};

export function formatMoney(value: number, currency: FinanceCurrency = "USD") {
  return new Intl.NumberFormat(currencyLocale[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function fallbackCategory(type: "income" | "expense" = "expense"): FinanceCategory {
  return {
    id: `fallback-${type}`,
    created_at: "",
    user_id: "",
    name: type === "income" ? "Income" : "Uncategorized",
    icon: type === "income" ? "CircleDollarSign" : "Circle",
    color: type === "income" ? "oklch(0.78 0.18 155)" : "oklch(0.68 0.03 255)",
    type,
  };
}

export function accountGradient(account: Pick<FinanceAccount, "type" | "color">) {
  switch (account.type) {
    case "bank":
      return `linear-gradient(135deg, ${account.color}, color-mix(in oklab, ${account.color} 62%, oklch(0.2 0.04 215)))`;
    case "cash":
      return `linear-gradient(135deg, ${account.color}, oklch(0.66 0.18 70))`;
    case "wallet":
      return `linear-gradient(135deg, ${account.color}, oklch(0.64 0.18 260))`;
    case "credit":
      return `linear-gradient(135deg, color-mix(in oklab, ${account.color} 48%, oklch(0.3 0.03 270)), oklch(0.22 0.03 270))`;
    default:
      return `linear-gradient(135deg, ${account.color}, color-mix(in oklab, ${account.color} 55%, black))`;
  }
}

export function monthLabel(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getMonthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

export function getMonthTransactions(
  transactions: FinanceTransaction[],
  month = new Date(),
) {
  const { start, end } = getMonthBounds(month);
  const startTime = start.getTime();
  const endTime = end.getTime();

  return transactions.filter((transaction) => {
    const time = new Date(transaction.date).getTime();
    return time >= startTime && time < endTime;
  });
}

export function getMonthIncome(transactions: FinanceTransaction[], month = new Date()) {
  return getMonthTransactions(transactions, month)
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getMonthExpense(transactions: FinanceTransaction[], month = new Date()) {
  return getMonthTransactions(transactions, month)
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getTotalBalance(accounts: FinanceAccount[]) {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

export function buildCashFlowData(transactions: FinanceTransaction[], month = new Date()) {
  const daysInMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const dayCount = Math.min(
    month.getUTCFullYear() === new Date().getUTCFullYear() &&
      month.getUTCMonth() === new Date().getUTCMonth()
      ? new Date().getUTCDate()
      : daysInMonth,
    daysInMonth,
  );
  const rows = Array.from({ length: Math.max(dayCount, 1) }, (_, index) => ({
    day: String(index + 1),
    income: 0,
    expense: 0,
  }));

  for (const transaction of getMonthTransactions(transactions, month)) {
    const day = new Date(transaction.date).getUTCDate();
    const bucket = rows[day - 1];
    if (!bucket) continue;
    if (transaction.type === "income") {
      bucket.income += transaction.amount;
    }
    if (transaction.type === "expense") {
      bucket.expense += transaction.amount;
    }
  }

  return rows;
}

export function buildBudgetSummaries(
  budgets: FinanceBudgetRow[],
  transactions: FinanceTransaction[],
  month = new Date(),
): FinanceBudgetSummary[] {
  const monthKey = month.toISOString().slice(0, 7);
  const monthTransactions = getMonthTransactions(transactions, month);

  return budgets
    .filter((budget) => budget.month.slice(0, 7) === monthKey)
    .map((budget) => ({
      id: budget.id,
      categoryId: budget.category_id,
      limit: budget.amount_limit,
      spent: monthTransactions
        .filter(
          (transaction) =>
            transaction.type === "expense" && transaction.category_id === budget.category_id,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      currency: budget.currency,
    }));
}

export function defaultAccountColor(type: FinanceAccountType) {
  switch (type) {
    case "bank":
      return "oklch(0.72 0.18 175)";
    case "cash":
      return "oklch(0.74 0.18 55)";
    case "wallet":
      return "oklch(0.72 0.16 280)";
    case "credit":
      return "oklch(0.62 0.14 305)";
    default:
      return "oklch(0.72 0.18 175)";
  }
}