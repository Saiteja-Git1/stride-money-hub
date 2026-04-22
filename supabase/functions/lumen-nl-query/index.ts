import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Cat { id: string; name: string }
interface Body {
  query: string;
  categories: Cat[];
}

interface Filters {
  type?: "income" | "expense" | "all";
  range?: "7d" | "30d" | "90d" | "all";
  cats?: string[];
  q?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = (await req.json()) as Body;
    const query = (body.query ?? "").trim();
    if (!query) {
      return new Response(JSON.stringify({ filters: {} }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tool = {
      type: "function",
      function: {
        name: "build_filters",
        description: "Convert a natural-language transaction query into structured filters. Do NOT compute totals or invent data — only return filters.",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["income", "expense", "all"], description: "Transaction type" },
            range: { type: "string", enum: ["7d", "30d", "90d", "all"], description: "Date range. 'this month' or 'this week' map to 30d. 'last 3 months' = 90d." },
            cats: {
              type: "array",
              items: { type: "string", enum: body.categories.map((c) => c.id) },
              description: "Category IDs that match the user's intent",
            },
            q: { type: "string", description: "Optional keyword to match in transaction notes" },
          },
          additionalProperties: false,
        },
      },
    };

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
              "You convert user finance questions into structured query filters. NEVER answer with prose or numbers — only call the build_filters tool. Map vague terms to the closest enum value.",
          },
          {
            role: "user",
            content: `Query: "${query}"\nAvailable categories: ${JSON.stringify(body.categories)}`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "build_filters" } },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ filters: {} }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const filters = JSON.parse(call.function.arguments) as Filters;
    return new Response(JSON.stringify({ filters }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lumen-nl-query error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});