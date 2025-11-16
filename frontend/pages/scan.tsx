import dynamic from "next/dynamic";

const Recorder = dynamic(() => import("../components/Recorder"), { ssr: false });

import Head from "next/head";

export default function ScanPage() {
  return (
    <>
      <Head>
        <title>SoulScope Scan – Speak Your Frequency</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-black to-[#0d0e1a] text-white">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/7f/Sri_Yantra_svg.svg')] bg-center bg-no-repeat bg-contain opacity-[0.01] pointer-events-none z-0" />

        <main className="relative z-10 px-6 py-20 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-serif mb-4">Speak Into the Mirror</h2>
          <p className="text-gray-400 mb-10">
            Speak from your heart. Your voice carries your emotional resonance and hidden energetic signature. We’ll analyze it in real time.
          </p>
          <Recorder />
          <p className="text-sm text-gray-500 mt-6 italic">
            Biometric voice scan powered by FFT. Your data never leaves your device.
          </p>
        </main>
      </div>
    </>
  );
}
