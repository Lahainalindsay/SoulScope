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
        <li>Sustained vowel to pitch stability, texture, and support markers.</li>
        <li>Guided speech to pauses, cadence, expression, cognitive load, and directional change.</li>
        <li>Reactivity signals to baseline, challenge, and recovery comparison.</li>
      </ul>
      <p className="panel__description">
        After the guided capture, SoulScope translates the available patterns into a personal insight.
      </p>
    </div>
  );
}
