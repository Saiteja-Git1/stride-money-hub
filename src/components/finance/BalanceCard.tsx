import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatMoney } from "@/lib/mock-data";
import { AnimatedNumber } from "./AnimatedNumber";

type Period = "W" | "M" | "Y";
const periods: Period[] = ["W", "M", "Y"];
const periodLabel: Record<Period, string> = { W: "This week", M: "This month", Y: "This year" };
const periodMultiplier: Record<Period, number> = { W: 0.25, M: 1, Y: 11.4 };

function formatBalance(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BalanceCard({ total, income, expense }: { total: number; income: number; expense: number }) {
  const [hidden, setHidden] = useState(false);
  const [period, setPeriod] = useState<Period>("M");
  const mult = periodMultiplier[period];
  const periodIncome = income * mult;
  const periodExpense = expense * mult;
  const net = periodIncome - periodExpense;
  const netPositive = net >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl p-6"
      style={{
        background: "var(--gradient-card)",
        boxShadow: "var(--shadow-card), var(--shadow-inset)",
      }}
    >
      {/* Mesh background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-mesh)" }}
      />
      {/* Subtle noise / grain feel via radial */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--primary)" }}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Total balance
          </p>
          <button
            onClick={() => setHidden((h) => !h)}
            className="rounded-full p-1.5 text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground active:scale-90"
            aria-label="Toggle balance visibility"
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <AnimatePresence mode="wait">
            <motion.h1
              key={hidden ? "hidden" : "visible"}
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.25 }}
              className="text-[40px] font-semibold leading-none tracking-tight tabular-nums"
            >
              {hidden ? "••••••" : <AnimatedNumber value={total} format={formatBalance} />}
            </motion.h1>
          </AnimatePresence>
        </div>

        <div
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            netPositive ? "text-success" : "text-destructive"
          }`}
        >
          <TrendingUp className={`h-3.5 w-3.5 ${netPositive ? "" : "rotate-180"}`} />
          <span className="font-medium tabular-nums">
            {netPositive ? "+" : "−"}
            {formatMoney(Math.abs(net)).replace("-", "")}
          </span>
          <span className="text-muted-foreground">· {periodLabel[period]}</span>
        </div>

        {/* Period segmented control */}
        <div className="mt-5 inline-flex rounded-full bg-black/30 p-0.5 backdrop-blur">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="relative px-3.5 py-1 text-[11px] font-semibold transition-colors"
              style={{ color: period === p ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
            >
              {period === p && (
                <motion.span
                  layoutId="period-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--gradient-primary)" }}
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <span className="relative">{p}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat
            label="Income"
            value={hidden ? "•••" : formatMoney(periodIncome)}
            icon={<ArrowDownRight className="h-3.5 w-3.5" />}
            tone="success"
          />
          <Stat
            label="Expense"
            value={hidden ? "•••" : formatMoney(periodExpense)}
            icon={<ArrowUpRight className="h-3.5 w-3.5" />}
            tone="destructive"
          />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "success" | "destructive";
}) {
  const color = tone === "success" ? "var(--success)" : "var(--destructive)";
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-3 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
        >
          {icon}
        </span>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-[17px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}