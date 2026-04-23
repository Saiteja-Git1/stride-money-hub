import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FinanceCurrency } from "@/lib/finance";

interface Props {
  currency?: FinanceCurrency;
  income: number;
  expense: number;
  total: number;
}

export function LumenAICard({ currency = "USD", income, expense, total }: Props) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");

  async function loadInsight() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lumen-ai", {
        body: {
          mode: "insight",
          context: {
            monthIncome: income,
            monthExpense: expense,
            totalBalance: total,
            net: income - expense,
            currency,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsight(data?.text || "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load insight";
      toast.error(msg);
      setInsight("Add a goal or budget to get a personalized insight.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ask() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("lumen-ai", {
        body: {
          mode: "chat",
          prompt: `My monthly income is ${income.toFixed(0)} ${currency}, expenses ${expense.toFixed(0)} ${currency}, total balance ${total.toFixed(0)} ${currency}. Question: ${q}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnswer(data?.text || "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get an answer");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5 p-4"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, var(--card)), var(--card))",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl"
        style={{ background: "var(--accent)" }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--gradient-violet)",
            boxShadow: "var(--shadow-glow-violet)",
          }}
        >
          <Sparkles className="h-[18px] w-[18px] text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold">Lumen AI</p>
            <button
              onClick={loadInsight}
              disabled={loading}
              aria-label="Refresh insight"
              className="glass-subtle flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={insight + (loading ? "_l" : "")}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-1 min-h-[32px] text-[12px] leading-relaxed text-muted-foreground"
            >
              {loading && !insight ? "Reading your numbers…" : insight}
            </motion.p>
          </AnimatePresence>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="mt-2 text-[11.5px] font-semibold text-primary"
            >
              Ask Lumen AI →
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="glass-subtle flex items-center gap-2 rounded-xl px-3 py-1.5">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  placeholder="e.g. How can I save more this month?"
                  className="h-8 w-full bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
                />
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={ask}
                  disabled={asking || !question.trim()}
                  aria-label="Send"
                  className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-40"
                  style={{
                    background: "var(--gradient-primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                </motion.button>
              </div>
              <AnimatePresence>
                {(asking || answer) && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-white/5 p-2.5 text-[12px] leading-relaxed text-muted-foreground"
                    style={{ background: "var(--card)" }}
                  >
                    {asking && !answer ? "Thinking…" : answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
