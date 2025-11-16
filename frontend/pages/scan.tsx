import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import FaceSensor from "../components/FaceSensor";

const Recorder = dynamic(() => import("../components/Recorder"), { ssr: false });

export default function ScanPage() {
  return (
    <>
      <Head>
        <title>SoulScope Scan – Speak Your Frequency</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-black to-[#0d0e1a] text-white">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/7f/Sri_Yantra_svg.svg')] bg-center bg-no-repeat bg-contain opacity-[0.015] pointer-events-none z-0" />

        <main className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif mb-4">Speak Into The Mirror</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We blend vocal FFT analysis with sacred geometry, face sensors, and breath rhythm to read your energetic signature.
            </p>
          </div>

          <div className="bg-white/5 text-left text-sm text-gray-300 rounded-2xl border border-white/5 p-5 mb-8">
            <h4 className="text-lg text-yellow-300 mb-2">Before You Begin</h4>
            <p>For the clearest scan:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Find a quiet space.</li>
              <li>Silence notifications.</li>
              <li>Take a deep breath and center yourself.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              This isn’t just about tech — it’s about tuning into yourself. The clearer the signal you send, the clearer the mirror we return.
            </p>
            <p className="text-xs text-cyan-300 mt-2 underline">
              <Link href="/how-it-works">Learn how we capture your signal →</Link>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-2xl p-6 shadow-2xl border border-white/10">
              <h3 className="text-xl font-semibold mb-2">🎙 Voice Resonance</h3>
              <p className="text-sm text-gray-400 mb-4">Speak freely. Your tone, timbre, and hidden frequencies become your map.</p>
              <Recorder />
            </div>

            <FaceSensor />
          </div>

          <p className="text-sm text-gray-500 mt-10 text-center italic">Biometric scan runs entirely on-device.</p>
        </main>
      </div>
    </>
  );
}
