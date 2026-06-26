import { CoreFrequencyApiResponse } from "../../lib/api";

type ResultsScreenProps = {
  ready: boolean;
  loading: boolean;
  result: CoreFrequencyApiResponse | null;
  error: string | null;
};

export default function ResultsScreen({ ready, loading, result, error }: ResultsScreenProps) {
  const gaugeValue = result?.core_index ?? null;
  const gaugeLabel = loading && !result ? "Fetching data..." : result?.qualitative_label ?? "Awaiting data";
  const gaugeDisplay = loading && !result ? "…" : gaugeValue?.toFixed(2) ?? "—";
  const dominantBand = gaugeValue ? Math.round(100 + gaugeValue * 700) : null;

  return (
    <div className="results-grid">
      <div className="result-gauge">
        <p>Core Resonance</p>
        <div className="result-gauge__circle">
          <span>{gaugeDisplay}</span>
          <small>{gaugeLabel}</small>
        </div>
        <p>{dominantBand ? "Main pattern available" : "Main pattern pending"}</p>
      </div>
      <div className="result-cards">
        <article className="result-card">
          <h4>Body Resonance</h4>
          <p>
            Index:{" "}
            {result ? result.body_resonance.toFixed(2) : loading ? "…" : "—"}
          </p>
          <ul>
            <li>HRV: moderate, nervous system on guard.</li>
            <li>Heart Rate: slightly elevated.</li>
            <li>EDA: mild chronic arousal.</li>
          </ul>
        </article>
        <article className="result-card">
          <h4>Expression Resonance</h4>
          <p>
            Index:{" "}
            {result ? result.soul_resonance.toFixed(2) : loading ? "…" : "—"}
          </p>
          <ul>
            <li>Voice clear yet strained on vulnerable phrases.</li>
            <li>Good expressiveness with subtle tension.</li>
          </ul>
        </article>
        <article className="result-card">
          <h4>Heart–Mind Resonance</h4>
          <p>
            Index:{" "}
            {result ? result.heart_mind_resonance.toFixed(2) : loading ? "…" : "—"}
          </p>
          <ul>
            <li>Reactivity: strong during emotional recall.</li>
            <li>Recovery: partial return post breathwork.</li>
          </ul>
        </article>
      </div>
      <div className="result-actions">
        <button className="wizard-button" disabled={!result}>
          View Rebalancing Guidance
        </button>
        <button className="wizard-button wizard-button--ghost" disabled={!result}>
          View Load Patterns
        </button>
        <button className="wizard-button wizard-button--ghost" disabled={!result}>
          Save & compare
        </button>
      </div>
      <p className="panel__description">
        Patterns are organized into a Resonance Profile for reflection, not diagnosis.
      </p>
      {error && <p className="wizard-error">{error}</p>}
      {!ready && (
        <p className="wizard-hint">
          The Resonance Report becomes available after baseline, voice, challenge, and recovery data are captured.
        </p>
      )}
    </div>
  );
}
