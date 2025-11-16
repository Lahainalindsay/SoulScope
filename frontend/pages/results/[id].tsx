import { useRouter } from "next/router";

export default function ResultsPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#12121e] text-white px-6 py-20">
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl font-serif mb-6 text-center">SoulScope Scan Results</h1>

        <section className="mb-12 bg-white/5 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl mb-2 text-yellow-300">🎯 Core Frequency</h2>
          <p className="text-xl font-mono text-white">204 Hz → G♯3 / A♭3</p>
          <p className="text-gray-400 mt-2">Associated with Solar Plexus: Willpower, clarity, sovereignty.</p>
        </section>

        <section className="mb-12 bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl mb-2 text-cyan-300">📉 Missing Chakra Tones</h2>
          <ul className="space-y-2">
            <li className="bg-white/10 px-4 py-2 rounded">
              Throat (G4 / 392–410 Hz) – Difficulty expressing emotions, fear of speaking truth
            </li>
            <li className="bg-white/10 px-4 py-2 rounded">
              Crown (B5 / 480–500 Hz) – Disconnected from universal flow or divine clarity
            </li>
          </ul>
        </section>

        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl mb-2 text-pink-300">🌀 Integration Protocol</h2>
          <ul className="list-disc ml-6 space-y-2 text-sm text-gray-300">
            <li>
              <strong>Listen:</strong> Custom tone pack – play 204 Hz, 396 Hz, and 480 Hz daily for 5 minutes
            </li>
            <li>
              <strong>Breathe:</strong> 5-5-5 breath with soft humming (“mmm”) on exhale
            </li>
            <li>
              <strong>See:</strong> Gaze at harmonic mandala while focused on your solar plexus
            </li>
          </ul>
        </section>

        <div className="text-center mt-10">
          <button className="bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 rounded-full shadow-lg hover:scale-105 transition">
            Generate Deep SoulCode ($97)
          </button>
        </div>
      </div>
    </div>
  );
}
