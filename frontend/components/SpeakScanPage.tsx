import Recorder from "./Recorder";

export default function SpeakScanPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold text-white">Speak freely for 15 seconds</h1>
      <p className="text-sm text-gray-300">When you’re ready, tap start and just talk.</p>

      <Recorder />
    </div>
  );
}
