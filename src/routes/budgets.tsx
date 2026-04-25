import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { useFinance } from "@/integrations/supabase/use-finance";
import { monthLabel, formatMoney } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/use-auth";

export const Route = createFileRoute("/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Stride" }] }),
  component: BudgetsPage,
});

type Sheet = "none" | "add-budget" | "add-category" | "detail";

function BudgetsPage() {
  const { user } = useAuth();
  const { budgetSummaries, categories, transactions, refresh } = useFinance();
  const [sheet, setSheet] = useState<Sheet>("none");
  const [activeBudgetId, setActiveBudgetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // add budget form
  const [catId, setCatId] = useState("");
  const [limit, setLimit] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");

  // add category form
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"expense" | "income">("expense");

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const month = new Date().toISOString().slice(0, 7) + "-01";

  const activeBudget = budgetSummaries.find((b) => b.id === activeBudgetId);
  const activeCat = activeBudget ? categories.find((c) => c.id === activeBudget.categoryId) : null;
  const activeTx = activeBudget
    ? transactions.filter(
        (t) =>
          t.category_id === activeBudget.categoryId &&
          t.type === "expense" &&
          t.date.slice(0, 7) === new Date().toISOString().slice(0, 7),
      )
    : [];

  async function handleAddCategory() {
    if (!user || !catName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("categories").insert({
        user_id: user.id,
        name: catName.trim(),
        icon: catType === "expense" ? "Circle" : "TrendingUp",
        color: catType === "expense" ? "oklch(0.7 0.16 290)" : "oklch(0.78 0.18 155)",
        type: catType,
      });
      if (error) throw error;
      toast.success(`Category "${catName.trim()}" created.`);
      setCatName("");
      await refresh();
      setSheet("add-budget");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddBudget() {
    if (!user || !catId || !limit) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("budgets").upsert(
        { user_id: user.id, category_id: catId, amount_limit: parseFloat(limit), currency, month },
        { onConflict: "user_id,category_id,month" },
      );
      if (error) throw error;
      toast.success("Budget saved.");
      setCatId(""); setLimit("");
      setSheet("none");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(id: string) {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      toast.success("Budget removed.");
      setSheet("none");
      await refresh();
    } catch (e) {
      toast.error("Could not delete budget.");
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
            onClick={() => setSheet("add-budget")}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="mt-3 space-y-3 px-5">
        {budgetSummaries.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-muted-foreground">No budgets yet.</p>
            <button
              onClick={() => setSheet("add-budget")}
              className="mt-4 h-11 rounded-2xl px-6 text-[13px] font-semibold"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
            >
              Add first budget
            </button>
          </div>
        ) : (
          budgetSummaries.map((b, i) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            if (!cat) return null;
            const Icon = (Icons[cat.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
            const pct = Math.min(100, (b.spent / b.limit) * 100);
            const danger = pct >= 90;
            const warn = pct >= 70 && !danger;
            const barColor = danger ? "var(--destructive)" : warn ? "oklch(0.82 0.16 75)" : "var(--primary)";

            return (
              <motion.button
                key={b.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => { setActiveBudgetId(b.id); setSheet("detail"); }}
                className="w-full rounded-2xl border border-white/5 bg-card p-4 text-left"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${cat.color} 18%, transparent)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{cat.name}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          <span className="font-semibold text-foreground">{formatMoney(b.spent, b.currency)}</span>
                          {" / "}{formatMoney(b.limit, b.currency)}
                        </p>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: barColor, boxShadow: `0 0 10px ${barColor}` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                      <span style={{ color: danger ? "var(--destructive)" : warn ? "oklch(0.82 0.16 75)" : "var(--muted-foreground)" }}>
                        {danger ? "⚠ Near limit" : warn ? "Watch spending" : "On track"}
                      </span>
                      <span>{formatMoney(Math.max(0, b.limit - b.spent), b.currency)} left</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </section>

      {/* ── ADD BUDGET SHEET ── */}
      <AnimatePresence>
        {sheet === "add-budget" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheet("none")} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/5 bg-card p-5 pb-10"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <p className="mb-4 text-base font-semibold">New budget</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select value={catId} onChange={(e) => setCatId(e.target.value)}
                    className="glass-subtle h-11 flex-1 rounded-xl px-3 text-[13px] outline-none">
                    <option value="">Select category</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setSheet("add-category")}
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "color-mix(in oklab, var(--primary) 18%, transparent)", color: "var(--primary)" }}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input inputMode="decimal" value={limit}
                    onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="Monthly limit"
                    className="glass-subtle h-11 flex-1 rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
                  <select value={currency} onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
                    className="glass-subtle h-11 w-24 rounded-xl px-3 text-[13px] outline-none">
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                  </select>
                </div>
                <button disabled={!catId || !limit || saving} onClick={() => void handleAddBudget()}
                  className="h-11 w-full rounded-xl text-[13px] font-semibold disabled:opacity-40"
                  style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                  {saving ? "Saving..." : "Save budget"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD CUSTOM CATEGORY SHEET ── */}
      <AnimatePresence>
        {sheet === "add-category" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheet("add-budget")} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/5 bg-card p-5 pb-10"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <p className="mb-1 text-base font-semibold">New category</p>
              <p className="mb-4 text-[12px] text-muted-foreground">Create a custom category for your budgets</p>
              <div className="space-y-3">
                <input value={catName} onChange={(e) => setCatName(e.target.value)}
                  placeholder="Category name (e.g. Gym, Groceries)"
                  className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
                <div className="grid grid-cols-2 gap-2">
                  {(["expense", "income"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setCatType(t)}
                      className="h-11 rounded-xl text-[13px] font-semibold capitalize transition-all"
                      style={{
                        background: catType === t ? "var(--gradient-primary)" : "color-mix(in oklab, var(--foreground) 6%, transparent)",
                        color: catType === t ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
                <button disabled={!catName.trim() || saving} onClick={() => void handleAddCategory()}
                  className="h-11 w-full rounded-xl text-[13px] font-semibold disabled:opacity-40"
                  style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                  {saving ? "Creating..." : "Create category"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BUDGET DETAIL SHEET ── */}
      <AnimatePresence>
        {sheet === "detail" && activeBudget && activeCat && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheet("none")} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-white/5 bg-card p-5 pb-10"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Budget detail</p>
                  <p className="mt-1 text-xl font-semibold">{activeCat.name}</p>
                  <p className="text-[12px] text-muted-foreground">{monthLabel()}</p>
                </div>
                <button onClick={() => void handleDeleteBudget(activeBudget.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-destructive"
                  style={{ background: "color-mix(in oklab, var(--destructive) 12%, transparent)" }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="mb-5 rounded-2xl border border-white/5 p-4" style={{ background: "var(--background)" }}>
                <div className="flex justify-between text-[12px] text-muted-foreground mb-2">
                  <span>Spent</span>
                  <span>Limit</span>
                </div>
                <div className="flex justify-between font-semibold mb-3">
                  <span>{formatMoney(activeBudget.spent, activeBudget.currency)}</span>
                  <span>{formatMoney(activeBudget.limit, activeBudget.currency)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, (activeBudget.spent / activeBudget.limit) * 100)}%`,
                    background: "var(--gradient-primary)"
                  }} />
                </div>
                <p className="mt-2 text-right text-[11px] text-muted-foreground">
                  {formatMoney(Math.max(0, activeBudget.limit - activeBudget.spent), activeBudget.currency)} remaining
                </p>
              </div>

              {/* Transactions this month */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Transactions this month ({activeTx.length})
              </p>
              {activeTx.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeTx.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2.5"
                      style={{ background: "var(--background)" }}>
                      <div>
                        <p className="text-[13px] font-medium">{t.note || activeCat.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold text-destructive">
                        −{formatMoney(t.amount, t.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}