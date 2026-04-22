import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Cat { id: string; name: string; type: "income" | "expense" }
interface Body {
  note: string;
  type: "income" | "expense";
  categories: Cat[];
}

// Keyword rules — first pass, deterministic, no AI cost.
const RULES: { match: RegExp; categoryName: RegExp }[] = [
  { match: /(coffee|starbucks|blue bottle|cafe|café|restaurant|grocery|trader joe|whole foods|pizza|burger|lunch|dinner|breakfast|takeout|doordash|ubereats)/i, categoryName: /(food|drink)/i },
  { match: /(uber|lyft|taxi|gas|fuel|parking|metro|subway|bus|train|flight|airline)/i, categoryName: /(transport|travel)/i },
  { match: /(amazon|uniqlo|zara|h&m|nike|target|walmart|shop|store|mall)/i, categoryName: /(shop)/i },
  { match: /(rent|mortgage|landlord)/i, categoryName: /(rent|home|housing)/i },
  { match: /(netflix|spotify|hbo|disney|hulu|cinema|movie|concert|game|steam|playstation|xbox)/i, categoryName: /(entertainment|fun)/i },
  { match: /(salary|payroll|paycheck|wages)/i, categoryName: /(salary)/i },
  { match: /(freelance|client|invoice|gig|project)/i, categoryName: /(freelance|gig)/i },
];

function ruleSuggest(note: string, categories: Cat[]): { categoryId: string; confidence: number; reason: string } | null {
  for (const r of RULES) {
    if (r.match.test(note)) {
      const cat = categories.find((c) => r.categoryName.test(c.name));
      if (cat) {
        return { categoryId: cat.id, confidence: 0.85, reason: "keyword_rule" };
      }
    }
  }
  return null;
}

async function aiSuggest(
  note: string,
  type: "income" | "expense",
  categories: Cat[],
): Promise<{ categoryId: string; confidence: number; reason: string } | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;
  const eligible = categories.filter((c) => c.type === type);
  if (eligible.length === 0) return null;

  const tool = {
    type: "function",
    function: {
      name: "pick_category",
      description: "Choose the best category for the transaction.",
      parameters: {
        type: "object",
        properties: {
          categoryId: { type: "string", enum: eligible.map((c) => c.id) },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["categoryId", "confidence"],
        additionalProperties: false,
      },
    },
  };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Pick the single best matching category for the user's transaction note. Choose only from the provided categoryId enum. If unsure, pick the closest and lower confidence.",
          },
          {
            role: "user",
            content: `Note: "${note}"\nType: ${type}\nCategories: ${JSON.stringify(eligible.map((c) => ({ id: c.id, name: c.name })))}`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "pick_category" } },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return null;
    const args = JSON.parse(call.function.arguments) as { categoryId: string; confidence: number };
    if (!eligible.find((c) => c.id === args.categoryId)) return null;
    return { categoryId: args.categoryId, confidence: args.confidence, reason: "ai" };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    const note = (body.note ?? "").trim();
    if (!note || !body.categories?.length) {
      return new Response(JSON.stringify({ suggestion: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Try keyword rules first (free, fast).
    const rule = ruleSuggest(note, body.categories.filter((c) => c.type === body.type));
    if (rule) {
      return new Response(JSON.stringify({ suggestion: rule }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Fallback to AI.
    const ai = await aiSuggest(note, body.type, body.categories);
    return new Response(JSON.stringify({ suggestion: ai }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lumen-categorize error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", suggestion: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});