type SignalMeterProps = {
  dbfs: number;
  rms: number;
};

function getSignalLabel(dbfs: number) {
  if (dbfs < -45) return { text: "Too quiet", tone: "warn" as const };
  if (dbfs > -6) return { text: "Clipping risk", tone: "bad" as const };
  return { text: "Good signal", tone: "good" as const };
}

export default function SignalMeter({ dbfs, rms }: SignalMeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(((dbfs + 60) / 60) * 100)));
  const signal = getSignalLabel(dbfs);
  const toneClass =
    signal.tone === "good"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : signal.tone === "warn"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : "border-rose-400/30 bg-rose-400/10 text-rose-200";

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Signal quality</div>
          <div className="mt-1 text-xs text-slate-400">Mic level and clipping guardrail.</div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${toneClass}`}>
          {signal.text}
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>RMS {rms.toFixed(3)}</span>
        <span>{Number.isFinite(dbfs) ? dbfs.toFixed(1) : "-120.0"} dBFS</span>
      </div>
    </div>
  );
}
