"use client";

import Head from "next/head";
import Link from "next/link";

const steps = [
  {
    title: "1. Voice Resonance Capture",
    description:
      "You speak freely into the mic for 15 seconds. We analyze your waveform, timbre, and hidden harmonic bands to detect your core frequency and missing tones.",
    details: [
      "FFT spectrum analysis (Meyda) to map tone intensity vs frequency",
      "Micro-formant detection reveals emotional states & blockages",
      "Sacred geometry filters match your voice to chakra nodes",
    ],
  },
  {
    title: "2. Face & Breath Sensor",
    description:
      "Using your front camera, we read micro-expressions, pupil dilation, skin tone, and breath motion to understand your nervous system baseline.",
    details: [
      "Facial landmark tracking with MediaPipe (beta)",
      "Skin tone variance = circulation & stress indicators",
      "Chest/throat movement detection gives breath cadence",
    ],
  },
  {
    title: "3. AI Energetic Mapping",
    description:
      "Our AI blends voice + face data to pinpoint your core chakra alignment, shadow signatures, and energetic drift.",
    details: [
      "Core frequency → chakra map",
      "Missing tones → emotional interpretation",
      "Breath & face cues → sympathetic vs parasympathetic state",
    ],
  },
  {
    title: "4. Personalized Integration Plan",
    description:
      "You receive a tailored ritual: sound frequencies, breath patterns, vision glyphs, and suggested micro-practices to restore your resonance.",
    details: [
      "Custom tone pack (play directly in results)",
      "5-5-5 breath guidance with mantras",
      "Chakra glyphs & visualization prompts",
    ],
  },
];

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How SoulScope Works – Sacred Tech Guide</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="relative min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#14141f] text-white px-6 py-16">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/7f/Sri_Yantra_svg.svg')] bg-center bg-no-repeat bg-contain opacity-[0.02] pointer-events-none z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-serif">How SoulScope Works</h1>
            <p className="text-gray-300">
              Sacred geometry + AI → A mirror of your energetic truth. Here’s how we turn your phone into a full-spectrum resonance scanner.
            </p>
            <Link href="/scan" className="text-cyan-400 underline hover:text-cyan-300 text-sm">
              Start a scan now →
            </Link>
          </div>

          {steps.map((step) => (
            <section key={step.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-2xl text-yellow-200">{step.title}</h2>
              <p className="text-gray-300">{step.description}</p>
              <ul className="list-disc ml-5 text-sm text-gray-400 space-y-1">
                {step.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="bg-black bg-opacity-30 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl text-cyan-300">Trust Your Tech</h3>
            <p className="text-gray-300">
              Your phone’s microphone, camera, and sensors are as precise as many dedicated devices. We process the signals locally using advanced AI.
            </p>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-400">
              <li>✅ High-resolution microphones & optics</li>
              <li>✅ Frequent firmware updates</li>
              <li>✅ Real-time FFT + facial landmarks</li>
              <li>✅ No Bluetooth interference</li>
            </ul>
            <p className="text-xs text-gray-500">
              Environment matters — quiet space, notifications off, breath centered. The clearer the signal you send, the clearer the mirror we return.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
