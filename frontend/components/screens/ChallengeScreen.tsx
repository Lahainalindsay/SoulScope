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
        <h4>Reflection prompt</h4>
        <ul>
          <li>Bring one recent moment to mind.</li>
          <li>Choose something meaningful but manageable.</li>
          <li>Let your attention return to the room before continuing.</li>
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
        label="Reflection window"
        phaseId="challenge"
        phase={phase}
        duration={duration}
        isStarting={isStarting}
        onStart={onStart}
      />
    </div>
  );
}
