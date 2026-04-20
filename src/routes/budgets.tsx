import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/finance/AppShell";
import { BudgetList } from "@/components/finance/BudgetList";
import { budgets } from "@/lib/mock-data";

export const Route = createFileRoute("/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Lumen" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  return (
    <AppShell>
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="mt-1 text-sm text-muted-foreground">April 2026</p>
      </header>
      <section className="mt-5 px-5">
        <BudgetList budgets={budgets} />
      </section>
    </AppShell>
  );
}