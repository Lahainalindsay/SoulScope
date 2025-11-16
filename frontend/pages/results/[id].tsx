"use client";

import { useRouter } from "next/router";

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Your SoulScope Scan Results</h1>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">🔊 Harmonic Center</h2>
          <p className="mt-2">
            Your core frequency is <span className="text-yellow-400 font-bold">204.3 Hz (G♯3 / A♭3)</span>
          </p>
          <p className="mt-1 text-sm text-gray-400">
            This tone resonates with your willpower, personal sovereignty, and gut-driven confidence.
          </p>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">📉 Harmonic Gaps</h2>
          <p className="mt-2">
            You&apos;re currently lacking expression in the <span className="text-blue-300">392–410 Hz</span> range (Throat chakra).
          </p>
          <p className="mt-1 text-sm text-gray-400">
            May indicate blocked self-expression, people-pleasing, or fear of speaking your truth.
          </p>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">🌀 Integration Protocol</h2>
          <ul className="list-disc ml-5 mt-2 space-y-2 text-sm">
            <li><strong>Listen:</strong> Use your custom tone pack including 204.3 Hz + 396 Hz balancing tones.</li>
            <li><strong>See:</strong> Focus on your harmonic glyph visual while breathing slowly.</li>
            <li><strong>Breathe:</strong> Use a 5-5-5 rhythm (inhale, hold, exhale) while visualizing throat chakra expansion.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
