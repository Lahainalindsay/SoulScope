import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
        Reveal Your Energetic Signature
      </h1>
      <p className="text-lg md:text-xl mb-10 text-center max-w-2xl">
        Your voice holds the key to your energetic balance. SoulScope analyzes your vocal tones to reflect your core resonance and show you what&apos;s missing.
      </p>
      <Link href="/scan">
        <button className="bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 rounded-full text-white font-semibold shadow-lg hover:scale-105 transition">
          Start Your Free Scan
        </button>
      </Link>
    </div>
  );
}
