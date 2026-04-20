import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/finance/AppShell";
import { TransactionList } from "@/components/finance/TransactionList";
import { transactions } from "@/lib/mock-data";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Activity — Lumen" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  return (
    <AppShell>
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your transactions</p>
      </header>
      <section className="mt-5 px-5">
        <TransactionList transactions={transactions} />
      </section>
    </AppShell>
  );
}