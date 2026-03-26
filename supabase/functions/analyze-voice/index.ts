// supabase/functions/analyze-voice/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // or "http://localhost:3000" if you want to lock it down
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // For now, ignore the audio and return a mock analysis.
  const mock = {
    dominant_chakra: "heart",
    core_frequency_hz: 432,
    intensity_scores: {
      root: 0.4,
      sacral: 0.6,
      solar_plexus: 0.7,
      heart: 0.9,
      throat: 0.5,
      third_eye: 0.8,
      crown: 0.7,
    },
  };

  return new Response(JSON.stringify(mock), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
});
