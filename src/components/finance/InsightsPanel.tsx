import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, Info, ChevronDown } from "lucide-react";
import { useState } from "react";
import type {
  FinanceBudgetSummary,
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/lib/finance";
import { formatMoney } from "@/lib/finance";

type Severity = "info" | "warning" | "good";
interface Insight {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

const ICONS: Record<Severity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  good: TrendingUp,
};
const TONES: Record<Severity, string> = {
  info: "var(--accent)",
  warning: "oklch(0.72 0.18 35)",
  good: "oklch(0.78 0.18 155)",
};

function buildInsights(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  budgets: FinanceBudgetSummary[],
  currency: FinanceCurrency,
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const thisTx = transactions.filter((t) => t.date.slice(0, 7) === thisMonth);
  const lastTx = transactions.filter((t) => t.date.slice(0, 7) === lastMonthKey);

  // Budget alerts
  for (const b of budgets) {
    const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
    const cat = categories.find((c) => c.id === b.categoryId);
    if (!cat) continue;
    if (pct >= 90) {
      insights.push({
        id: `budget-danger-${b.id}`,
        severity: "warning",
        title: `${cat.name} near limit`,
        detail: `Spent ${formatMoney(b.spent, currency)} of ${formatMoney(b.limit, currency)} budget (${Math.round(pct)}%).`,
      });
    } else if (pct >= 70) {
      insights.push({
        id: `budget-warn-${b.id}`,
        severity: "info",
        title: `${cat.name} at ${Math.round(pct)}%`,
        detail: `${formatMoney(b.limit - b.spent, currency)} remaining for this month.`,
      });
    }
  }

  // Spending change vs last month
  const catSpendThis = new Map<string, number>();
  const catSpendLast = new Map<string, number>();
  for (const t of thisTx) {
    if (t.type === "expense" && t.category_id) {
      catSpendThis.set(t.category_id, (catSpendThis.get(t.category_id) ?? 0) + t.amount);
    }
  }
  for (const t of lastTx) {
    if (t.type === "expense" && t.category_id) {
      catSpendLast.set(t.category_id, (catSpendLast.get(t.category_id) ?? 0) + t.amount);
    }
  }
  for (const [catId, thisAmt] of catSpendThis) {
    const lastAmt = catSpendLast.get(catId) ?? 0;
    if (lastAmt === 0) continue;
    const change = ((thisAmt - lastAmt) / lastAmt) * 100;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    if (change >= 30) {
      insights.push({
        id: `change-up-${catId}`,
        severity: "warning",
        title: `${cat.name} up ${Math.round(change)}%`,
        detail: `${formatMoney(thisAmt, currency)} this month vs ${formatMoney(lastAmt, currency)} last month.`,
      });
    } else if (change <= -25) {
      insights.push({
        id: `change-down-${catId}`,
        severity: "good",
        title: `${cat.name} down ${Math.round(Math.abs(change))}%`,
        detail: `Saved ${formatMoney(lastAmt - thisAmt, currency)} vs last month. Keep it up!`,
      });
    }
  }

  // Net positive month
  const thisIncome = thisTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const thisExpense = thisTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  if (thisIncome > 0 && thisExpense < thisIncome * 0.6) {
    insights.push({
      id: "net-positive",
      severity: "good",
      title: "Strong savings rate",
      detail: `You've spent ${Math.round((thisExpense / thisIncome) * 100)}% of income — well under 80%.`,
    });
  }

  if (insights.length === 0 && transactions.length === 0) return [];

  return insights.slice(0, 4);
}

export function InsightsPanel({
  budgets,
  categories,
  currency = "INR",
  transactions,
}: {
  budgets: FinanceBudgetSummary[];
  categories: FinanceCategory[];
  currency?: FinanceCurrency;
  transactions: FinanceTransaction[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const insights = useMemo(
    () => buildInsights(transactions, categories, budgets, currency),
    [transactions, categories, budgets, currency],
  );

  if (insights.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-white/5 p-4"
      style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)" }}
    >
      <p className="mb-3 text-[13px] font-semibold">Smart insights</p>
      <div className="space-y-1.5">
        {insights.map((insight, i) => {
          const Icon = ICONS[insight.severity] ?? Info;
          const tone = TONES[insight.severity];
          const open = openId === insight.id;
          return (
            <motion.button
              key={insight.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setOpenId(open ? null : insight.id)}
              className="w-full rounded-xl border border-white/5 p-2.5 text-left"
              style={{ background: "color-mix(in oklab, var(--foreground) 3%, transparent)" }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: tone }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-semibold">{insight.title}</p>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden text-[11.5px] leading-relaxed text-muted-foreground"
                      >
                        {insight.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}