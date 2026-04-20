import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Transaction } from "@/lib/mock-data";
import { categoryById, formatMoney } from "@/lib/mock-data";

function dayKey(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.floor(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function TransactionList({
  transactions,
  grouped = false,
}: {
  transactions: Transaction[];
  grouped?: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
      </div>
    );
  }

  if (!grouped) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-white/5 bg-card"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {transactions.map((t, i) => (
          <Row key={t.id} t={t} i={i} />
        ))}
      </div>
    );
  }

  // grouped by day
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const k = dayKey(t.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }

  let i = 0;
  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([day, items]) => {
        const dayTotal = items.reduce(
          (s, x) => s + (x.type === "income" ? x.amount : -x.amount),
          0,
        );
        return (
          <div key={day}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </p>
              <p
                className={`text-[11px] font-semibold tabular-nums ${
                  dayTotal >= 0 ? "text-success" : "text-muted-foreground"
                }`}
              >
                {dayTotal >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(dayTotal)).replace("-", "")}
              </p>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-white/5 bg-card"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              {items.map((t) => {
                const idx = i++;
                return <Row key={t.id} t={t} i={idx} showTime />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ t, i, showTime = false }: { t: Transaction; i: number; showTime?: boolean }) {
  const cat = categoryById(t.categoryId);
  const Icon = (Icons[cat.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
  const isIncome = t.type === "income";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      className="flex cursor-pointer items-center gap-3 border-b border-border/30 p-3.5 transition-colors last:border-0 hover:bg-white/[0.02]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in oklab, ${cat.color} 18%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${cat.color} 28%, transparent)`,
        }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: cat.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-tight">{t.note}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {cat.name}
          {showTime && <span> · {timeOf(t.date)}</span>}
        </p>
      </div>
      <p
        className={`shrink-0 text-[14px] font-semibold tabular-nums ${
          isIncome ? "text-success" : "text-foreground"
        }`}
      >
        {isIncome ? "+" : "−"}
        {formatMoney(t.amount).replace("-", "")}
      </p>
    </motion.div>
  );
}