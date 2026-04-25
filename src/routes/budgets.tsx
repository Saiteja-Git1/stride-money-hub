import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/finance/AppShell";
import { BudgetList } from "@/components/finance/BudgetList";
import { useFinance } from "@/integrations/supabase/use-finance";
import { monthLabel } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/use-auth";

export const Route = createFileRoute("/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Lumen" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { user } = useAuth();
  const { budgetSummaries, categories, refresh } = useFinance();
  const [adding, setAdding] = useState(false);
  const [catId, setCatId] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const month = new Date().toISOString().slice(0, 10).slice(0, 7) + "-01";

  async function handleAdd() {
    if (!user || !catId || !limit) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("budgets").upsert({
        user_id: user.id,
        category_id: catId,
        amount_limit: parseFloat(limit),
        currency: "INR",
        month,
      }, { onConflict: "user_id,category_id,month" });
      if (error) throw error;
      toast.success("Budget saved.");
      setAdding(false);
      setLimit("");
      setCatId("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save budget.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
            <p className="mt-1 text-sm text-muted-foreground">{monthLabel()}</p>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      {adding && (
        <section className="mt-3 px-5">
          <div className="space-y-2 rounded-2xl border border-white/5 bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">New budget</p>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none"
            >
              <option value="">Select category</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Monthly limit (₹)"
              className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground"
            />
            <button
              disabled={!catId || !limit || saving}
              onClick={() => void handleAdd()}
              className="h-11 w-full rounded-xl text-[13px] font-semibold disabled:opacity-40"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              {saving ? "Saving..." : "Save budget"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-5 px-5">
        {budgetSummaries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No budgets yet. Tap + to add one.
          </p>
        ) : (
          <BudgetList summaries={budgetSummaries} categories={categories} />
        )}
      </section>
    </AppShell>
  );
}