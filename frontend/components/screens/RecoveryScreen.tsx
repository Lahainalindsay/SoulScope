import { PhaseId } from "../../lib/api";
import TimerBlock, { PhaseState } from "./TimerBlock";

type RecoveryScreenProps = {
  phase: PhaseState;
  duration: number;
  isStarting: boolean;
  onStart: (phase: PhaseId) => void;
};

export default function RecoveryScreen({
  phase,
  duration,
  isStarting,
  onStart,
}: RecoveryScreenProps) {
  return (
    <div className="recovery-grid">
      <div className="breath-visual">
        <div className="breath-visual__orb" />
        <p>Inhale 4 • Exhale 6</p>
        <p>Follow the orb as it expands and contracts.</p>
      </div>
      <div>
        <h4>What we capture</h4>
        <ul>
          <li>EDA drift back toward baseline (map to recovery_index).</li>
          <li>HR/HRV settling as parasympathetic tone returns.</li>
          <li>Breath entrainment quality (optional belt).</li>
        </ul>
        <TimerBlock
          label="Recovery breath"
          phaseId="recovery"
          phase={phase}
          duration={duration}
          isStarting={isStarting}
          onStart={onStart}
        />
      </div>
    </div>
  );
}

