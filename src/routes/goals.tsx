import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plane, Home, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/finance/AppShell";
import { ProgressRing } from "@/components/finance/ProgressRing";
import { GoalDetailDrawer, type Goal } from "@/components/finance/GoalDetailDrawer";
import { formatMoney } from "@/lib/mock-data";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goals — Lumen" }] }),
  component: GoalsPage,
});

const initialGoals: Goal[] = [
  { id: "g1", name: "Japan trip", icon: Plane, target: 3500, current: 2180, deadline: "Aug 2026", deadlineISO: "2026-08-31", color: "oklch(0.7 0.16 290)" },
  { id: "g2", name: "Emergency fund", icon: Home, target: 10000, current: 6420, deadline: "Dec 2026", deadlineISO: "2026-12-31", color: "oklch(0.78 0.18 155)" },
  { id: "g3", name: "MBA tuition", icon: GraduationCap, target: 25000, current: 4200, deadline: "Sep 2027", deadlineISO: "2027-09-30", color: "oklch(0.78 0.16 30)" },
];

function GoalsPage() {
  const [goals, setGoals] = useState(initialGoals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = goals.find((g) => g.id === activeId) ?? null;

  const handleContribute = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: Math.min(g.target, g.current + amount) } : g)),
    );
    toast.success(`${formatMoney(amount)} added to your goal`);
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/60 px-5 pb-3 pt-6 backdrop-blur-xl backdrop-saturate-150">
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">What are you saving for?</p>
      </header>
      <section className="mt-3 space-y-3 px-5">
        {goals.map((g, i) => {
          const pct = Math.min(100, (g.current / g.target) * 100);
          const Icon = g.icon;
          return (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => setActiveId(g.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.985 }}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-card p-4 text-left"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
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
                  <span className="font-semibold text-foreground">{formatMoney(g.current)}</span> of{" "}
                  {formatMoney(g.target)}
                </p>
                <p className="mt-1 text-[10.5px] text-muted-foreground">By {g.deadline}</p>
              </div>
            </motion.button>
          );
        })}
      </section>
      <GoalDetailDrawer
        goal={active}
        onClose={() => setActiveId(null)}
        onContribute={handleContribute}
      />
    </AppShell>
  );
}