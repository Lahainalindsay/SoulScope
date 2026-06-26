type Status = "idle" | "loading" | "done";

interface Props {
  status: Status;
  onSimulate: () => void;
}

const statusCopy: Record<Status, string> = {
  idle: "Calibrating",
  loading: "Analyzing",
  done: "Synchronized",
};

const statusClasses: Record<Status, string> = {
  idle: "status-chip status-chip--idle",
  loading: "status-chip status-chip--loading",
  done: "status-chip status-chip--done",
};

const signalPills = ["Clarity", "Recovery", "Adaptability"];

export default function CoreFrequencyCard({ status, onSimulate }: Props) {
  return (
    <section className="frequency-card">
      <div className="frequency-card__header">
        <div>
          <p className="hero__eyebrow">Core Resonance</p>
          <p className="frequency-card__value">Resonance Profile</p>
        </div>
        <span className={statusClasses[status]}>{statusCopy[status]}</span>
      </div>

      <p className="frequency-card__copy">
        Monitoring observed tendencies across mental clarity, physical load, recovery, and behavioral
        momentum. When the profile is ready, SoulScope surfaces practical guidance for the current state
        of your system.
      </p>

      <div className="frequency-card__controls">
        <button
          className="frequency-card__button"
          onClick={onSimulate}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Mapping patterns..." : "Simulate analysis"}
        </button>
        <div className="frequency-card__signal">
          {signalPills.map((pill) => (
            <span className="signal-pill" key={pill}>
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
