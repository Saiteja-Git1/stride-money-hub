import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Tx {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  categoryId: string;
  note: string;
  date: string;
}
interface Cat { id: string; name: string; type: "income" | "expense" }
interface Bud { id: string; categoryId: string; limit: number; spent: number }

interface Body {
  transactions: Tx[];
  categories: Cat[];
  budgets: Bud[];
  currency?: string;
}

interface Insight {
  id: string;
  kind: "spending_change" | "budget_warning" | "savings_trend" | "top_category" | "income_vs_expense";
  severity: "info" | "warning" | "good";
  title: string;
  detail: string;
  source: { label: string; value: string }[];
}

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getTime();
}
function startOfPrevMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).getTime();
}
function fmt(n: number) {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function computeInsights(body: Body): Insight[] {
  const out: Insight[] = [];
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const prevMonth = startOfPrevMonth(now);
  const cats = new Map(body.categories.map((c) => [c.id, c]));

  const monthTx = body.transactions.filter((t) => new Date(t.date).getTime() >= thisMonth);
  const prevTx = body.transactions.filter((t) => {
    const ts = new Date(t.date).getTime();
    return ts >= prevMonth && ts < thisMonth;
  });

  const monthExp = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthInc = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExp = prevTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // 1. Spending change vs last month
  if (prevExp > 0) {
    const diff = monthExp - prevExp;
    const pct = Math.round((diff / prevExp) * 100);
    if (Math.abs(pct) >= 5) {
      const up = pct > 0;
      out.push({
        id: "spending_change",
        kind: "spending_change",
        severity: up ? "warning" : "good",
        title: up ? `Spending up ${pct}%` : `Spending down ${Math.abs(pct)}%`,
        detail: up
          ? `You've spent ${fmt(monthExp)} this month, ${fmt(Math.abs(diff))} more than last month.`
          : `You've spent ${fmt(monthExp)} this month, ${fmt(Math.abs(diff))} less than last month.`,
        source: [
          { label: "This month", value: fmt(monthExp) },
          { label: "Last month", value: fmt(prevExp) },
        ],
      });
    }
  }

  // 2. Budget warnings
  for (const b of body.budgets) {
    const cat = cats.get(b.categoryId);
    if (!cat) continue;
    const used = b.limit > 0 ? b.spent / b.limit : 0;
    if (used >= 0.9) {
      out.push({
        id: `budget_${b.id}`,
        kind: "budget_warning",
        severity: used >= 1 ? "warning" : "warning",
        title: used >= 1 ? `${cat.name} budget exceeded` : `${cat.name} budget at ${Math.round(used * 100)}%`,
        detail:
          used >= 1
            ? `You've spent ${fmt(b.spent)} of your ${fmt(b.limit)} budget for ${cat.name}.`
            : `${fmt(b.limit - b.spent)} left in your ${cat.name} budget this month.`,
        source: [
          { label: "Spent", value: fmt(b.spent) },
          { label: "Limit", value: fmt(b.limit) },
        ],
      });
    }
  }

  // 3. Top category this month
  const byCat = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "expense") continue;
    byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
  }
  const topEntry = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topEntry && monthExp > 0) {
    const cat = cats.get(topEntry[0]);
    const pct = Math.round((topEntry[1] / monthExp) * 100);
    if (cat && pct >= 20) {
      out.push({
        id: "top_category",
        kind: "top_category",
        severity: "info",
        title: `${cat.name} is your top expense`,
        detail: `${cat.name} accounts for ${pct}% (${fmt(topEntry[1])}) of your spending this month.`,
        source: [
          { label: cat.name, value: fmt(topEntry[1]) },
          { label: "Of total", value: `${pct}%` },
        ],
      });
    }
  }

  // 4. Savings trend (income vs expense)
  if (monthInc > 0) {
    const net = monthInc - monthExp;
    const rate = Math.round((net / monthInc) * 100);
    out.push({
      id: "savings_trend",
      kind: "savings_trend",
      severity: rate >= 20 ? "good" : rate >= 0 ? "info" : "warning",
      title:
        rate >= 20
          ? `Saving ${rate}% of income`
          : rate >= 0
            ? `Net positive: ${fmt(net)}`
            : `Spending more than earning`,
      detail:
        rate >= 0
          ? `You're keeping ${fmt(net)} of ${fmt(monthInc)} earned this month.`
          : `You've spent ${fmt(Math.abs(net))} more than you earned this month.`,
      source: [
        { label: "Income", value: fmt(monthInc) },
        { label: "Expense", value: fmt(monthExp) },
      ],
    });
  }

  return out;
}

async function summarize(insights: Insight[]): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY || insights.length === 0) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are Lumen, a finance assistant. Given pre-computed insights with real numbers, write ONE short summary sentence (max 22 words). Do not invent numbers. No emojis. No markdown. No greeting.",
          },
          {
            role: "user",
            content: `Insights JSON: ${JSON.stringify(insights.map((i) => ({ title: i.title, detail: i.detail })))}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = (await req.json()) as Body;
    const insights = computeInsights(body);
    const summary = await summarize(insights);
    return new Response(
      JSON.stringify({
        insights,
        summary,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("lumen-insights error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});