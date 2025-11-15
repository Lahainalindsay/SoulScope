type IntroScreenProps = {
  eyebrow: string;
  title: string;
  summary: string;
};

export default function IntroScreen({ eyebrow, title, summary }: IntroScreenProps) {
  return (
    <div className="panel">
      <p className="hero__eyebrow">{eyebrow}</p>
      <h2 className="panel__title">{title}</h2>
      <p className="panel__description">{summary}</p>
      <ul>
        <li>PhysioTimeSeries → HRV, EDA, breath (baseline + challenge).</li>
        <li>VoiceFeatures → aggregated from guided prompts.</li>
        <li>ReactivityMetrics → baseline vs challenge vs recovery.</li>
      </ul>
      <p className="panel__description">
        After ~6–8 minutes we call <code>fuse_core_frequency()</code> and reveal the magic.
      </p>
    </div>
  );
}

