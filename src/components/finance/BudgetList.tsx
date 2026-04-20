import { motion } from "framer-motion";
import type { Budget } from "@/lib/mock-data";
import { categoryById, formatMoney } from "@/lib/mock-data";

export function BudgetList({ budgets }: { budgets: Budget[] }) {
  return (
    <div className="space-y-3">
      {budgets.map((b, i) => {
        const cat = categoryById(b.categoryId);
        const pct = Math.min(100, (b.spent / b.limit) * 100);
        const danger = pct >= 90;
        const warn = pct >= 75 && !danger;
        const barColor = danger ? "var(--destructive)" : warn ? "var(--warning)" : "var(--primary)";
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl bg-card p-4"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                <p className="text-sm font-medium">{cat.name}</p>
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{formatMoney(b.spent)}</span> / {formatMoney(b.limit)}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.04 }}
                className="h-full rounded-full"
                style={{ background: barColor }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}