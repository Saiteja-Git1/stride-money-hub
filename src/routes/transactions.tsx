import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AppShell } from "@/components/finance/AppShell";
import { TransactionList } from "@/components/finance/TransactionList";
import {
  TransactionFilters,
  type FiltersState,
  type TxRange,
  type TxType,
} from "@/components/finance/TransactionFilters";
import { transactions } from "@/lib/mock-data";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  type: fallback(z.enum(["all", "income", "expense"]), "all").default("all"),
  range: fallback(z.enum(["7d", "30d", "90d", "all"]), "30d").default("30d"),
  cats: fallback(z.array(z.string()), []).default([]),
});

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Activity — Lumen" }] }),
  validateSearch: zodValidator(searchSchema),
  component: TransactionsPage,
});

function rangeStart(r: TxRange): number {
  if (r === "all") return 0;
  const days = r === "7d" ? 7 : r === "30d" ? 30 : 90;
  return Date.now() - days * 86400000;
}

function TransactionsPage() {
  const { q, type, range, cats } = Route.useSearch();
  const navigate = useNavigate({ from: "/transactions" });

  const filters: FiltersState = { q, type, range, cats };

  const update = (patch: Partial<FiltersState>) => {
    navigate({
      search: (prev: FiltersState) => ({ ...prev, ...patch }),
      replace: true,
    });
  };

  const reset = () => {
    navigate({
      search: { q: "", type: "all" as TxType, range: "30d" as TxRange, cats: [] },
      replace: true,
    });
  };

  const filtered = useMemo(() => {
    const start = rangeStart(range);
    const ql = q.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (type !== "all" && t.type !== type) return false;
        if (cats.length > 0 && !cats.includes(t.categoryId)) return false;
        if (start > 0 && new Date(t.date).getTime() < start) return false;
        if (ql && !t.note.toLowerCase().includes(ql)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [q, type, range, cats]);

  const total = filtered.reduce(
    (s, t) => s + (t.type === "income" ? t.amount : -t.amount),
    0,
  );

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {filtered.length} transactions ·{" "}
          <span
            className={`font-semibold ${total >= 0 ? "text-success" : "text-foreground"}`}
          >
            {total >= 0 ? "+" : "−"}$
            {Math.abs(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>{" "}
          net
        </p>
      </header>

      <section className="mt-3 px-5">
        <TransactionFilters
          value={filters}
          onChange={update}
          onReset={reset}
          resultCount={filtered.length}
        />
      </section>

      <section className="mt-5 px-5">
        <TransactionList transactions={filtered} grouped />
      </section>
    </AppShell>
  );
}