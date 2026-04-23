import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  FinanceBudgetSummary,
  FinanceCategory,
  FinanceCurrency,
  FinanceTransaction,
} from "@/lib/finance";

type Severity = "info" | "warning" | "good";

interface Insight {
  id: string;
  kind: string;
  severity: Severity;
  title: string;
  detail: string;
  source: { label: string; value: string }[];
}

const ICONS: Record<Severity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  good: TrendingUp,
};

const TONES: Record<Severity, string> = {
  info: "var(--accent)",
  warning: "oklch(0.72 0.18 35)",
  good: "var(--primary)",
};

export function InsightsPanel({
  budgets,
  categories,
  currency = "USD",
  transactions,
}: {
  budgets: FinanceBudgetSummary[];
  categories: FinanceCategory[];
  currency?: FinanceCurrency;
  transactions: FinanceTransaction[];
}) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    if (transactions.length === 0 || categories.length === 0) {
      setInsights([]);
      setSummary(null);
      setGeneratedAt(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lumen-insights", {
        body: {
          transactions: transactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            categoryId: transaction.category_id ?? "",
            note: transaction.note,
            date: transaction.date,
          })),
          categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
            type: category.type as "income" | "expense",
          })),
          budgets: budgets.map((budget) => ({
            id: budget.id,
            categoryId: budget.categoryId,
            limit: budget.limit,
            spent: budget.spent,
          })),
          currency,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setInsights(data?.insights ?? []);
      setSummary(data?.summary ?? null);
      setGeneratedAt(data?.generatedAt ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load insights");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [transactions, categories, budgets]);

  return (
    <div
      className="rounded-2xl border border-white/5 p-4"
      style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-violet)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-none">Smart insights</p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              {generatedAt
                ? `Updated ${new Date(generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                : "Analyzing your activity"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            void load();
          }}
          disabled={loading}
          aria-label="Refresh insights"
          className="glass-subtle flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {summary && (
        <p className="mt-2.5 text-[12px] leading-relaxed text-muted-foreground">{summary}</p>
      )}

      <div className="mt-3 space-y-1.5">
        {loading && insights.length === 0 && (
          <p className="text-[12px] text-muted-foreground">Reading your numbers...</p>
        )}
        {!loading && insights.length === 0 && (
          <p className="text-[12px] text-muted-foreground">
            Add more activity and we&apos;ll spot trends for you.
          </p>
        )}
        {insights.map((insight, index) => {
          const Icon = ICONS[insight.severity] ?? Info;
          const Trend =
            insight.kind === "spending_change" && insight.severity === "warning"
              ? TrendingDown
              : null;
          const tone = TONES[insight.severity];
          const open = openId === insight.id;

          return (
            <motion.button
              key={insight.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setOpenId(open ? null : insight.id)}
              className="w-full rounded-xl border border-white/5 p-2.5 text-left"
              style={{ background: "color-mix(in oklab, var(--foreground) 3%, transparent)" }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)` }}
                >
                  {Trend ? (
                    <Trend className="h-3.5 w-3.5" style={{ color: tone }} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" style={{ color: tone }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-semibold">{insight.title}</p>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                    {insight.detail}
                  </p>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 flex gap-1.5">
                          {insight.source.map((source) => (
                            <div
                              key={source.label}
                              className="flex-1 rounded-lg border border-white/5 p-1.5 text-center"
                              style={{ background: "var(--card)" }}
                            >
                              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
                                {source.label}
                              </p>
                              <p className="mt-0.5 text-[12px] font-semibold tabular-nums">
                                {source.value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-1.5 text-[9.5px] text-muted-foreground">
                          Source: your transactions and budgets
                        </p>
                      </motion.div>
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
