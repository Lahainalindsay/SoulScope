import { useState } from "react";
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

const ACCURACY_OPTIONS = ["Not accurate", "A little accurate", "Mostly accurate", "Very accurate", "Exactly right"];
const LENGTH_OPTIONS = ["Could be shorter", "The length is right", "Could be longer"];
const REJECTION_REASONS = [
  "I just preferred the response I selected",
  "This response did not feel accurate",
  "I did not connect with the language used",
  "It felt too general",
  "It felt too specific",
  "It was too long",
  "It was too short",
];

export default function ResonanceResultsDashboard({
  report,
  onSelectStory,
  selectedStoryStyle = null,
  narrativePreference = null,
}: ResonanceResultsDashboardProps) {
  const orderedCandidates = orderStoryCandidates(report.storyCandidates, narrativePreference);
  const atlas = report.atlas;
  const profile = atlas.result.profile;
  const [accuracy, setAccuracy] = useState("");
  const [lengthPreference, setLengthPreference] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string[]>>({});

  const toggleReason = (style: string, reason: string) => {
    setRejectionReasons((current) => {
      const selected = current[style] ?? [];
      return {
        ...current,
        [style]: selected.includes(reason)
          ? selected.filter((item) => item !== reason)
          : [...selected, reason],
      };
    });
  };

  return (
    <section className={styles.section}>
      <section className={styles.patternCopy}>
        <h1 className={styles.patternName}>{profile.name}</h1>
        <p className={styles.patternTheme}>{profile.theme}</p>
      </section>

      <section className={styles.notesSection} aria-labelledby="beta-reflection-heading">
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Prelaunch reflection test</p>
          <h2 id="beta-reflection-heading">Help us make SoulScope as clear and useful as possible.</h2>
          <p>SoulScope is testing three different ways of interpreting and presenting your result. Choose the response that describes your pattern most accurately.</p>
        </div>

        <div className={styles.topNotesGrid}>
          {orderedCandidates.map((candidate) => {
            const isSelected = candidate.style === selectedStoryStyle;
            return (
              <article key={candidate.style} className={styles.noteCard}>
                <div className={styles.noteTop}>
                  <p className={styles.noteStatus}>{candidate.style}</p>
                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => onSelectStory?.(candidate.style)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? "My preferred response" : "Choose this response"}
                  </button>
                </div>
                <h3>{candidate.title}</h3>
                <p>{candidate.summary}</p>
              </article>
            );
          })}
        </div>

        {selectedStoryStyle ? (
          <div className={styles.technicalGrid}>
            <fieldset className={styles.noteCard}>
              <legend>How accurate is the response you selected?</legend>
              {ACCURACY_OPTIONS.map((option) => (
                <label key={option}>
                  <input type="radio" name="accuracy" value={option} checked={accuracy === option} onChange={() => setAccuracy(option)} /> {option}
                </label>
              ))}
            </fieldset>

            <fieldset className={styles.noteCard}>
              <legend>How does the response length feel?</legend>
              {LENGTH_OPTIONS.map((option) => (
                <label key={option}>
                  <input type="radio" name="length" value={option} checked={lengthPreference === option} onChange={() => setLengthPreference(option)} /> {option}
                </label>
              ))}
            </fieldset>

            {orderedCandidates.filter((candidate) => candidate.style !== selectedStoryStyle).map((candidate) => (
              <fieldset key={candidate.style} className={styles.noteCard}>
                <legend>Why didn’t you prefer the {candidate.style} response?</legend>
                <p className={styles.noteStatus}>Select as many as apply.</p>
                {REJECTION_REASONS.map((reason) => (
                  <label key={reason}>
                    <input
                      type="checkbox"
                      checked={(rejectionReasons[candidate.style] ?? []).includes(reason)}
                      onChange={() => toggleReason(candidate.style, reason)}
                    /> {reason}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.signatureHero} aria-label="Your Resonance Signature">
        <div className={styles.signatureFrame}>
          <ResonanceSignature
            data={atlas.signature.data}
            visualState={atlas.signature.visualState}
            label={`Resonance Signature for ${profile.name}`}
          />
        </div>
      </section>

      <p className={styles.reflection}>{report.presentation.summary}</p>

      <HumanReflectionOverview report={report} />

      <details className={styles.technicalDetails}>
        <summary>Supporting signals and technical details</summary>
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
            <h3>Domain signals</h3>
            <ul>{report.domainResults.map((domain) => <li key={domain.title}>{domain.title}: {domain.functionalState}</li>)}</ul>
          </article>
        </div>
      </details>
    </section>
  );
}