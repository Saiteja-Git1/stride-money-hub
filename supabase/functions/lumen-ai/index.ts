import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Mode = "insight" | "goal" | "chat";

interface Body {
  mode: Mode;
  prompt?: string;
  context?: Record<string, unknown>;
}

function systemFor(mode: Mode): string {
  if (mode === "insight") {
    return [
      "You are Lumen, a calm, premium personal finance assistant.",
      "Given the user's monthly totals, write ONE short insight (max 2 sentences, ~22 words).",
      "Be specific with numbers. Encouraging but honest. No emojis. No greetings. No markdown.",
    ].join(" ");
  }
  if (mode === "goal") {
    return [
      "You are Lumen, a personal finance coach.",
      "Given a savings goal (target, current, monthsLeft, monthlyNeeded), write ONE actionable tip in 1-2 sentences (~25 words).",
      "Reference the actual numbers. No emojis. No greetings. No markdown.",
    ].join(" ");
  }
  return "You are Lumen, a friendly personal finance assistant. Keep answers concise (under 80 words) and practical. No markdown.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    const mode: Mode = body.mode ?? "chat";
    const userContent =
      mode === "chat"
        ? body.prompt ?? ""
        : `Context (JSON): ${JSON.stringify(body.context ?? {})}\n\nWrite the response now.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemFor(mode) },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lumen-ai error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});