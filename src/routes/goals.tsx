import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/finance/AppShell";
import { ProgressRing } from "@/components/finance/ProgressRing";
import { useFinance } from "@/integrations/supabase/use-finance";
import { useAuth } from "@/integrations/supabase/use-auth";
import { formatMoney, type FinanceCurrency } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goals — Lumen" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const { user } = useAuth();
  const { goals, contributeToGoal, refresh } = useFinance();
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // new goal form state
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [currency, setCurrency] = useState<FinanceCurrency>("INR");

  async function handleAddGoal() {
    if (!user || !name || !target) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        name: name.trim(),
        icon: "Target",
        color: "oklch(0.76 0.16 302)",
        currency,
        target_amount: parseFloat(target),
        deadline: deadline || null,
      });
      if (error) throw error;
      toast.success("Goal created.");
      setAdding(false);
      setName(""); setTarget(""); setDeadline("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleContribute(goalId: string) {
    const amt = parseFloat(contributeAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await contributeToGoal(goalId, amt);
      toast.success(`${formatMoney(amt, "INR")} added to goal.`);
      setActiveId(null);
      setContributeAmount("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add contribution.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">What are you saving for?</p>
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
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">New goal</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name"
              className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
            <div className="grid grid-cols-2 gap-2">
              <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="Target amount"
                className="glass-subtle h-11 rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
              <select value={currency} onChange={(e) => setCurrency(e.target.value as FinanceCurrency)}
                className="glass-subtle h-11 rounded-xl px-3 text-[13px] outline-none">
                <option value="INR">INR ₹</option>
                <option value="USD">USD $</option>
              </select>
            </div>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none text-muted-foreground" />
            <button disabled={!name || !target || saving} onClick={() => void handleAddGoal()}
              className="h-11 w-full rounded-xl text-[13px] font-semibold disabled:opacity-40"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
              {saving ? "Saving..." : "Create goal"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-3 space-y-3 px-5">
        {goals.length === 0 && !adding && (
          <p className="py-10 text-center text-sm text-muted-foreground">No goals yet. Tap + to add one.</p>
        )}
        {goals.map((g, i) => {
          const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
          const Icon = (Icons[g.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Target;
          const isActive = activeId === g.id;
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <button type="button" onClick={() => setActiveId(isActive ? null : g.id)}
                whileTap={{ scale: 0.985 }}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-card p-4 text-left"
                style={{ boxShadow: "var(--shadow-sm)" }}>
                <ProgressRing value={pct} size={64} stroke={6} color={g.color} glow={false}>
                  <Icon className="h-5 w-5" style={{ color: g.color }} />
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[14px] font-semibold">{g.name}</p>
                    <p className="shrink-0 text-[11.5px] font-semibold tabular-nums" style={{ color: g.color }}>
                      {Math.round(pct)}%
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">{formatMoney(g.current_amount, g.currency)}</span>
                    {" "}of {formatMoney(g.target_amount, g.currency)}
                  </p>
                  {g.deadline && (
                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                      By {new Date(g.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </button>
              {isActive && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-1 rounded-2xl border border-white/5 bg-card p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Add contribution</p>
                  <div className="flex gap-2">
                    <input inputMode="decimal" value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="Amount"
                      className="glass-subtle h-10 flex-1 rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
                    <button disabled={!contributeAmount || saving} onClick={() => void handleContribute(g.id)}
                      className="h-10 rounded-xl px-4 text-[13px] font-semibold disabled:opacity-40"
                      style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </section>
    </AppShell>
  );
}