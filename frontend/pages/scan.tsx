import dynamic from "next/dynamic";

const Recorder = dynamic(() => import("../components/Recorder"), { ssr: false });

export default function Scan() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Speak Your Truth</h1>
        <p className="mb-8 text-center text-lg">
          Record a short message from your heart. We&apos;ll analyze your vocal frequency and reflect back your harmonic signature.
        </p>
        <Recorder />
      </div>
    </div>
  );
}
