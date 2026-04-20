import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Transaction } from "@/lib/mock-data";
import { categoryById, formatMoney } from "@/lib/mock-data";

function relativeDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card" style={{ boxShadow: "var(--shadow-sm)" }}>
      {transactions.map((t, i) => {
        const cat = categoryById(t.categoryId);
        const Icon = (Icons[cat.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
        const isIncome = t.type === "income";
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 border-b border-border/40 p-4 last:border-0"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in oklab, ${cat.color} 18%, transparent)` }}
            >
              <Icon className="h-4.5 w-4.5" style={{ color: cat.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.note}</p>
              <p className="text-xs text-muted-foreground">
                {cat.name} · {relativeDate(t.date)}
              </p>
            </div>
            <p
              className={`shrink-0 text-sm font-semibold tabular-nums ${
                isIncome ? "text-success" : "text-foreground"
              }`}
            >
              {isIncome ? "+" : "−"}
              {formatMoney(t.amount).replace("-", "")}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}