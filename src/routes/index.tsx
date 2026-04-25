import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Plus } from "lucide-react";
import { AddAccountDialog } from "@/components/finance/AddAccountDialog";
import { AppShell } from "@/components/finance/AppShell";
import { AccountsRail } from "@/components/finance/AccountsRail";
import { BalanceCard } from "@/components/finance/BalanceCard";
import { CashFlowChart } from "@/components/finance/CashFlowChart";
import { InsightsPanel } from "@/components/finance/InsightsPanel";
import { LumenAICard } from "@/components/finance/LumenAICard";
import { ProfileMenu } from "@/components/finance/ProfileMenu";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { TransactionList } from "@/components/finance/TransactionList";
import { useAuth } from "@/integrations/supabase/use-auth";
import { useFinance } from "@/integrations/supabase/use-finance";
import {
  buildCashFlowData,
  getMonthExpense,
  getMonthIncome,
  getTotalBalance,
  monthLabel,
} from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stride Money Hub" },
      {
        name: "description",
        content: "Track accounts, budgets, goals, and cash flow with your real data.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { displayName } = useAuth();
  const { accounts, budgetSummaries, categories, loading, transactions } = useFinance();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const totalBalance = useMemo(() => getTotalBalance(accounts), [accounts]);
  const monthIncome = useMemo(() => getMonthIncome(transactions), [transactions]);
  const monthExpense = useMemo(() => getMonthExpense(transactions), [transactions]);
  const primaryCurrency = accounts.find((a) => a.currency === "INR")?.currency ?? accounts[0]?.currency ?? "INR";
  const cashFlowData = useMemo(() => buildCashFlowData(transactions), [transactions]);

  useEffect(() => {
    if (!loading && accounts.length === 0) {
      setAccountDialogOpen(true);
    }
  }, [accounts.length, loading]);

  return (
    <AppShell>
      <AddAccountDialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen} />

      <header className="sticky top-0 z-30 -mx-0 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {greeting}
            </p>
            <h2 className="mt-0.5 text-[17px] font-semibold tracking-tight">{displayName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              aria-label="Notifications"
              className="glass-subtle relative flex h-10 w-10 items-center justify-center rounded-full"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </motion.button>
            <ProfileMenu />
          </div>
        </div>
      </header>

      {loading ? (
        <section className="px-5 pt-5">
          <div
            className="rounded-3xl border border-white/5 p-5 text-sm text-muted-foreground"
            style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-sm)" }}
          >
            Loading your accounts and recent activity...
          </div>
        </section>
      ) : accounts.length === 0 ? (
        <section className="px-5 pt-5">
          <div
            className="rounded-3xl border border-white/5 p-5"
            style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Welcome
            </p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-tight">
              Let&apos;s connect your first account.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Once you add an account, your dashboard, activity feed, and quick-add transaction
              flow will switch from empty setup mode to your real data.
            </p>
            <button
              onClick={() => setAccountDialogOpen(true)}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold"
              style={{
                background: "var(--gradient-primary)",
                color: "var(--primary-foreground)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Plus className="h-4 w-4" />
              Add account
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-2 px-5">
            <BalanceCard
              total={totalBalance}
              income={monthIncome}
              expense={monthExpense}
              currency={primaryCurrency}
            />
          </section>

          <section className="mt-6 px-5">
            <CashFlowChart
              currency={primaryCurrency}
              data={cashFlowData}
              label={monthLabel()}
            />
          </section>

          <section className="mt-7">
            <div className="px-5">
              <SectionHeader
                title="Your accounts"
                action={{ label: "Add account", onClick: () => setAccountDialogOpen(true) }}
              />
            </div>
            <div className="px-5">
              <AccountsRail accounts={accounts} />
            </div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-6 px-5"
          >
            <LumenAICard
              currency={primaryCurrency}
              income={monthIncome}
              expense={monthExpense}
              total={totalBalance}
            />
          </motion.section>

          <section className="mt-4 px-5">
            <InsightsPanel
              budgets={budgetSummaries}
              categories={categories}
              currency={primaryCurrency}
              transactions={transactions}
            />
          </section>

          <section className="mt-7 px-5">
            <SectionHeader title="Recent activity" />
            <TransactionList categories={categories} transactions={recentTransactions} />
          </section>
        </>
      )}
    </AppShell>
  );
}