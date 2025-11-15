import { PhaseId } from "../../lib/api";

export type PhaseState = {
  started: boolean;
  remaining: number;
  completed: boolean;
};

type TimerBlockProps = {
  label: string;
  phaseId: PhaseId;
  phase: PhaseState;
  duration: number;
  isStarting: boolean;
  onStart: (phase: PhaseId) => void;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export default function TimerBlock({
  label,
  phaseId,
  phase,
  duration,
  isStarting,
  onStart,
}: TimerBlockProps) {
  const progress = duration
    ? Math.min(100, ((duration - phase.remaining) / duration) * 100)
    : 0;

  return (
    <div className="timer-block">
      <div className="timer-block__header">
        <span>{label}</span>
        <span>{formatTime(phase.remaining)}</span>
      </div>
      <div className="timer-track">
        <div className="timer-track__fill" style={{ width: `${progress}%` }} />
      </div>
      {!phase.started && (
        <button
          className="wizard-button wizard-button--ghost"
          onClick={() => onStart(phaseId)}
          disabled={isStarting}
        >
          {isStarting ? "Starting…" : `Start ${label.toLowerCase()}`}
        </button>
      )}
      {phase.completed && (
        <p className="timer-block__note">Phase captured. You can continue.</p>
      )}
    </div>
  );
}

