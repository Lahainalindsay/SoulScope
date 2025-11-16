import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>SoulScope – Reveal the Data of Your Soul</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#14141f] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/7f/Sri_Yantra_svg.svg')] bg-center bg-no-repeat bg-contain opacity-[0.015] pointer-events-none z-0" />

        <nav className="flex justify-between items-center px-6 py-4 relative z-10">
          <h1 className="text-lg font-semibold">SoulScope™</h1>
          <div className="space-x-4">
            <Link href="/scan" className="hover:text-cyan-400">
              Scan
            </Link>
            <Link href="/results/demo" className="hover:text-cyan-400">
              Results
            </Link>
            <a href="#" className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-full text-sm">
              Log In
            </a>
          </div>
        </nav>

        <main className="relative z-10 px-6 py-20 max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-serif mb-6">Reveal Your Energetic Signature</h2>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-gray-300">
            Your voice carries your unique vibrational code. Through sacred geometry, frequency tech, and emotional mapping, SoulScope reveals where you&apos;re misaligned — and guides you home to balance.
          </p>
          <Link href="/scan">
            <button className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:scale-105 transition px-8 py-3 rounded-full font-medium shadow-xl">
              Start Your Free Scan
            </button>
          </Link>
        </main>

        <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center space-y-10">
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-yellow-300">Why Frequencies Matter</h3>
            <p className="text-gray-300">
              When specific tones are missing from your voice, it&apos;s not just technical — it’s energetic. Each missing frequency reveals an emotional block, chakra imbalance, or soul pattern ready to be seen and healed.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-2 text-cyan-400">What You&apos;ll Receive</h3>
            <ul className="text-gray-300 space-y-1">
              <li>🔊 Core Frequency (Your Soul Tone)</li>
              <li>📉 Missing Chakra Ranges</li>
              <li>🌀 Emotional + Energetic Interpretation</li>
              <li>🎧 Personalized Tone Pack</li>
              <li>🌈 Integration Guide (Sound, Shape, Breath)</li>
            </ul>
          </div>
        </section>

        <section className="relative z-10 px-6 py-20 bg-black bg-opacity-30 text-center">
          <h3 className="text-2xl mb-4">Be the First to Get Scanned</h3>
          <form className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <input type="text" placeholder="Your name" className="px-4 py-2 rounded-lg bg-white/10 text-white w-full md:w-1/2" required />
            <input type="email" placeholder="Email address" className="px-4 py-2 rounded-lg bg-white/10 text-white w-full md:w-1/2" required />
            <button type="submit" onClick={(event) => event.preventDefault()} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-full">
              Join Waitlist
            </button>
          </form>
        </section>

        <footer className="relative z-10 text-center text-gray-500 text-sm py-10">
          <p>
            <a href="#">Privacy</a> • <a href="#">Terms</a>
          </p>
        </footer>
      </div>
    </>
  );
}
