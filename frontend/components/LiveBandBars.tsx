import { type RecorderSignalSample } from "./Recorder";
import { NOTE_ORDER, getSoulScopeNoteColor } from "../lib/noteSystem";

type LiveBandBarsProps = {
  sample: RecorderSignalSample | null;
};

const LABELS: Array<keyof RecorderSignalSample["bandPercentages"]> = [...NOTE_ORDER];

export default function LiveBandBars({ sample }: LiveBandBarsProps) {
  const dominant = LABELS.reduce(
    (best, label) =>
      (sample?.bandPercentages[label] ?? 0) > (sample?.bandPercentages[best] ?? 0) ? label : best,
    "C"
  );

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Live spectrum preview</div>
          <div className="mt-1 text-xs text-slate-400">Live note-class energy across the measured voice range.</div>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
          {sample ? dominant : "Idle"}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {LABELS.map((label) => {
          const value = Math.round(sample?.bandPercentages[label] ?? 0);
          return (
            <div key={label} className="grid gap-2 md:grid-cols-[100px_minmax(0,1fr)_44px] md:items-center">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-300 transition-[width] duration-150"
                  style={{ width: `${Math.max(4, value)}%`, background: getSoulScopeNoteColor(label) }}
                />
              </div>
              <div className="text-right text-xs font-medium text-white">{value}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
