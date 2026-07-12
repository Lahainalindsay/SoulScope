"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BetaFeedbackForm from "../../components/BetaFeedbackForm";
import DeveloperAnalysisDebug from "../../components/DeveloperAnalysisDebug";
import ResonanceResultsDashboard from "../../components/ResonanceResultsDashboard";
import { supabase } from "../../lib/supabaseClient";
import { buildSoulScopeReport, type SoulScopeReport } from "../../lib/buildSoulScopeReport";
import {
  computeNarrativePreference,
  isValidBaselineScan,
  type NarrativePreference,
} from "../../lib/patternPersonalization";
import { getUserNarrativePreference, persistCanonicalReport, saveFavoriteStory } from "../../lib/reportPersistence";
import { type UserResultDomain } from "../../lib/systemDimensions";
import { type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import styles from "./ResultDetail.module.css";

type ScanResult = VoiceAnalysisResult;
type ScanRow = { id?: string; user_id?: string; created_at?: string; result: ScanResult };

const CLOUD_REQUEST_TIMEOUT_MS = 6000;
const STORY_PREFERENCE_PREFIX = "soulscope.results.storyPreference:";

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string) {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (reason) => { window.clearTimeout(timer); reject(reason); },
    );
  });
}

export default function ResultDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [scanRow, setScanRow] = useState<ScanRow | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [historicalDomains, setHistoricalDomains] = useState<UserResultDomain[][]>([]);
  const [narrativePreference, setNarrativePreference] = useState<NarrativePreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoryStyle, setSelectedStoryStyle] = useState<SoulScopeReport["storyCandidates"][number]["style"] | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await withTimeout(
          supabase.from("scans").select("id, user_id, created_at, result").eq("id", id).single<ScanRow>(),
          CLOUD_REQUEST_TIMEOUT_MS,
          "Supabase scan",
        );
        if (fetchError) throw fetchError;
        setScanRow(data ?? null);
        setScan(data?.result ?? null);

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;

        const [historyResponse, preferenceRow] = await Promise.all([
          supabase
            .from("scans")
            .select("id, created_at, result")
            .eq("user_id", userId)
            .neq("id", id)
            .order("created_at", { ascending: false })
            .limit(10),
          getUserNarrativePreference(supabase, userId).catch(() => null),
        ]);

        if (!historyResponse.error) {
          const domains = ((historyResponse.data ?? []) as ScanRow[])
            .map((row) => {
              if (!row.result) return null;
              const historicalReport = buildSoulScopeReport(row.result);
              return isValidBaselineScan(row.result, historicalReport.domainResults)
                ? historicalReport.domainResults
                : null;
            })
            .filter((item): item is UserResultDomain[] => Boolean(item))
            .slice(0, 5);
          setHistoricalDomains(domains);
        }

        if (preferenceRow) {
          setNarrativePreference(computeNarrativePreference(
            {
              Direct: preferenceRow.direct_count,
              Supportive: preferenceRow.supportive_count,
              Insight: preferenceRow.insight_count,
            },
            preferenceRow.last_selected_style,
          ));
        }
      } catch (fetchError) {
        console.error("Failed to load scan", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Could not load this insight.");
        setScanRow(null);
        setScan(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const report = useMemo(
    () => scan ? buildSoulScopeReport(scan, { historicalDomainResults: historicalDomains }) : null,
    [scan, historicalDomains],
  );
  const storyCandidates = useMemo(() => report?.storyCandidates ?? [], [report]);
  const selectedStory = useMemo(
    () => storyCandidates.find((candidate) => candidate.style === selectedStoryStyle) ?? storyCandidates[0] ?? null,
    [storyCandidates, selectedStoryStyle],
  );

  useEffect(() => {
    if (!report || typeof id !== "string") return;
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        await persistCanonicalReport(supabase, { scanId: id, userId: userData.user.id, report });
      } catch (persistError) {
        console.error("Failed to persist canonical report", persistError);
      }
    })();
  }, [id, report]);

  useEffect(() => {
    if (!storyCandidates.length || typeof id !== "string") return;
    try {
      const stored = window.localStorage.getItem(`${STORY_PREFERENCE_PREFIX}${id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as { style?: string };
        const style = storyCandidates.some((candidate) => candidate.style === parsed.style)
          ? parsed.style as SoulScopeReport["storyCandidates"][number]["style"]
          : storyCandidates[0].style;
        setSelectedStoryStyle(style);
      } else {
        setSelectedStoryStyle(storyCandidates[0].style);
      }
    } catch {
      setSelectedStoryStyle(storyCandidates[0].style);
    }
  }, [id, storyCandidates]);

  const handleStorySelect = (style: string) => {
    const selected = storyCandidates.find((candidate) => candidate.style === style);
    if (!selected || typeof id !== "string") return;
    setSelectedStoryStyle(selected.style);
    try { window.localStorage.setItem(`${STORY_PREFERENCE_PREFIX}${id}`, JSON.stringify(selected)); } catch {}
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        await saveFavoriteStory(supabase, {
          scanId: id,
          userId: userData.user.id,
          style: selected.style,
          title: selected.title,
          summary: selected.summary,
        });
        const row = await getUserNarrativePreference(supabase, userData.user.id);
        if (row) {
          setNarrativePreference(computeNarrativePreference(
            { Direct: row.direct_count, Supportive: row.supportive_count, Insight: row.insight_count },
            row.last_selected_style,
          ));
        }
      } catch (persistError) {
        console.error("Failed to persist story preference", persistError);
      }
    })();
  };

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        {loading ? <div className={styles.stateCard}>Opening your reflection...</div> : null}
        {!loading && error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}
        {!loading && !error && !report ? <div className={styles.stateCard}>No reflection found for this scan.</div> : null}
        {!loading && !error && report && scan ? (
          <>
            <ResonanceResultsDashboard
              report={report}
              hiddenNotes={["G"]}
              selectedStoryStyle={selectedStory?.style ?? null}
              narrativePreference={narrativePreference}
              onSelectStory={handleStorySelect}
            />
            <DeveloperAnalysisDebug scanId={scanRow?.id ?? (typeof id === "string" ? id : null)} createdAt={scanRow?.created_at ?? null} scan={scan} report={report} />
            <BetaFeedbackForm page="results" scanId={typeof id === "string" ? id : null} selectedSummaryStyle={selectedStory?.style ?? null} />
            <section className={styles.footerNote}>
              <p>SoulScope uses voice as the first sensing lens and translates observed tendencies into a private current-state pattern insight.</p>
              <p>{scan.caution}</p>
              <div className={styles.footerAction}><Link href="/scan" className={styles.primaryButton}>Start New Scan</Link></div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
