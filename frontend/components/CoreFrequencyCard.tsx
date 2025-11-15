type Status = "idle" | "loading" | "done";

interface Props {
  status: Status;
  onSimulate: () => void;
}

const statusCopy: Record<Status, string> = {
  idle: "Offline",
  loading: "Analyzing",
  done: "Synced",
};

export default function CoreFrequencyCard({ status, onSimulate }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 uppercase tracking-wide">
            Core Frequency
          </p>
          <p className="text-4xl font-semibold mt-2 text-white">432 Hz</p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            status === "done"
              ? "bg-emerald-500/20 text-emerald-300"
              : status === "loading"
              ? "bg-amber-500/20 text-amber-200"
              : "bg-slate-700 text-slate-300"
          }`}
        >
          {statusCopy[status]}
        </span>
      </div>

      <p className="text-slate-300 text-sm mt-4">
        Simulated UI placeholder. Replace with live data pulled from the
        FastAPI backend once streaming pipeline is ready.
      </p>

      <button
        className="mt-6 text-sm bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition"
        onClick={onSimulate}
      >
        Simulate Analysis
      </button>
    </div>
  );
}
