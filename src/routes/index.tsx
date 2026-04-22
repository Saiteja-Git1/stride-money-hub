import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { BalanceCard } from "@/components/finance/BalanceCard";
import { AccountsRail } from "@/components/finance/AccountsRail";
import { CashFlowChart } from "@/components/finance/CashFlowChart";
import { BudgetList } from "@/components/finance/BudgetList";
import { TransactionList } from "@/components/finance/TransactionList";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { ProfileMenu } from "@/components/finance/ProfileMenu";
import { LumenAICard } from "@/components/finance/LumenAICard";
import { InsightsPanel } from "@/components/finance/InsightsPanel";
import {
  accounts,
  budgets,
  monthExpense,
  monthIncome,
  totalBalance,
  transactions,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Personal finance, beautifully simple" },
      { name: "description", content: "Track accounts, budgets, and goals with a premium mobile-first experience." },
    ],
  }),
  component: Index,
});

function Index() {
  const recent = transactions.slice(0, 5);
  return (
    <AppShell>
      {/* Sticky blurred header */}
      <header className="sticky top-0 z-30 -mx-0 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Good evening
            </p>
            <h2 className="mt-0.5 text-[17px] font-semibold tracking-tight">Alex Morgan</h2>
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

      <section className="mt-2 px-5">
        <BalanceCard total={totalBalance()} income={monthIncome()} expense={monthExpense()} />
      </section>

      <section className="mt-7">
        <div className="px-5">
          <SectionHeader title="Your accounts" action={{ label: "See all" }} />
        </div>
        <div className="px-5">
          <AccountsRail accounts={accounts} />
        </div>
      </section>

      <section className="mt-6 px-5">
        <CashFlowChart />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-6 px-5"
      >
        <LumenAICard
          income={monthIncome()}
          expense={monthExpense()}
          total={totalBalance()}
        />
      </motion.section>

      <section className="mt-4 px-5">
        <InsightsPanel />
      </section>

      <section className="mt-7 px-5">
        <SectionHeader title="Budgets" action={{ label: "Manage" }} />
        <BudgetList budgets={budgets} />
      </section>

      <section className="mt-7 px-5">
        <SectionHeader title="Recent activity" action={{ label: "See all" }} />
        <TransactionList transactions={recent} />
      </section>
    </AppShell>
  );
}
