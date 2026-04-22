import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/mock-data";
import { toast } from "sonner";

interface Filters {
  type?: "income" | "expense" | "all";
  range?: "7d" | "30d" | "90d" | "all";
  cats?: string[];
  q?: string;
}

interface Props {
  onApply: (filters: Filters, query: string) => void;
}

const SUGGESTIONS = [
  "How much on food this month?",
  "Show transport last 7 days",
  "Income last 90 days",
];

export function NLQueryBar({ onApply }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lumen-nl-query", {
        body: { query: q, categories: categories.map((c) => ({ id: c.id, name: c.name })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onApply((data?.filters ?? {}) as Filters, q);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not understand that");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl border border-white/5 p-3"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in oklab, var(--accent) 10%, var(--card)), var(--card))",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--gradient-violet)" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-foreground" />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(query)}
          placeholder="Ask in plain English…"
          className="h-8 w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
        />
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => run(query)}
          disabled={loading || !query.trim()}
          aria-label="Ask"
          className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-40"
          style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </motion.button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setQuery(s); run(s); }}
            className="rounded-full border border-white/5 px-2.5 py-1 text-[10.5px] text-muted-foreground hover:text-foreground"
            style={{ background: "color-mix(in oklab, var(--foreground) 4%, transparent)" }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}