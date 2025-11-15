import { PhaseId } from "../../lib/api";
import TimerBlock, { PhaseState } from "./TimerBlock";

type BaselineScreenProps = {
  phase: PhaseState;
  duration: number;
  isStarting: boolean;
  onStart: (phase: PhaseId) => void;
};

export default function BaselineScreen({
  phase,
  duration,
  isStarting,
  onStart,
}: BaselineScreenProps) {
  return (
    <div className="panel">
      <p className="panel__description">
        Sit comfortably. Close your eyes or soften your gaze. Just breathe naturally.
        For the next 2 minutes, we’re recording your resting pattern.
      </p>
      <TimerBlock
        label="Baseline capture"
        phaseId="baseline"
        phase={phase}
        duration={duration}
        isStarting={isStarting}
        onStart={onStart}
      />
      <p className="panel__description">
        Backend: Collect HR/HRV, EDA, breath → populate <code>baseline_*</code> metrics and add to
        PhysioTimeSeries.
      </p>
    </div>
  );
}

