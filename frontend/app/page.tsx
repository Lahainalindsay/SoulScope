"use client";

import { useState } from "react";
import CoreFrequencyCard from "../components/CoreFrequencyCard";

export default function HomePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10 space-y-10">
      <section>
        <h1 className="text-3xl font-semibold">SoulScope</h1>
        <p className="text-slate-300">
          Placeholder UI for the Core Frequency visualizer. Wire this up to the
          FastAPI backend to stream live results.
        </p>
      </section>

      <CoreFrequencyCard
        status={status}
        onSimulate={() => {
          setStatus("loading");
          setTimeout(() => setStatus("done"), 1200);
        }}
      />
    </main>
  );
}
