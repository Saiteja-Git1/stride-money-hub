import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import type { Budget } from "@/lib/mock-data";
import { categoryById, formatMoney } from "@/lib/mock-data";

export function BudgetList({ budgets }: { budgets: Budget[] }) {
  return (
    <div className="space-y-2.5">
      {budgets.map((b, i) => {
        const cat = categoryById(b.categoryId);
        const Icon = (Icons[cat.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
        const pct = Math.min(100, (b.spent / b.limit) * 100);
        const danger = pct >= 90;
        const warn = pct >= 75 && !danger;
        const remaining = Math.max(0, b.limit - b.spent);
        const barColor = danger
          ? "var(--destructive)"
          : warn
          ? "var(--warning)"
          : "var(--primary)";
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.985 }}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-card p-3.5"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `color-mix(in oklab, ${cat.color} 18%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${cat.color} 30%, transparent)`,
                }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: cat.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{cat.name}</p>
                  <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatMoney(b.spent)}</span>
                    <span className="opacity-60"> / {formatMoney(b.limit)}</span>
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.9,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.15 + i * 0.05,
                      }}
                      className="h-full rounded-full"
                      style={{
                        background: danger
                          ? "linear-gradient(90deg, oklch(0.68 0.22 22), oklch(0.78 0.2 30))"
                          : warn
                          ? "linear-gradient(90deg, oklch(0.82 0.16 75), oklch(0.78 0.18 50))"
                          : barColor,
                        boxShadow: `0 0 12px ${barColor}`,
                      }}
                    />
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-semibold tabular-nums"
                    style={{ color: danger ? "var(--destructive)" : "var(--muted-foreground)" }}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  {danger ? (
                    <span className="flex items-center gap-1 font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Near limit
                    </span>
                  ) : warn ? (
                    <span className="font-medium text-warning">Watch your spending</span>
                  ) : (
                    <span className="font-medium text-muted-foreground">On track</span>
                  )}
                  <span className="tabular-nums text-muted-foreground">
                    {formatMoney(remaining)} left
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}