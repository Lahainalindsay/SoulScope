import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import styles from "./Patterns.module.css";

type AccessState = "checking" | "allowed" | "denied";

type BaselinePayload = {
  comparisonAvailable?: boolean;
  identityConfidence?: number;
};

type AlternativePayload = {
  compatibility?: number;
};

type DecisionLedgerPayload = {
  alternatives?: AlternativePayload[];
};

type DiagnosticRow = {
  created_at: string | null;
  pattern_signature: string | null;
  display_name: string | null;
  family: string | null;
  canonical_pattern_signature: string | null;
  canonical_display_name: string | null;
  canonical_family: string | null;
  confidence: number | null;
  baseline: BaselinePayload | null;
  decision_ledger: DecisionLedgerPayload | null;
};

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SOULSCOPE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function countBy(rows: DiagnosticRow[], selector: (row: DiagnosticRow) => string | null | undefined) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = selector(row) || "Unavailable";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function average(values: number[]) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function topEntries(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function nearestAlternative(row: DiagnosticRow) {
  const alternatives = row.decision_ledger?.alternatives ?? [];
  const score = alternatives
    .map((alternative) => alternative.compatibility)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0];
  return score ?? null;
}

export default function AdminPatternsPage() {
  const [access, setAccess] = useState<AccessState>("checking");
  const [rows, setRows] = useState<DiagnosticRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setAccess("checking");
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData?.user?.email?.toLowerCase();

      if (userError || !email || !ADMIN_EMAILS.includes(email)) {
        setAccess("denied");
        return;
      }

      setAccess("allowed");

      const { data, error: diagnosticsError } = await supabase
        .from("scan_interpretation_diagnostics")
        .select("created_at, pattern_signature, display_name, family, canonical_pattern_signature, canonical_display_name, canonical_family, confidence, baseline, decision_ledger")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (diagnosticsError) {
        setError(diagnosticsError.message);
        return;
      }

      setRows((data ?? []) as DiagnosticRow[]);
    };

    void load();
  }, []);

  const summary = useMemo(() => {
    const familyCounts = countBy(rows, (row) => row.canonical_family ?? row.family);
    const nameCounts = countBy(rows, (row) => row.canonical_display_name ?? row.display_name);
    const signatureCounts = countBy(rows, (row) => row.canonical_pattern_signature ?? row.pattern_signature);
    const averageConfidence = average(rows.map((row) => row.confidence ?? Number.NaN));
    const averageNearestAlternative = average(
      rows.map((row) => nearestAlternative(row) ?? Number.NaN)
    );
    const historyEligible = rows.filter((row) => row.baseline?.comparisonAvailable === true).length;
    const topName = topEntries(nameCounts)[0];

    return {
      familyCounts,
      nameCounts,
      signatureCounts,
      averageConfidence,
      averageNearestAlternative,
      historyEligible,
      topName,
    };
  }, [rows]);

  return (
    <>
      <Head>
        <title>Pattern Diagnostics | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <main className={styles.shell}>
          <section className={styles.header}>
            <p className={styles.eyebrow}>Internal</p>
            <h1 className={styles.title}>Pattern diagnostics</h1>
            <p className={styles.lead}>
              Monitor generated Resonance Signature distribution, confidence, and history eligibility.
            </p>
          </section>

          {access === "checking" ? <div className={styles.state}>Checking access...</div> : null}
          {access === "denied" ? <div className={styles.state}>This page is restricted to SoulScope admins.</div> : null}
          {access === "allowed" && error ? <div className={`${styles.state} ${styles.error}`}>{error}</div> : null}

          {access === "allowed" && !error ? (
            <>
              <section className={styles.metricsGrid}>
                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Diagnostics</span>
                  <strong className={styles.metricValue}>{rows.length}</strong>
                  <span className={styles.metricHint}>Latest saved rows</span>
                </article>
                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Avg confidence</span>
                  <strong className={styles.metricValue}>
                    {summary.averageConfidence === null ? "-" : summary.averageConfidence.toFixed(2)}
                  </strong>
                  <span className={styles.metricHint}>Dynamic pattern confidence</span>
                </article>
                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>History eligible</span>
                  <strong className={styles.metricValue}>{percent(summary.historyEligible, rows.length)}</strong>
                  <span className={styles.metricHint}>Subject-confirmed comparisons</span>
                </article>
                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Top display name</span>
                  <strong className={styles.metricValue}>{summary.topName?.[1] ?? 0}</strong>
                  <span className={styles.metricHint}>{summary.topName?.[0] ?? "No rows yet"}</span>
                </article>
              </section>

              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Families</h2>
                <div className={styles.countGrid}>
                  {topEntries(summary.familyCounts).map(([family, count]) => (
                    <article key={family} className={styles.countItem}>
                      <span className={styles.countName}>{family}</span>
                      <span className={styles.countMeta}>
                        <span>{count} scans</span>
                        <span>{percent(count, rows.length)}</span>
                      </span>
                    </article>
                  ))}
                  {!rows.length ? <p className={styles.empty}>No diagnostics have been saved yet.</p> : null}
                </div>
              </section>

              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Generated Names</h2>
                <div className={styles.countGrid}>
                  {topEntries(summary.nameCounts).slice(0, 12).map(([name, count]) => (
                    <article key={name} className={styles.countItem}>
                      <span className={styles.countName}>{name}</span>
                      <span className={styles.countMeta}>
                        <span>{count} scans</span>
                        <span>{percent(count, rows.length)}</span>
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Pattern Signatures</h2>
                <div className={styles.countGrid}>
                  {topEntries(summary.signatureCounts).slice(0, 12).map(([signature, count]) => (
                    <article key={signature} className={styles.countItem}>
                      <span className={`${styles.countName} ${styles.mono}`}>{signature}</span>
                      <span className={styles.countMeta}>
                        <span>{count} scans</span>
                        <span>{percent(count, rows.length)}</span>
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>Recent Diagnostics</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Created</th>
                        <th>Name</th>
                        <th>Family</th>
                        <th>Confidence</th>
                        <th>Nearest alt</th>
                        <th>History</th>
                        <th>Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 80).map((row, index) => (
                        <tr key={`${row.created_at ?? "row"}-${row.pattern_signature ?? index}`}>
                          <td>{row.created_at ? new Date(row.created_at).toLocaleString() : "Unknown"}</td>
                          <td>{row.canonical_display_name ?? row.display_name ?? "-"}</td>
                          <td>{row.canonical_family ?? row.family ?? "-"}</td>
                          <td>{typeof row.confidence === "number" ? row.confidence.toFixed(2) : "-"}</td>
                          <td>
                            {nearestAlternative(row) === null ? "-" : nearestAlternative(row)?.toFixed(2)}
                          </td>
                          <td>{row.baseline?.comparisonAvailable ? "Yes" : "No"}</td>
                          <td className={styles.mono}>{row.canonical_pattern_signature ?? row.pattern_signature ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
