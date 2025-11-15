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

const signalPills = ["Theta Bloom", "Heart Coherence", "Auric Shield"];

export default function CoreFrequencyCard({ status, onSimulate }: Props) {
  return (
    <section className="frequency-card">
      <div className="frequency-card__header">
        <div>
          <p className="hero__eyebrow">Core Frequency</p>
          <p className="frequency-card__value">432 Hz</p>
        </div>
        <span className={statusClasses[status]}>{statusCopy[status]}</span>
      </div>

      <p className="frequency-card__copy">
        Monitoring harmonic resonance and heart–brain coherence in real time.
        When the channel is synced, we surface the most grounded guidance for
        your next ritual or session.
      </p>

      <div className="frequency-card__controls">
        <button
          className="frequency-card__button"
          onClick={onSimulate}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Aligning waveform…" : "Simulate analysis"}
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
