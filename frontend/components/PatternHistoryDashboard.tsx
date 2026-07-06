"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { getLocalDevSession, LOCAL_SCAN_LIST_KEY } from "../lib/localSession";
import { getSoulScopeNoteColor } from "../lib/noteSystem";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "../lib/voiceSpectrum";
import NoteAuraMap from "./NoteAuraMap";
import styles from "../pages/History.module.css";

type ScanRow = {
  id?: string;
  created_at: string;
  result: VoiceAnalysisResult & {
    dominantBandLabel?: string;
    noteInterpretation?: { primaryNote?: string };
    noteEnergies?: NoteEnergyResult[];
  };
};

type StoryPreferenceRow = {
  scan_id: string;
  selected_style: "Direct" | "Supportive" | "Insight";
  selected_title: string;
  selected_summary: string;
};

type HistoryEntry = {
  scan: ScanRow;
  report: ReturnType<typeof buildSoulScopeReport>;
  selectedStyle: StoryPreferenceRow["selected_style"] | null;
  selectedSummary: string;
};

function preferenceKey(scan: ScanRow) {
  return scan.id ?? scan.created_at;
}

function getSelectedVariant(report: ReturnType<typeof buildSoulScopeReport>, selectedStyle: HistoryEntry["selectedStyle"]) {
  if (selectedStyle) return report.storyCandidates.find((candidate) => candidate.style === selectedStyle) ?? report.storyCandidates[0] ?? null;
  return report.storyCandidates[0] ?? null;
}

function buildDashboardFocus(entry: HistoryEntry | null) {
  const domains = entry?.report.domainResults ?? [];
  const support = domains.filter((domain) => ["Asking for Support", "Less Accessible", "Recovering"].includes(domain.functionalState)).sort((a, b) => a.score - b.score)[0];
  const working = domains.filter((domain) => ["Working Hard", "Under Pressure"].includes(domain.functionalState)).sort((a, b) => b.score - a.score)[0];
  if (support && working) return "Protect what needs restoration while reducing one area that is carrying extra effort.";
  if (support) return "Give extra attention to the quieter part of you and let it rebuild without pressure.";
  if (working) return "Notice where you are working hard and reduce one unnecessary demand.";
  return "Keep the rhythm that is already helping you feel steady.";
}

function buildLatestHiddenPattern(entry: HistoryEntry | null) {
  const id = entry?.report.primaryPattern.id;
  if (id === "guarded-but-responsive") return "You may be staying present while part of you is checking whether it is safe to soften.";
  if (id === "overextended-achiever") return "Capability is online, but recovery may be lagging behind output.";
  if (id === "deep-processor") return "Your mind may be doing extra organizing before the rest of you can settle.";
  if (id === "recovering-adapter") return "You may be rebuilding capacity while still responding to current demands.";
  if (id === "quietly-overloaded") return "The surface may look functional while the background load is heavier than it appears.";
  if (id === "balanced-regulator") return "The useful pattern is steadiness; protect the rhythm that is already working.";
  return "Your latest scan will reveal the deeper pattern underneath the surface story.";
}

function buildJourneyInsight(entries: HistoryEntry[]) {
  if (!entries.length) return "Your resonance journey begins with your first saved scan.";
  if (entries.length === 1) return "You have one saved reflection so far. Your next scan will begin showing what changes over time.";
  const latest = entries[0].report.primaryPattern.name;
  const previous = entries[1].report.primaryPattern.name;
  if (latest === previous) return `${latest} is repeating across your latest scans.`;
  return `Your latest pattern shifted from ${previous} into ${latest}.`;
}

function softDomainName(title: string) {
  if (title === "Recovery & Restoration") return "Recovery";
  if (title === "Communication & Clarity") return "Communication";
  if (title === "Connection & Support") return "Connection";
  if (title === "Focus & Mental Load") return "Mental load";
  if (title === "Emotional Expression") return "Emotional expression";
  if (title === "Energy & Vitality") return "Energy";
  if (title === "Direction & Adaptability") return "Adaptability";
  return title;
}

function buildMovement(entries: HistoryEntry[]) {
  if (entries.length < 2) return [];
  const latest = entries[0].report.domainResults ?? [];
  const previous = new Map((entries[1].report.domainResults ?? []).map((domain) => [domain.title, domain.score]));
  return latest
    .map((domain) => {
      const before = previous.get(domain.title);
      if (typeof before !== "number") return null;
      const delta = domain.score - before;
      const amount = Math.abs(delta);
      const direction = amount < 4 ? "Steady" : delta > 0 ? "Rising" : "Softening";
      return { title: softDomainName(domain.title), direction, amount };
    })
    .filter((item): item is { title: string; direction: string; amount: number } => Boolean(item))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
}

export default function PatternHistoryDashboard() {
  const session = useSession();
  const { isLoading: sessionLoading } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [preferences, setPreferences] = useState<Record<string, StoryPreferenceRow>>({});

  useEffect(() => {
    const loadLocal = () => {
      const localSession = getLocalDevSession();
      if (!localSession) {
        setError("Please sign in to view your resonance journey.");
        setLoading(false);
        return;
      }
      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        setScans(raw ? (JSON.parse(raw) as ScanRow[]) : []);
        setPreferences({});
        setError(null);
      } catch {
        setError("Could not load your resonance journey.");
      } finally {
        setLoading(false);
      }
    };

    const load = async () => {
      if (!session?.user) {
        loadLocal();
        return;
      }
      const { data, error: fetchError } = await supabase.from("scans").select("id, created_at, result").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(24);
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      const nextScans = (data ?? []) as ScanRow[];
      setScans(nextScans);
      const scanIds = nextScans.map((scan) => scan.id).filter((id): id is string => typeof id === "string" && id.length > 0);
      if (scanIds.length) {
        const { data: preferenceData } = await supabase.from("scan_story_preferences").select("scan_id, selected_style, selected_title, selected_summary").eq("user_id", session.user.id).in("scan_id", scanIds);
        setPreferences((preferenceData ?? []).reduce<Record<string, StoryPreferenceRow>>((acc, row) => {
          acc[row.scan_id] = row as StoryPreferenceRow;
          return acc;
        }, {}));
      }
      setError(null);
      setLoading(false);
    };
    if (!sessionLoading) void load();
  }, [session, sessionLoading]);

  const historyEntries = useMemo<HistoryEntry[]>(() => scans.map((scan) => {
    const report = buildSoulScopeReport(scan.result);
    const preference = preferences[preferenceKey(scan)] ?? null;
    const selectedVariant = getSelectedVariant(report, preference?.selected_style ?? null);
    return {
      scan,
      report,
      selectedStyle: preference?.selected_style ?? selectedVariant?.style ?? null,
      selectedSummary: preference?.selected_summary ?? selectedVariant?.summary ?? report.primaryPattern.explanation,
    };
  }), [preferences, scans]);

  const latestEntry = historyEntries[0] ?? null;
  const visibleEnergies = (latestEntry?.scan.result.noteEnergies ?? []).filter((entry) => entry.note !== "G");
  const movement = useMemo(() => buildMovement(historyEntries), [historyEntries]);

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        <section className={styles.newScanSection}>
          <p className={styles.eyebrow}>Your Resonance Journey</p>
          <h1 className={styles.newScanTitle}>Welcome back.</h1>
          <p className={styles.newScanLead}>This is your living record of how your voice patterns shift over time.</p>
          <div className={styles.newScanActions}>
            <Link href="/scan" className={styles.primaryButton}>Start New Scan</Link>
            {latestEntry?.scan.id ? <Link href={`/results/${latestEntry.scan.id}`} className={styles.secondaryButton}>View Latest Report</Link> : null}
          </div>
        </section>

        {loading ? <div className={styles.stateCard}>Loading your resonance journey...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latestEntry ? (
          <>
            <section className={styles.historyLatestSection}>
              <article className={styles.historyLatestCard}>
                <p className={styles.sectionEyebrow}>Current Story</p>
                <h2 className={styles.historyLatestTitle}>{latestEntry.report.primaryPattern.name}</h2>
                <p className={styles.historyLatestTheme}>{latestEntry.report.primaryPattern.theme}</p>
                <p className={styles.historyLatestText}>{latestEntry.selectedSummary}</p>
              </article>
              <div className={styles.historyLatestMapContainer}>
                <NoteAuraMap noteEnergies={visibleEnergies} title="Current Resonance Map" />
              </div>
            </section>

            <section className={styles.trendInsightGrid}>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>Latest Hidden Pattern</p>
                <h3 className={styles.insightTitle}>Under the surface</h3>
                <p className={styles.insightText}>{buildLatestHiddenPattern(latestEntry)}</p>
              </article>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>Journey Note</p>
                <h3 className={styles.insightTitle}>What is shifting</h3>
                <p className={styles.insightText}>{buildJourneyInsight(historyEntries)}</p>
              </article>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>This Week&rsquo;s Focus</p>
                <h3 className={styles.insightTitle}>Balance point</h3>
                <p className={styles.insightText}>{buildDashboardFocus(latestEntry)}</p>
              </article>
            </section>

            {movement.length ? (
              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>Movement Since Last Scan</p>
                    <h2 className={styles.chartTitle}>What changed most.</h2>
                    <p className={styles.chartLead}>No spaghetti graph. Just the clearest shifts from your previous scan.</p>
                  </div>
                </div>
                <div className={styles.trendInsightGrid}>
                  {movement.map((item) => (
                    <article key={item.title} className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>{item.direction}</p>
                      <h3 className={styles.insightTitle}>{item.title}</h3>
                      <p className={styles.insightText}>{Math.round(item.amount)} point shift from last scan.</p>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            <section className={styles.historySection}>
              <div className={styles.historyHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Resonance Journal</p>
                  <h2 className={styles.historyTitle}>Your previous reflections</h2>
                </div>
              </div>
              <div className={styles.historyList}>
                {historyEntries.map((entry) => {
                  const supportingNote = entry.scan.result.noteInterpretation?.primaryNote ?? entry.scan.result.dominantBandLabel ?? "—";
                  return (
                    <article key={entry.scan.id ?? entry.scan.created_at} className={styles.historyCard}>
                      <div className={styles.historyMain}>
                        <h3 className={styles.historyBand}>{entry.report.primaryPattern.name}</h3>
                        <p className={styles.historySummary}>{entry.selectedSummary}</p>
                        <div className={styles.historyPills}>
                          <span className={styles.historyPill} style={{ borderColor: `${getSoulScopeNoteColor(supportingNote)}44`, color: getSoulScopeNoteColor(supportingNote), background: `${getSoulScopeNoteColor(supportingNote)}12` }}>Marker {supportingNote}</span>
                          <span className={styles.historyPill}>{entry.selectedStyle ?? "Direct"}</span>
                        </div>
                        <div className={styles.historyDate}>{new Date(entry.scan.created_at).toLocaleString()}</div>
                      </div>
                      <Link href={entry.scan.id ? `/results/${entry.scan.id}` : "/dashboard"} className={styles.secondaryButton}>Read Reflection</Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latestEntry ? <div className={styles.stateCard}>No scans saved yet. Start a Resonance Scan to begin your Resonance Journey.</div> : null}
      </main>
    </div>
  );
}
