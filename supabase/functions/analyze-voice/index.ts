// supabase/functions/analyze-voice/index.ts
//
// This endpoint intentionally does not fabricate voice-analysis results.
// SoulScope's current production analysis runs through the deterministic
// browser-side acoustic pipeline in frontend/lib/voiceSpectrum.ts.
//
// A future server-side analyzer must process real audio or verified acoustic
// features and return evidence with provenance and confidence. Do not replace
// this response with randomized, hard-coded, chakra, emotion, health, or
// diagnostic values.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return json({
      service: "analyze-voice",
      status: "disabled",
      productionAnalyzer: "frontend/lib/voiceSpectrum.ts",
      reason: "No verified server-side acoustic analyzer is configured.",
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  return json(
    {
      error: "SERVER_ANALYZER_NOT_CONFIGURED",
      message:
        "SoulScope will not return fabricated voice-analysis results. Use the production deterministic acoustic pipeline or configure a verified provider adapter.",
    },
    501,
  );
});
