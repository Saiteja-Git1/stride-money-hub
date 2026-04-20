import { createFileRoute } from "@tanstack/react-router";
import { Bell, Sparkles } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { BalanceCard } from "@/components/finance/BalanceCard";
import { AccountsRail } from "@/components/finance/AccountsRail";
import { CashFlowChart } from "@/components/finance/CashFlowChart";
import { BudgetList } from "@/components/finance/BudgetList";
import { TransactionList } from "@/components/finance/TransactionList";
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
      <header className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="text-xs text-muted-foreground">Good evening</p>
          <h2 className="text-lg font-semibold">Alex Morgan</h2>
        </div>
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card transition-colors hover:bg-secondary"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </header>

      <section className="mt-5 px-5">
        <BalanceCard total={totalBalance()} income={monthIncome()} expense={monthExpense()} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between px-5">
          <h3 className="text-sm font-semibold">Your accounts</h3>
          <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            See all
          </button>
        </div>
        <div className="px-5">
          <AccountsRail accounts={accounts} />
        </div>
      </section>

      <section className="mt-6 px-5">
        <CashFlowChart />
      </section>

      <section className="mt-6 px-5">
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{
            background: "color-mix(in oklab, var(--accent) 12%, var(--card))",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-violet)" }}
          >
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">You're on track this month</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Spending is 12% lower than March. Keep it up — you'll save an extra $340.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Budgets</h3>
          <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            Manage
          </button>
        </div>
        <BudgetList budgets={budgets} />
      </section>

      <section className="mt-6 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent activity</h3>
          <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            See all
          </button>
        </div>
        <TransactionList transactions={recent} />
      </section>
    </AppShell>
  );
}
