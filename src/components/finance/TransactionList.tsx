import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  fallbackCategory,
  formatMoney,
  type FinanceCategory,
  type FinanceTransaction,
} from "@/lib/finance";

function dayKey(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diff = Math.floor(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86400000,
  );

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeOf(iso: string) {
  const date = new Date(iso);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function resolveCategory(
  transaction: FinanceTransaction,
  categories: FinanceCategory[],
) {
  if (transaction.category_id) {
    const category = categories.find((entry) => entry.id === transaction.category_id);
    if (category) {
      return category;
    }
  }

  return fallbackCategory(transaction.type === "income" ? "income" : "expense");
}

export function TransactionList({
  categories,
  transactions,
  grouped = false,
}: {
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
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
        {transactions.map((transaction, index) => (
          <Row
            key={transaction.id}
            category={resolveCategory(transaction, categories)}
            transaction={transaction}
            index={index}
          />
        ))}
      </div>
    );
  }

  const groups = new Map<string, FinanceTransaction[]>();
  for (const transaction of transactions) {
    const key = dayKey(transaction.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(transaction);
  }

  let index = 0;
  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([day, items]) => {
        const dayTotal = items.reduce(
          (sum, transaction) =>
            sum + (transaction.type === "income" ? transaction.amount : -transaction.amount),
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
                {dayTotal >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(dayTotal), items[0]?.currency ?? "USD").replace("-", "")}
              </p>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-white/5 bg-card"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              {items.map((transaction) => {
                const currentIndex = index++;
                return (
                  <Row
                    key={transaction.id}
                    category={resolveCategory(transaction, categories)}
                    transaction={transaction}
                    index={currentIndex}
                    showTime
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({
  category,
  transaction,
  index,
  showTime = false,
}: {
  category: FinanceCategory;
  transaction: FinanceTransaction;
  index: number;
  showTime?: boolean;
}) {
  const Icon = (Icons[category.icon as keyof typeof Icons] as LucideIcon) ?? Icons.Circle;
  const isIncome = transaction.type === "income";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.3), duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      className="flex cursor-pointer items-center gap-3 border-b border-border/30 p-3.5 transition-colors last:border-0 hover:bg-white/[0.02]"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in oklab, ${category.color} 18%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${category.color} 28%, transparent)`,
        }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: category.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-tight">{transaction.note}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {category.name}
          {showTime && <span> • {timeOf(transaction.date)}</span>}
        </p>
      </div>
      <p
        className={`shrink-0 text-[14px] font-semibold tabular-nums ${
          isIncome ? "text-success" : "text-foreground"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatMoney(transaction.amount, transaction.currency).replace("-", "")}
      </p>
    </motion.div>
  );
}
