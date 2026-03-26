type ScanStepperProps = {
  current: number;
  locked: boolean[];
};

export default function ScanStepper({ current, locked }: ScanStepperProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 3 }).map((_, index) => {
        const isActive = index === current;
        const isDone = locked[index];
        return (
          <div key={index} className="flex items-center gap-2">
            <div
              className={[
                "grid h-10 w-10 place-items-center rounded-2xl border text-sm font-medium transition",
                isActive ? "border-cyan-300/35 bg-cyan-400/10 text-white" : "border-white/10 bg-white/[0.03] text-slate-300",
                isDone ? "border-emerald-300/35 bg-emerald-400/10 text-emerald-100" : "",
              ].join(" ")}
            >
              {isDone ? "✓" : index + 1}
            </div>
            {index < 2 ? <div className="h-px w-10 bg-white/10" /> : null}
          </div>
        );
      })}
    </div>
  );
}
