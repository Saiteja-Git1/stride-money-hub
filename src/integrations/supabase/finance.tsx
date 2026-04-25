import { useEffect, useState, type ReactNode } from "react";
import type { PostgrestError, User } from "@supabase/supabase-js";
import { supabase } from "./client";
import { useAuth } from "./use-auth";
import {
  DEFAULT_CATEGORIES,
  buildBudgetSummaries,
  defaultAccountColor,
  type FinanceAccount,
  type FinanceBudgetRow,
  type FinanceCategory,
  type FinanceGoal,
  type FinanceTransaction,
} from "@/lib/finance";
import {
  FinanceContext,
  type AddAccountInput,
  type AddTransactionInput,
} from "./finance-context";

interface FinanceSnapshot {
  accounts: FinanceAccount[];
  budgets: FinanceBudgetRow[];
  categories: FinanceCategory[];
  goals: FinanceGoal[];
  transactions: FinanceTransaction[];
}

function fallbackProfileName(user: User) {
  const metadataName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";

  if (metadataName) return metadataName;
  if (user.email) return user.email.split("@")[0] ?? "Stride user";
  return "Stride user";
}

async function throwOnError(error: PostgrestError | null) {
  if (error) {
    throw error;
  }
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [budgets, setBudgets] = useState<FinanceBudgetRow[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function ensureBootstrap(nextUser: User) {
    const name = fallbackProfileName(nextUser);

    const profileResult = await supabase
      .from("profiles")
      .upsert(
        {
          id: nextUser.id,
          name,
        },
        { onConflict: "id" },
      );

    await throwOnError(profileResult.error);

    const categoryResult = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", nextUser.id)
      .limit(1);

    await throwOnError(categoryResult.error);

    if ((categoryResult.data ?? []).length === 0) {
      const insertResult = await supabase.from("categories").insert(
        DEFAULT_CATEGORIES.map((category) => ({
          ...category,
          user_id: nextUser.id,
        })),
      );

      await throwOnError(insertResult.error);
    }
  }

  async function loadSnapshot(nextUser: User): Promise<FinanceSnapshot> {
    const [accountsResult, budgetsResult, categoriesResult, goalsResult, transactionsResult] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("user_id", nextUser.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: true }),
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", nextUser.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", nextUser.id)
          .order("name", { ascending: true }),
        supabase
          .from("goals")
          .select("*")
          .eq("user_id", nextUser.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", nextUser.id)
          .order("date", { ascending: false }),
      ]);

    await Promise.all([
      throwOnError(accountsResult.error),
      throwOnError(budgetsResult.error),
      throwOnError(categoriesResult.error),
      throwOnError(goalsResult.error),
      throwOnError(transactionsResult.error),
    ]);

    return {
      accounts: accountsResult.data ?? [],
      budgets: budgetsResult.data ?? [],
      categories: categoriesResult.data ?? [],
      goals: goalsResult.data ?? [],
      transactions: transactionsResult.data ?? [],
    };
  }

  function applySnapshot(snapshot: FinanceSnapshot) {
    setAccounts(snapshot.accounts);
    setBudgets(snapshot.budgets);
    setCategories(snapshot.categories);
    setGoals(snapshot.goals);
    setTransactions(snapshot.transactions);
  }

  async function refresh() {
    if (!user) return;

    setRefreshing(true);
    try {
      const snapshot = await loadSnapshot(user);
      applySnapshot(snapshot);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!user) {
        if (!active) return;
        setAccounts([]);
        setBudgets([]);
        setCategories([]);
        setGoals([]);
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await ensureBootstrap(user);
        const snapshot = await loadSnapshot(user);
        if (!active) return;
        applySnapshot(snapshot);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [user]);

  async function addAccount(input: AddAccountInput) {
    if (!user) {
      throw new Error("You need to be signed in to add an account.");
    }

    const result = await supabase.from("accounts").insert({
      balance: input.balance,
      color: defaultAccountColor(input.type),
      currency: input.currency,
      last4: input.last4?.trim() ? input.last4.trim().slice(-4) : null,
      name: input.name.trim(),
      type: input.type,
      user_id: user.id,
    });

    await throwOnError(result.error);
    await refresh();
  }

  async function addTransaction(input: AddTransactionInput) {
    if (!user) {
      throw new Error("You need to be signed in to add a transaction.");
    }

    const account = accounts.find((entry) => entry.id === input.accountId);
    if (!account) {
      throw new Error("Choose an account before saving the transaction.");
    }

    const nextBalance =
      input.type === "income"
        ? account.balance + input.amount
        : account.balance - input.amount;

    const insertResult = await supabase.from("transactions").insert({
      account_id: input.accountId,
      amount: input.amount,
      category_id: input.categoryId ?? null,
      currency: input.currency,
      date: input.date ?? new Date().toISOString(),
      note: input.note.trim(),
      type: input.type,
      user_id: user.id,
    });

    await throwOnError(insertResult.error);

    const accountResult = await supabase
      .from("accounts")
      .update({
        balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.accountId)
      .eq("user_id", user.id);

    await throwOnError(accountResult.error);
    await refresh();
  }

  async function contributeToGoal(goalId: string, amount: number) {
    if (!user) {
      throw new Error("You need to be signed in to update a goal.");
    }

    const goal = goals.find((entry) => entry.id === goalId);
    if (!goal) {
      throw new Error("That goal could not be found.");
    }

    const contributionAmount = Math.max(0, amount);
    if (contributionAmount <= 0) {
      throw new Error("Enter an amount greater than zero.");
    }

    const contributionResult = await supabase.from("goal_contributions").insert({
      amount: contributionAmount,
      goal_id: goalId,
      note: "Manual contribution",
      user_id: user.id,
    });

    await throwOnError(contributionResult.error);

    const goalResult = await supabase
      .from("goals")
      .update({
        current_amount: Math.min(goal.target_amount, goal.current_amount + contributionAmount),
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId)
      .eq("user_id", user.id);

    await throwOnError(goalResult.error);
    await refresh();
  }

  const value = {
    loading,
    refreshing,
    accounts,
    budgets,
    budgetSummaries: buildBudgetSummaries(budgets, transactions),
    categories,
    goals,
    transactions,
    addAccount,
    addTransaction,
    contributeToGoal,
    refresh,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}