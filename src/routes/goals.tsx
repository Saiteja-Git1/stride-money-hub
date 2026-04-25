import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Trophy } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Goals — Stride" }] }),
  component: GoalsPage,
});

type Sheet = "none" | "add" | "detail";

function GoalsPage() {
  const { user } = useAuth();
  const { goals, contributeToGoal, refresh } = useFinance();
  const [sheet, setSheet] = useState<Sheet>("none");
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // add goal form
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [currency, setCurrency] = useState<FinanceCurrency>("INR");

  // contribution
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributions, setContributions] = useState<{ id: string; amount: number; date: string; note: string }[]>([]);
  const [loadingContribs, setLoadingContribs] = useState(false);

  const activeGoal = goals.find((g) => g.id === activeGoalId);

  async function openDetail(goalId: string) {
    setActiveGoalId(goalId);
    setSheet("detail");
    setLoadingContribs(true);
    try {
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("*")
        .eq("goal_id", goalId)
        .order("date", { ascending: false });
      if (error) throw error;
      setContributions(data ?? []);
    } catch {
      toast.error("Could not load contributions.");
    } finally {
      setLoadingContribs(false);
    }
  }

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
      setName(""); setTarget(""); setDeadline("");
      setSheet("none");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create goal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleContribute() {
    if (!activeGoalId) return;
    const amt = parseFloat(contributeAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await contributeToGoal(activeGoalId, amt);
      toast.success(`${formatMoney(amt, activeGoal?.currency ?? "INR")} added.`);
      setContributeAmount("");
      await refresh();
      // reload contributions
      const { data } = await supabase
        .from("goal_contributions")
        .select("*")
        .eq("goal_id", activeGoalId)
        .order("date", { ascending: false });
      setContributions(data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add contribution.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal(id: string) {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Goal deleted.");
      setSheet("none");
      await refresh();
    } catch {
      toast.error("Could not delete goal.");
    }
  }

  async function handleMarkComplete(id: string) {
    try {
      const { error } = await supabase.from("goals").update({ is_completed: true }).eq("id", id);
      if (error) throw error;
      toast.success("Goal marked as complete! 🎉");
      setSheet("none");
      await refresh();
    } catch {
      toast.error("Could not update goal.");
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
            onClick={() => setSheet("add")}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="mt-3 space-y-3 px-5">
        {goals.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-muted-foreground">No goals yet.</p>
            <button onClick={() => setSheet("add")}
              className="mt-4 h-11 rounded-2xl px-6 text-[13px] font-semibold"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
              Add first goal
            </button>
          </div>
        ) : (
          goals.map((g, i) => {
            const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
            const Icon = (Icons[g.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Target;
            return (
              <motion.button
                key={g.id} type="button"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.985 }}
                onClick={() => void openDetail(g.id)}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-card p-4 text-left"
                style={{ boxShadow: "var(--shadow-sm)", opacity: g.is_completed ? 0.6 : 1 }}
              >
                <ProgressRing value={pct} size={64} stroke={6} color={g.color} glow={false}>
                  {g.is_completed
                    ? <Trophy className="h-5 w-5 text-yellow-400" />
                    : <Icon className="h-5 w-5" style={{ color: g.color }} />}
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[14px] font-semibold">{g.name}</p>
                    <p className="shrink-0 text-[11.5px] font-semibold tabular-nums" style={{ color: g.color }}>
                      {g.is_completed ? "✓ Done" : `${Math.round(pct)}%`}
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
              </motion.button>
            );
          })
        )}
      </section>

      {/* ── ADD GOAL SHEET ── */}
      <AnimatePresence>
        {sheet === "add" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheet("none")} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/5 bg-card p-5 pb-10">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <p className="mb-4 text-base font-semibold">New goal</p>
              <div className="space-y-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name (e.g. Trip to Goa)"
                  className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
                <div className="flex gap-2">
                  <input inputMode="decimal" value={target}
                    onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="Target amount"
                    className="glass-subtle h-11 flex-1 rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
                  <select value={currency} onChange={(e) => setCurrency(e.target.value as FinanceCurrency)}
                    className="glass-subtle h-11 w-24 rounded-xl px-3 text-[13px] outline-none">
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-muted-foreground">Deadline (optional)</p>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    className="glass-subtle h-11 w-full rounded-xl px-3 text-[13px] outline-none text-muted-foreground" />
                </div>
                <button disabled={!name || !target || saving} onClick={() => void handleAddGoal()}
                  className="h-11 w-full rounded-xl text-[13px] font-semibold disabled:opacity-40"
                  style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                  {saving ? "Creating..." : "Create goal"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── GOAL DETAIL SHEET ── */}
      <AnimatePresence>
        {sheet === "detail" && activeGoal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSheet("none")} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/5 bg-card p-5 pb-10">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

              {/* Header */}
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Goal detail</p>
                  <p className="mt-1 text-xl font-semibold">{activeGoal.name}</p>
                  {activeGoal.deadline && (
                    <p className="text-[12px] text-muted-foreground">
                      By {new Date(activeGoal.deadline).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <button onClick={() => void handleDeleteGoal(activeGoal.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-destructive"
                  style={{ background: "color-mix(in oklab, var(--destructive) 12%, transparent)" }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="mb-4 rounded-2xl border border-white/5 p-4" style={{ background: "var(--background)" }}>
                <div className="flex items-center gap-4">
                  <ProgressRing value={Math.min(100, (activeGoal.current_amount / activeGoal.target_amount) * 100)}
                    size={72} stroke={7} color={activeGoal.color} glow>
                    <span className="text-[11px] font-bold">
                      {Math.round((activeGoal.current_amount / activeGoal.target_amount) * 100)}%
                    </span>
                  </ProgressRing>
                  <div className="flex-1">
                    <div className="flex justify-between text-[12px] text-muted-foreground">
                      <span>Saved</span><span>Target</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>{formatMoney(activeGoal.current_amount, activeGoal.currency)}</span>
                      <span>{formatMoney(activeGoal.target_amount, activeGoal.currency)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatMoney(Math.max(0, activeGoal.target_amount - activeGoal.current_amount), activeGoal.currency)} remaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Add contribution */}
              {!activeGoal.is_completed && (
                <div className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Add contribution</p>
                  <div className="flex gap-2">
                    <input inputMode="decimal" value={contributeAmount}
                      onChange={(e) => setContributeAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder={`Amount in ${activeGoal.currency}`}
                      className="glass-subtle h-11 flex-1 rounded-xl px-3 text-[13px] outline-none placeholder:text-muted-foreground" />
                    <button disabled={!contributeAmount || saving} onClick={() => void handleContribute()}
                      className="h-11 rounded-xl px-5 text-[13px] font-semibold disabled:opacity-40"
                      style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
                      {saving ? "..." : "Add"}
                    </button>
                  </div>
                </div>
              )}

              {/* Mark complete */}
              {!activeGoal.is_completed && activeGoal.current_amount >= activeGoal.target_amount && (
                <button onClick={() => void handleMarkComplete(activeGoal.id)}
                  className="mb-4 h-11 w-full rounded-xl text-[13px] font-semibold"
                  style={{ background: "linear-gradient(135deg, oklch(0.78 0.18 80), oklch(0.74 0.18 55))", color: "#000" }}>
                  🎉 Mark as complete
                </button>
              )}

              {/* Contribution history */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                History ({contributions.length})
              </p>
              {loadingContribs ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading...</p>
              ) : contributions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No contributions yet.</p>
              ) : (
                <div className="space-y-2">
                  {contributions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2.5"
                      style={{ background: "var(--background)" }}>
                      <div>
                        <p className="text-[13px] font-medium">{c.note || "Contribution"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold" style={{ color: activeGoal.color }}>
                        +{formatMoney(c.amount, activeGoal.currency)}
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