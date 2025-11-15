import { PhaseId } from "../../lib/api";
import TimerBlock, { PhaseState } from "./TimerBlock";

type ChallengeStep = {
  label: string;
  text: string;
};

type ChallengeScreenProps = {
  timeline: ChallengeStep[];
  phase: PhaseState;
  duration: number;
  isStarting: boolean;
  onStart: (phase: PhaseId) => void;
};

export default function ChallengeScreen({
  timeline,
  phase,
  duration,
  isStarting,
  onStart,
}: ChallengeScreenProps) {
  return (
    <div className="challenge-grid">
      <div>
        <h4>Prompt script</h4>
        <ul>
          <li>Invite a gentle emotional challenge (no trauma dump).</li>
          <li>Guide: “Think of where you feel unsafe or unsupported.”</li>
          <li>After 60s, whisper: “Say silently: I am safe to feel this.”</li>
        </ul>
        <div className="timeline">
          {timeline.map((step) => (
            <article className="timeline-step" key={step.label}>
              <span className="timeline-step__label">{step.label}</span>
              <p className="timeline-step__text">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
      <TimerBlock
        label="Challenge window"
        phaseId="challenge"
        phase={phase}
        duration={duration}
        isStarting={isStarting}
        onStart={onStart}
      />
    </div>
  );
}

