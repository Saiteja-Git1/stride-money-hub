import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import type { FinanceCurrency } from "@/lib/finance";

interface Props {
  currency?: FinanceCurrency;
  income: number;
  expense: number;
  total: number;
}

export function LumenAICard({ currency = "INR", income, expense, total }: Props) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");

  async function loadInsight() {
    setLoading(true);
    setInsight("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 120,
          system: "You are a personal finance assistant. Give one short, specific, actionable insight in 1-2 sentences. No generic advice. Be direct.",
          messages: [
            {
              role: "user",
              content: `Monthly income: ${income.toFixed(0)} ${currency}, expenses: ${expense.toFixed(0)} ${currency}, total balance: ${total.toFixed(0)} ${currency}, net: ${(income - expense).toFixed(0)} ${currency}. Give me one specific insight.`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data?.content?.[0]?.text ?? "";
      if (!text) throw new Error("No response");
      setInsight(text);
    } catch {
      toast.error("Lumen AI unavailable. Set up your API key in settings.");
      setInsight("Tap refresh once your Gemini API key is configured.");
    } finally {
      setLoading(false);
    }
  }

  async function ask() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setAnswer("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: "You are a personal finance assistant. Answer concisely in 2-3 sentences max.",
          messages: [
            {
              role: "user",
              content: `My monthly income is ${income.toFixed(0)} ${currency}, expenses ${expense.toFixed(0)} ${currency}, total balance ${total.toFixed(0)} ${currency}. Question: ${q}`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data?.content?.[0]?.text ?? "";
      if (!text) throw new Error("No response");
      setAnswer(text);
    } catch {
      toast.error("Could not get an answer.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5 p-4"
      style={{
        background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, var(--card)), var(--card))",
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
          style={{ background: "var(--gradient-violet)", boxShadow: "var(--shadow-glow-violet)" }}
        >
          <Sparkles className="h-[18px] w-[18px] text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Lumen AI</p>

          {!insight && !loading && (
            <button
              onClick={loadInsight}
              className="mt-2 text-[11.5px] font-semibold text-primary"
            >
              Get insight →
            </button>
          )}

          {(loading || insight) && (
            <AnimatePresence mode="wait">
              <motion.p
                key={insight + (loading ? "_l" : "")}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-1 min-h-[32px] text-[12px] leading-relaxed text-muted-foreground"
              >
                {loading ? "Reading your numbers…" : insight}
              </motion.p>
            </AnimatePresence>
          )}

          {insight && !loading && (
            <>
              {!open ? (
                <button onClick={() => setOpen(true)} className="mt-2 text-[11.5px] font-semibold text-primary">
                  Ask Lumen AI →
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="glass-subtle flex items-center gap-2 rounded-xl px-3 py-1.5">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void ask()}
                      placeholder="e.g. How can I save more this month?"
                      className="h-8 w-full bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
                    />
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => void ask()}
                      disabled={asking || !question.trim()}
                      aria-label="Send"
                      className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-40"
                      style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}