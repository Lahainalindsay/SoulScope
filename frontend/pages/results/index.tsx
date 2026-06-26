"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ResonanceResultsDashboard from "../../components/ResonanceResultsDashboard";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { LOCAL_SCAN_KEY } from "../../lib/localSession";
import { buildSoulScopeReport, type SoulScopeReport } from "../../lib/buildSoulScopeReport";
import { persistCanonicalReport } from "../../lib/reportPersistence";
import { saveFavoriteStory } from "../../lib/reportPersistence";
import { type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import styles from "./ResultsIndex.module.css";

type ScanResult = VoiceAnalysisResult & {
  id?: string;
  face?: {
    emotion: string;
    focusScore: number;
  };
  chakraScores?: Record<string, number>;
  dominant?: string;
};

const supabase = createClientComponentClient();
const CLOUD_REQUEST_TIMEOUT_MS = 4500;
const STORY_PREFERENCE_KEY = "soulscope.results.storyPreference.latest";

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

export default function ResultsPage() {
  const [latest, setLatest] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoryStyle, setSelectedStoryStyle] = useState<SoulScopeReport["storyCandidates"][number]["style"] | null>(null);

  useEffect(() => {
    const loadLocalLatest = () => {
      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_KEY);
        return raw ? (JSON.parse(raw) as ScanResult) : null;
      } catch (localError) {
        console.error("Failed to load local latest scan", localError);
        return null;
      }
    };

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          CLOUD_REQUEST_TIMEOUT_MS,
          "Supabase auth"
        );

        if (userError || !userData?.user) {
          const localLatest = loadLocalLatest();
          if (localLatest) {
            setLatest(localLatest);
            return;
          }
          setError(userError?.message ?? "Please sign in to view your cloud-saved results.");
          return;
        }

        const { data, error: scanError } = await withTimeout(
          supabase
            .from("scans")
            .select("id, result")
            .eq("user_id", userData.user.id)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
          CLOUD_REQUEST_TIMEOUT_MS,
          "Supabase latest scan"
        );

        if (scanError) {
          console.error("Error fetching scan from Supabase", scanError);
          const localLatest = loadLocalLatest();
          if (localLatest) {
            setLatest(localLatest);
            return;
          }
          setError(scanError.message || "Could not load your latest Insights.");
          return;
        }

        if (!data) {
          setLatest(loadLocalLatest());
          return;
        }

        setLatest({ id: data.id, ...(data.result as VoiceAnalysisResult) });
      } catch (err) {
        console.error("Fatal error loading results", err);
        const localLatest = loadLocalLatest();
        if (localLatest) {
          setLatest(localLatest);
          return;
        }
        setError(err instanceof Error ? err.message : "Something went wrong loading your results.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const report = useMemo(() => (latest ? buildSoulScopeReport(latest) : null), [latest]);
  const storyCandidates = report?.storyCandidates ?? [];
  const selectedStory = useMemo(
    () => storyCandidates.find((candidate) => candidate.style === selectedStoryStyle) ?? storyCandidates[0] ?? null,
    [storyCandidates, selectedStoryStyle]
  );

  useEffect(() => {
    if (!report || !latest?.id) return;

    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        await persistCanonicalReport(supabase, {
          scanId: latest.id as string,
          userId: userData.user.id,
          report,
        });
      } catch (persistError) {
        console.error("Failed to backfill canonical resonance report", persistError);
      }
    })();
  }, [latest?.id, report]);

  useEffect(() => {
    if (!storyCandidates.length) return;

    try {
      const stored = window.localStorage.getItem(STORY_PREFERENCE_KEY);
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
  }, [storyCandidates]);

  const handleStorySelect = (style: string) => {
    const selected = storyCandidates.find((candidate) => candidate.style === style);
    setSelectedStoryStyle(style as SoulScopeReport["storyCandidates"][number]["style"]);
    try {
      if (selected) {
        window.localStorage.setItem(STORY_PREFERENCE_KEY, JSON.stringify(selected));
      }
    } catch {
      // ignore storage failures
    }

    if (!selected || !latest?.id) return;
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        await saveFavoriteStory(supabase, {
          scanId: latest.id as string,
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
        {loading ? <div className={styles.stateCard}>Loading your latest insights...</div> : null}
        {!loading && error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}
        {!loading && !error && !report ? (
          <div className={styles.stateCard}>
            No insights found. Complete a new Resonance Scan to generate a Resonance Report.
          </div>
        ) : null}

        {!loading && !error && report ? (
          <>
            <ResonanceResultsDashboard
              report={report}
              hiddenNotes={["G"]}
              selectedStoryStyle={selectedStory?.style ?? null}
              onSelectStory={handleStorySelect}
            />

            <section className={styles.footerNote}>
              <p>
                SoulScope uses voice as the sensing mechanism and translates observed tendencies into a
                whole-self Resonance Report.
              </p>
              <p>{latest?.caution}</p>
              <div className={styles.footerAction}>
                <Link href="/scan" className={styles.primaryButton}>
                  Run New Resonance Scan
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
