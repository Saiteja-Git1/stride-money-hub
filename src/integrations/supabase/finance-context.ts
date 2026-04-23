import { createContext } from "react";
import type {
  FinanceAccount,
  FinanceAccountType,
  FinanceBudgetRow,
  FinanceBudgetSummary,
  FinanceCategory,
  FinanceCurrency,
  FinanceGoal,
  FinanceTransaction,
} from "@/lib/finance";

export interface AddAccountInput {
  balance: number;
  currency: FinanceCurrency;
  last4?: string;
  name: string;
  type: FinanceAccountType;
}

export interface AddTransactionInput {
  accountId: string;
  amount: number;
  categoryId?: string | null;
  currency: FinanceCurrency;
  date?: string;
  note: string;
  type: "income" | "expense";
}

export interface FinanceContextValue {
  loading: boolean;
  refreshing: boolean;
  accounts: FinanceAccount[];
  budgets: FinanceBudgetRow[];
  budgetSummaries: FinanceBudgetSummary[];
  categories: FinanceCategory[];
  goals: FinanceGoal[];
  transactions: FinanceTransaction[];
  addAccount: (input: AddAccountInput) => Promise<void>;
  addTransaction: (input: AddTransactionInput) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const FinanceContext = createContext<FinanceContextValue | null>(null);
