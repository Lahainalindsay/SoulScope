"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BetaFeedbackForm from "../../components/BetaFeedbackForm";
import ResonanceResultsDashboard from "../../components/ResonanceResultsDashboard";
import { supabase } from "../../lib/supabaseClient";
import { buildSoulScopeReport, type SoulScopeReport } from "../../lib/buildSoulScopeReport";
import { persistCanonicalReport } from "../../lib/reportPersistence";
import { saveFavoriteStory } from "../../lib/reportPersistence";
import { type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import styles from "./ResultDetail.module.css";

type ScanResult = VoiceAnalysisResult & {
  face?: {
    emotion: string;
    focusScore: number;
  };
  chakraScores?: Record<string, number>;
  dominant?: string;
};

type ScanRow = {
  result: ScanResult;
};

const CLOUD_REQUEST_TIMEOUT_MS = 4500;
const STORY_PREFERENCE_PREFIX = "soulscope.results.storyPreference:";

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string) {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      }
    );
  });
}

export default function ResultDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoryStyle, setSelectedStoryStyle] = useState<SoulScopeReport["storyCandidates"][number]["style"] | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchScan = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await withTimeout(
          supabase.from("scans").select("result").eq("id", id).single<ScanRow>(),
          CLOUD_REQUEST_TIMEOUT_MS,
          "Supabase scan"
        );

        if (fetchError) {
          setError(fetchError.message);
          setScan(null);
        } else {
          setScan(data?.result ?? null);
        }
      } catch (fetchError) {
        console.error("Failed to fetch scan from Supabase", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Could not load this Resonance Report.");
        setScan(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchScan();
  }, [id]);

  const report = useMemo(() => (scan ? buildSoulScopeReport(scan) : null), [scan]);
  const storyCandidates = useMemo(() => report?.storyCandidates ?? [], [report]);
  const selectedStory = useMemo(
    () => storyCandidates.find((candidate) => candidate.style === selectedStoryStyle) ?? storyCandidates[0] ?? null,
    [storyCandidates, selectedStoryStyle]
  );

  useEffect(() => {
    if (!report || typeof id !== "string") return;

    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        await persistCanonicalReport(supabase, {
          scanId: id,
          userId: userData.user.id,
          report,
        });
      } catch (persistError) {
        console.error("Failed to backfill canonical resonance report", persistError);
      }
    })();
  }, [id, report]);

  useEffect(() => {
    if (!storyCandidates.length || typeof id !== "string") return;

    const storageKey = `${STORY_PREFERENCE_PREFIX}${id}`;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { style?: string; title?: string } | null;
        const nextStyle =
          parsed?.style && storyCandidates.some((candidate) => candidate.style === parsed.style)
            ? (parsed.style as SoulScopeReport["storyCandidates"][number]["style"])
            : parsed?.title && storyCandidates.some((candidate) => candidate.title === parsed.title)
            ? ((storyCandidates.find((candidate) => candidate.title === parsed.title)?.style ??
                storyCandidates[0].style) as SoulScopeReport["storyCandidates"][number]["style"])
            : storyCandidates[0].style;
        setSelectedStoryStyle(nextStyle);
        return;
      }
      setSelectedStoryStyle(storyCandidates[0].style);
    } catch {
      setSelectedStoryStyle(storyCandidates[0].style);
    }
  }, [id, storyCandidates]);

  const handleStorySelect = (style: string) => {
    const selected = storyCandidates.find((candidate) => candidate.style === style);
    setSelectedStoryStyle(style as SoulScopeReport["storyCandidates"][number]["style"]);
    if (typeof id !== "string") return;
    try {
      if (selected) {
        window.localStorage.setItem(`${STORY_PREFERENCE_PREFIX}${id}`, JSON.stringify(selected));
      }
    } catch {
      // ignore storage failures
    }

    if (!selected) return;
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        await saveFavoriteStory(supabase, {
          scanId: id,
          userId: userData.user.id,
          style: selected.style,
          title: selected.title,
          summary: selected.summary,
        });
      } catch (persistError) {
        console.error("Failed to persist story preference", persistError);
      }
    })();
  };

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        {loading ? <div className={styles.stateCard}>Retrieving your latest insight...</div> : null}
        {!loading && error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}
        {!loading && !error && !report ? (
          <div className={styles.stateCard}>No pattern report found for this scan.</div>
        ) : null}

        {!loading && !error && report ? (
          <>
            <ResonanceResultsDashboard
              report={report}
              hiddenNotes={["G"]}
              selectedStoryStyle={selectedStory?.style ?? null}
              onSelectStory={handleStorySelect}
            />

            <BetaFeedbackForm
              page="results"
              scanId={typeof id === "string" ? id : null}
              selectedSummaryStyle={selectedStory?.style ?? null}
            />

            <section className={styles.footerNote}>
              <p>
                SoulScope uses voice as the sensing mechanism and translates observed tendencies into a
                private human pattern interpretation system.
              </p>
              <p>{scan?.caution}</p>
              <div className={styles.footerAction}>
                <Link href="/scan" className={styles.primaryButton}>
                  Start New Scan
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
