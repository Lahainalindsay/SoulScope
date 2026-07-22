"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BetaFeedbackForm from "../../components/BetaFeedbackForm";
import DeveloperAnalysisDebug from "../../components/DeveloperAnalysisDebug";
import ResonanceResultsDashboard from "../../components/ResonanceResultsDashboard";
import { supabase } from "../../lib/supabaseClient";
import { type SoulScopeReport } from "../../lib/buildSoulScopeReport";
import { computeNarrativePreference, type NarrativePreference } from "../../lib/patternPersonalization";
import { type ScanWithCompleteness } from "../../lib/partialScan";
import { getScanResultViewModel, type ScanResultViewModel } from "../../lib/data/v2/getScanResultViewModel";
import { setScanReflectionPreference } from "../../lib/data/v2/preferenceRepository";
import { toReflectionStyle } from "../../lib/data/v2/mappers/mapReflectionVariants";
import styles from "./ResultDetail.module.css";

const STORY_PREFERENCE_PREFIX = "soulscope.results.storyPreference:";

type DisplayStyle = SoulScopeReport["storyCandidates"][number]["style"];

function displayStyle(style: string | null | undefined): DisplayStyle | null {
  if (style === "direct") return "Direct";
  if (style === "supportive") return "Supportive";
  if (style === "insight") return "Insight";
  return null;
}

function preferenceFromViewModel(viewModel: ScanResultViewModel): NarrativePreference | null {
  const row = viewModel.narrativePreference;
  if (!row) return null;
  return computeNarrativePreference(
    { Direct: row.direct_count, Supportive: row.supportive_count, Insight: row.insight_count },
    displayStyle(row.last_selected_style),
  );
}

export default function ResultDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const requestSequence = useRef(0);
  const [viewModel, setViewModel] = useState<ScanResultViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoryStyle, setSelectedStoryStyle] = useState<DisplayStyle | null>(null);
  const [narrativePreference, setNarrativePreference] = useState<NarrativePreference | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const requestedScanId = id;
    const sequence = ++requestSequence.current;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setViewModel(null);
    setSelectedStoryStyle(null);
    setNarrativePreference(null);

    const load = async () => {
      try {
        const next = await getScanResultViewModel(supabase, requestedScanId, false);
        if (cancelled || sequence !== requestSequence.current) return;

        if (next && next.session.id !== requestedScanId) {
          throw new Error("The requested scan could not be matched to its saved reflection.");
        }

        setViewModel(next);
        if (next) {
          setNarrativePreference(preferenceFromViewModel(next));
          setSelectedStoryStyle(displayStyle(next.selectedPreference?.selected_style));
        }
      } catch (fetchError) {
        if (cancelled || sequence !== requestSequence.current) return;
        console.error("Failed to load V2 scan result", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Could not load this Reflection.");
        setViewModel(null);
      } finally {
        if (!cancelled && sequence === requestSequence.current) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const report = viewModel?.report ?? null;
  const scan = viewModel?.scan ?? null;
  const storyCandidates = useMemo(() => report?.storyCandidates ?? [], [report]);
  const selectedStory = useMemo(
    () => storyCandidates.find((candidate) => candidate.style === selectedStoryStyle) ?? storyCandidates[0] ?? null,
    [storyCandidates, selectedStoryStyle],
  );

  useEffect(() => {
    if (!storyCandidates.length || typeof id !== "string") return;
    if (selectedStoryStyle && storyCandidates.some((candidate) => candidate.style === selectedStoryStyle)) return;
    try {
      const stored = window.localStorage.getItem(`${STORY_PREFERENCE_PREFIX}${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as { style?: string };
        const storedStyle = storyCandidates.some((candidate) => candidate.style === parsed.style)
          ? parsed.style as DisplayStyle
          : null;
        setSelectedStoryStyle(storedStyle ?? storyCandidates[0].style);
      } else {
        setSelectedStoryStyle(storyCandidates[0].style);
      }
    } catch {
      setSelectedStoryStyle(storyCandidates[0].style);
    }
  }, [id, selectedStoryStyle, storyCandidates]);

  const handleStorySelect = (style: string) => {
    const selected = storyCandidates.find((candidate) => candidate.style === style);
    if (!selected || typeof id !== "string") return;
    const selectedScanId = id;
    setSelectedStoryStyle(selected.style);
    try {
      window.localStorage.setItem(`${STORY_PREFERENCE_PREFIX}${selectedScanId}`, JSON.stringify(selected));
    } catch {}
    void (async () => {
      try {
        const aggregate = await setScanReflectionPreference(supabase, selectedScanId, toReflectionStyle(selected.style));
        if (router.query.id !== selectedScanId) return;
        setNarrativePreference(computeNarrativePreference(
          { Direct: aggregate.direct_count, Supportive: aggregate.supportive_count, Insight: aggregate.insight_count },
          displayStyle(aggregate.last_selected_style),
        ));
      } catch (persistError) {
        console.error("Failed to persist V2 reflection preference", persistError);
      }
    })();
  };

  const completeness = report?.scanCompleteness;
  const scanRow = viewModel?.session ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        {loading ? <div className={styles.stateCard}>Opening your reflection...</div> : null}
        {!loading && error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}
        {!loading && !error && !report ? <div className={styles.stateCard}>No reflection found for this scan.</div> : null}
        {!loading && !error && report && scan ? (
          <>
            {completeness && completeness.invalidRecordings > 0 ? (
              <section className={styles.footerNote}>
                <h2>{completeness.validRecordings === 3 ? "A limited reflection is available" : "Your reflection is ready"}</h2>
                <p>{completeness.userMessage}</p>
                <p><strong>For a more complete reading</strong></p>
                <p>One or more recordings did not contain enough clear voice data. You can keep this result or repeat the scan when you&apos;re ready.</p>
                <div className={styles.footerAction}>
                  <Link href="/scan" className={styles.secondaryButton}>{completeness.validRecordings === 3 ? "Repeat Scan" : "Try for a Clearer Scan"}</Link>
                </div>
              </section>
            ) : null}
            <ResonanceResultsDashboard
              key={scanRow?.id ?? (typeof id === "string" ? id : "unknown-scan")}
              report={report}
              hiddenNotes={["G"]}
              selectedStoryStyle={selectedStory?.style ?? null}
              narrativePreference={narrativePreference}
              onSelectStory={handleStorySelect}
            />
            <DeveloperAnalysisDebug
              key={`debug-${scanRow?.id ?? (typeof id === "string" ? id : "unknown-scan")}`}
              scanId={scanRow?.id ?? (typeof id === "string" ? id : null)}
              createdAt={scanRow?.created_at ?? null}
              scan={scan as ScanWithCompleteness}
              report={report}
            />
            <BetaFeedbackForm
              key={`feedback-${scanRow?.id ?? (typeof id === "string" ? id : "unknown-scan")}`}
              page="results"
              scanId={typeof id === "string" ? id : null}
              selectedSummaryStyle={selectedStory?.style ?? null}
            />
            <section className={styles.footerNote}>
              <p>SoulScope organizes observed patterns into a private Resonance Signature and Reflection for this moment.</p>
              <p>{scan.caution}</p>
              <div className={styles.footerAction}>
                <Link href="/history" className={styles.primaryButton}>View My History</Link>
                <Link href="/scan" className={styles.secondaryButton}>Start New Scan</Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
