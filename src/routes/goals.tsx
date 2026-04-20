import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plane, Home, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/finance/AppShell";
import { formatMoney } from "@/lib/mock-data";

export const Route = createFileRoute("/goals")({
  head: () => ({ meta: [{ title: "Goals — Lumen" }] }),
  component: GoalsPage,
});

const goals = [
  { id: "g1", name: "Japan trip", icon: Plane, target: 3500, current: 2180, deadline: "Aug 2026", color: "oklch(0.7 0.16 290)" },
  { id: "g2", name: "Emergency fund", icon: Home, target: 10000, current: 6420, deadline: "Dec 2026", color: "oklch(0.78 0.18 155)" },
  { id: "g3", name: "MBA tuition", icon: GraduationCap, target: 25000, current: 4200, deadline: "Sep 2027", color: "oklch(0.78 0.16 30)" },
];

function GoalsPage() {
  return (
    <AppShell>
      <header className="px-5 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-1 text-sm text-muted-foreground">What are you saving for?</p>
      </header>
      <section className="mt-5 space-y-3 px-5">
        {goals.map((g, i) => {
          const pct = Math.min(100, (g.current / g.target) * 100);
          const Icon = g.icon;
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-card p-4"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `color-mix(in oklab, ${g.color} 18%, transparent)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: g.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-muted-foreground">By {g.deadline}</p>
                </div>
                <p className="text-xs font-semibold tabular-nums">{Math.round(pct)}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: g.color }}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between text-xs text-muted-foreground tabular-nums">
                <span><span className="font-semibold text-foreground">{formatMoney(g.current)}</span> saved</span>
                <span>of {formatMoney(g.target)}</span>
              </div>
            </motion.div>
          );
        })}
      </section>
    </AppShell>
  );
}