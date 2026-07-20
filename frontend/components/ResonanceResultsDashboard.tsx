import HumanReflectionOverview from "./HumanReflectionOverview";
import ResonanceSignature from "./ResonanceSignature";
import { ATLAS_EVIDENCE, ATLAS_SUBPATTERNS } from "../lib/patternAtlas";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { orderStoryCandidates, type NarrativePreference } from "../lib/patternPersonalization";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
  narrativePreference?: NarrativePreference | null;
  displayName?: string | null;
};

export default function ResonanceResultsDashboard({
  report,
  onSelectStory,
  selectedStoryStyle = null,
  narrativePreference = null,
  displayName = null,
}: ResonanceResultsDashboardProps) {
  const orderedCandidates = orderStoryCandidates(report.storyCandidates, narrativePreference);
  const atlas = report.atlas;
  const profile = atlas.result.profile;
  const confidence = Math.round(Math.max(0, Math.min(1, atlas.result.score ?? 0)) * 100);
  const supporting = atlas.result.supporting[0];
  const emerging = atlas.result.supporting[1];

  return (
    <section className={styles.section}>
      <header className={styles.greeting}>
        <p className={styles.eyebrow}>Your current state</p>
        <h1>{displayName ? `Welcome back, ${displayName}` : "Your Resonance Signature"}</h1>
      </header>

      <section className={styles.signatureHero}>
        <div className={styles.signatureFrame}>
          <ResonanceSignature
            data={atlas.signature.data}
            visualState={atlas.signature.visualState}
            label={`Resonance Signature for ${profile.name}`}
          />
        </div>
        <div className={styles.patternCopy}>
          <p className={styles.eyebrow}>Current Pattern</p>
          <h2 className={styles.patternName}>{profile.name}</h2>
          <p className={styles.patternTheme}>{profile.theme}</p>
          <p className={styles.reflection}>{report.presentation.summary}</p>
          <div className={styles.confidenceRow}>
            <span>Interpretation confidence</span>
            <strong>{confidence}%</strong>
          </div>
          <div className={styles.confidenceTrack} aria-hidden="true">
            <span style={{ width: `${confidence}%` }} />
          </div>
        </div>
      </section>

      <HumanReflectionOverview report={report} />

      {(supporting || emerging) ? (
        <section className={styles.patternStrip} aria-label="Additional pattern context">
          {supporting ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Also present</p>
              <h3>{supporting.profile.name}</h3>
              <p>{supporting.profile.theme}</p>
            </article>
          ) : null}
          {emerging ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Secondary possibility</p>
              <h3>{emerging.profile.name}</h3>
              <p>{emerging.profile.theme}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Reflection style</p>
          <h2>Choose what reads clearest</h2>
          <p>Each version reflects the same deterministic atlas interpretation.</p>
        </div>
        <div className={styles.topNotesGrid}>
          {orderedCandidates.map((candidate) => {
            const isSelected = candidate.style === selectedStoryStyle;
            const usuallyPreferred = narrativePreference?.established && narrativePreference.preferredStyle === candidate.style;
            return (
              <article key={candidate.style} className={styles.noteCard}>
                <div className={styles.noteTop}>
                  <p className={styles.noteStatus}>{candidate.style}{usuallyPreferred ? " · Usually preferred" : ""}</p>
                  <button type="button" className={styles.selectButton} onClick={() => onSelectStory?.(candidate.style)} aria-pressed={isSelected}>{isSelected ? "Selected" : "Select"}</button>
                </div>
                <h3>{candidate.title}</h3>
                <p>{candidate.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <details className={styles.technicalDetails}>
        <summary>Technical details</summary>
        <div className={styles.technicalGrid}>
          <article>
            <h3>Atlas evidence</h3>
            <ul>
              {Object.entries(atlas.input)
                .sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0))
                .slice(0, 6)
                .map(([id, score]) => (
                  <li key={id}>{ATLAS_EVIDENCE[id as keyof typeof ATLAS_EVIDENCE].label}: {Math.round((score ?? 0) * 100)}</li>
                ))}
            </ul>
          </article>
          <article>
            <h3>Leading subpatterns</h3>
            <ul>
              {atlas.result.subpatterns.map(({ id, score }) => (
                <li key={id}>{ATLAS_SUBPATTERNS[id].label}: {Math.round(score * 100)}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Signature geometry</h3>
            <ul>
              <li>Density: {Math.round(atlas.signature.visualState.density * 100)}</li>
              <li>Coherence: {Math.round(atlas.signature.visualState.coherence * 100)}</li>
              <li>Asymmetry: {Math.round(atlas.signature.visualState.asymmetry * 100)}</li>
              <li>Expansion: {Math.round(atlas.signature.visualState.expansion * 100)}</li>
              <li>Center calm: {Math.round(atlas.signature.visualState.centerCalm * 100)}</li>
            </ul>
          </article>
          <article>
            <h3>Domain signals</h3>
            <ul>{report.domainResults.map((domain) => <li key={domain.title}>{domain.title}: {Math.round(domain.score)} · {domain.functionalState}</li>)}</ul>
          </article>
        </div>
      </details>
    </section>
  );
}
