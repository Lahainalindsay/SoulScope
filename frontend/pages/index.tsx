import Head from "next/head";
import Link from "next/link";
import { useUser } from "@supabase/auth-helpers-react";
import Navbar from "../components/Navbar";

export default function Home() {
  // useUser returns `User | null`
  const user = useUser();

  const ctaHref = user ? "/scan" : "/auth";
  const ctaLabel = user ? "Start Your Free Scan" : "Log in to Start";

  return (
    <>
      <Head>
        <title>SoulScope – Reveal the Data of Your Soul</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-[#050315] via-[#07071e] to-[#020311] text-white">
        {/* Top navigation (only once) */}
        <Navbar />

        {/* Hero */}
        <main className="relative z-10 px-6 py-20 max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-serif mb-6">
            Reveal Your Energetic Signature
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-gray-300">
            Your voice carries your unique vibrational code. Through sacred
            geometry, frequency tech, and emotional mapping, SoulScope reveals
            where you&apos;re misaligned — and guides you home to balance.
          </p>

          <div className="mt-8">
            <Link href={ctaHref}>
              <button className="rounded-full px-8 py-3 text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/40 hover:scale-105 transition">
                {ctaLabel}
              </button>
            </Link>
          </div>
        </main>

        {/* Why Frequencies Matter */}
        <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-semibold mb-2 text-yellow-300">
            Why Frequencies Matter
          </h3>
          <p className="text-gray-300">
            When specific tones are missing from your voice, it&apos;s not just
            technical — it&apos;s energetic. Each missing frequency can reveal an
            emotional block, chakra imbalance, or soul pattern ready to be seen
            and healed.
          </p>
        </section>

        {/* What You’ll Receive */}
        <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl backdrop-blur text-center space-y-6">
          <h3 className="text-2xl font-semibold mb-2 text-cyan-400">
            What You&apos;ll Receive
          </h3>
          <ul className="text-gray-300 space-y-1 text-left md:text-center">
            <li>🔊 Core Frequency (Your Soul Tone)</li>
            <li>📉 Missing Chakra Ranges</li>
            <li>🌀 Emotional + Energetic Interpretation</li>
            <li>🎧 Personalized Tone Pack</li>
            <li>🌈 Integration Guide (Sound, Shape, Breath)</li>
          </ul>
        </section>

        {/* Trust Your Tech */}
        <section className="relative z-10 px-6 py-16 max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl backdrop-blur text-center space-y-4 mt-8">
          <h3 className="text-2xl font-semibold text-cyan-300">
            Trust Your Tech
          </h3>
          <p className="text-gray-300">
            Your phone is already a powerful biometric scanner. SoulScope
            extracts meaningful energetic data from the microphone and camera —
            no extra hardware, no fluff.
          </p>
          <div className="grid md:grid-cols-2 gap-3 text-left text-sm text-gray-300">
            <div>✅ High-resolution microphones and optical sensors</div>
            <div>✅ Frequent firmware updates for better signal handling</div>
            <div>✅ Real-time analysis with advanced AI</div>
            <div>✅ Clean pipeline: signal → scan → results</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You&apos;re not just matching a device — you&apos;re tuning your field.
          </p>
        </section>

        {/* Waitlist – only when NOT logged in */}
        {!user && (
          <section className="relative z-10 px-6 py-20 bg-black/40 text-center mt-8">
            <h3 className="text-2xl mb-4">Be the First to Get Scanned</h3>
            <form className="flex flex-col md:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Your name"
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 outline-none text-sm w-full md:w-auto"
              />
              <input
                type="email"
                placeholder="Email address"
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 outline-none text-sm w-full md:w-auto"
              />
              <button
                type="submit"
                onClick={(event) => event.preventDefault()}
                className="px-6 py-2 rounded-full bg-white text-sm font-medium text-gray-900 hover:bg-gray-200 transition"
              >
                Join Waitlist
              </button>
            </form>
          </section>
        )}

        {/* Footer */}
        <footer className="relative z-10 text-center text-gray-500 text-sm py-10 space-y-2">
          <p>
            <Link
              href="/how-it-works"
              className="text-cyan-300 underline hover:text-cyan-200"
            >
              How SoulScope Works
            </Link>
          </p>
          <p>
            <a href="#">Privacy</a> • <a href="#">Terms</a>
          </p>
        </footer>
      </div>
    </>
  );
}
