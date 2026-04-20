import { motion } from "framer-motion";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@/lib/mock-data";

export function BalanceCard({ total, income, expense }: { total: number; income: number; expense: number }) {
  const [hidden, setHidden] = useState(false);
  const net = income - expense;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl p-6"
      style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-md)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total balance</p>
          <button
            onClick={() => setHidden(h => !h)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Toggle balance visibility"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <h1 className="text-4xl font-semibold tracking-tight tabular-nums">
            {hidden ? "••••••" : formatMoney(total)}
          </h1>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-success">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="font-medium">{formatMoney(net)} this month</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-secondary/50 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Income</p>
            </div>
            <p className="mt-1.5 text-lg font-semibold tabular-nums">{hidden ? "•••" : formatMoney(income)}</p>
          </div>
          <div className="rounded-2xl bg-secondary/50 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Expense</p>
            </div>
            <p className="mt-1.5 text-lg font-semibold tabular-nums">{hidden ? "•••" : formatMoney(expense)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}