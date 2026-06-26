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
        <li>Sustained vowel → jitter, shimmer, HNR, pitch stability, resonance support.</li>
        <li>Guided speech → pauses, cadence, expression, cognitive load, and directional change.</li>
        <li>ReactivityMetrics → baseline vs challenge vs recovery.</li>
      </ul>
      <p className="panel__description">
        After the guided capture, SoulScope translates the available patterns into a Resonance Profile.
      </p>
    </div>
  );
}
