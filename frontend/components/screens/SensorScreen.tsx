import { SensorApiStatus, SensorKey } from "../../lib/api";

const sensorStatusCopy: Record<SensorApiStatus, string> = {
  idle: "Awaiting check",
  checking: "Stabilizing…",
  stable: "Signal locked",
};

type SensorScreenProps = {
  sensorStatus: Record<SensorKey, SensorApiStatus>;
  sensorDetails: Record<SensorKey, string>;
  labels: Record<SensorKey, string>;
  descriptions: Record<SensorKey, string>;
  preview: {
    heart_rate: number;
    hrv_rmssd: number;
    eda_drift: number;
    breath_rate?: number;
  } | null;
  checking: boolean;
  onCheck: () => void;
};

export default function SensorScreen({
  sensorStatus,
  sensorDetails,
  labels,
  descriptions,
  preview,
  checking,
  onCheck,
}: SensorScreenProps) {
  return (
    <div className="sensor-grid">
      {(Object.keys(labels) as SensorKey[]).map((key) => (
        <div className="sensor-card" key={key}>
          <div className="sensor-card__header">
            <span>{labels[key]}</span>
            <span className={`sensor-chip sensor-chip--${sensorStatus[key]}`}>
              {sensorStatusCopy[sensorStatus[key]]}
            </span>
          </div>
          <p>{descriptions[key]}</p>
          {sensorDetails[key] && (
            <p className="preview-card__copy">{sensorDetails[key]}</p>
          )}
        </div>
      ))}
      <div className="preview-card">
        <h4>Live preview</h4>
        <p className="preview-card__copy">
          {preview
            ? `HR: ${preview.heart_rate} bpm • HRV RMSSD: ${preview.hrv_rmssd} ms • EDA Drift: ${preview.eda_drift} μS`
            : "Awaiting sensor snapshot"}
        </p>
        <div className="preview-wave">
          <div />
        </div>
        {preview?.breath_rate && (
          <p className="preview-card__copy">
            Breath rate: {preview.breath_rate.toFixed(1)} bpm
          </p>
        )}
        <p className="preview-card__copy">Short-term trends for reassurance.</p>
      </div>
      <button className="wizard-button" onClick={onCheck} disabled={checking}>
        {checking ? "Checking sensors…" : "Check sensors"}
      </button>
    </div>
  );
}

