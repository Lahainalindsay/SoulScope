import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import styles from "./Feedback.module.css";

type FeedbackRow = {
  id?: string;
  created_at?: string;
  page: string | null;
  scan_id: string | null;
  selected_summary_style: string | null;
  graphics_rating: number | null;
  wording_rating: number | null;
  clarity_rating: number | null;
  confusing_feedback: string | null;
  change_or_add_feedback: string | null;
};

type ReflectionPreferenceRow = {
  selected_style: string | null;
};

type AccessState = "checking" | "allowed" | "denied";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SOULSCOPE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function average(rows: FeedbackRow[], selector: (row: FeedbackRow) => number | null) {
  const values = rows.map(selector).filter((value): value is number => typeof value === "number");
  if (!values.length) return "No ratings yet";
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function countBy(values: Array<string | null | undefined>) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value || "Not selected";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export default function AdminFeedbackPage() {
  const [access, setAccess] = useState<AccessState>("checking");
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [preferenceRows, setPreferenceRows] = useState<ReflectionPreferenceRow[]>([]);
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

      const [{ data: feedbackData, error: feedbackError }, { data: preferenceData, error: preferenceError }] =
        await Promise.all([
          supabase
            .from("user_feedback")
            .select("id, created_at, page, scan_id, selected_summary_style, graphics_rating, wording_rating, clarity_rating, confusing_feedback, change_or_add_feedback")
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("scan_reflection_preferences")
            .select("selected_style")
            .limit(500),
        ]);

      if (feedbackError || preferenceError) {
        setError(feedbackError?.message ?? preferenceError?.message ?? "Could not load feedback.");
        return;
      }

      setFeedbackRows((feedbackData ?? []) as FeedbackRow[]);
      setPreferenceRows((preferenceData ?? []) as ReflectionPreferenceRow[]);
    };

    void load();
  }, []);

  const styleCounts = useMemo(() => countBy([
    ...feedbackRows.map((row) => row.selected_summary_style),
    ...preferenceRows.map((row) => row.selected_style),
  ]), [feedbackRows, preferenceRows]);

  const writtenByPage = useMemo(() => feedbackRows.reduce<Record<string, FeedbackRow[]>>((acc, row) => {
    if (!row.confusing_feedback && !row.change_or_add_feedback) return acc;
    const page = row.page || "unknown";
    acc[page] = [...(acc[page] ?? []), row];
    return acc;
  }, {}), [feedbackRows]);

  return (
    <>
      <Head><title>Admin Feedback | SoulScope</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div className={styles.page}>
        <main className={styles.shell}>
          <section className={styles.header}><p className={styles.eyebrow}>Internal</p><h1 className={styles.title}>Feedback Dashboard</h1></section>
          {access === "checking" ? <div className={styles.state}>Checking access...</div> : null}
          {access === "denied" ? <div className={styles.state}>This page is restricted to SoulScope admins.</div> : null}
          {access === "allowed" && error ? <div className={`${styles.state} ${styles.error}`}>{error}</div> : null}
          {access === "allowed" && !error ? (
            <>
              <section className={styles.metricsGrid}>
                <article className={styles.metricCard}><span className={styles.metricLabel}>Average graphics</span><strong className={styles.metricValue}>{average(feedbackRows, (row) => row.graphics_rating)}</strong></article>
                <article className={styles.metricCard}><span className={styles.metricLabel}>Average wording</span><strong className={styles.metricValue}>{average(feedbackRows, (row) => row.wording_rating)}</strong></article>
                <article className={styles.metricCard}><span className={styles.metricLabel}>Average clarity</span><strong className={styles.metricValue}>{average(feedbackRows, (row) => row.clarity_rating)}</strong></article>
                <article className={styles.metricCard}><span className={styles.metricLabel}>Recent rows</span><strong className={styles.metricValue}>{feedbackRows.length}</strong></article>
              </section>
              <section className={styles.panel}><h2 className={styles.sectionTitle}>Selected Narrative Styles</h2><div className={styles.countGrid}>{Object.entries(styleCounts).map(([style, count]) => <div key={style} className={styles.countItem}><span>{style}</span><strong>{count}</strong></div>)}</div></section>
              <section className={styles.panel}><h2 className={styles.sectionTitle}>Written Feedback by Page</h2><div className={styles.feedbackGroups}>{Object.entries(writtenByPage).map(([page, rows]) => <article key={page} className={styles.feedbackGroup}><h3>{page}</h3>{rows.slice(0, 8).map((row) => <div key={row.id ?? `${row.created_at}-${row.scan_id}`} className={styles.feedbackText}>{row.confusing_feedback ? <p><strong>Confusing:</strong> {row.confusing_feedback}</p> : null}{row.change_or_add_feedback ? <p><strong>Change/add:</strong> {row.change_or_add_feedback}</p> : null}</div>)}</article>)}{!Object.keys(writtenByPage).length ? <p className={styles.empty}>No written feedback yet.</p> : null}</div></section>
              <section className={styles.panel}><h2 className={styles.sectionTitle}>Recent Feedback Rows</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Created</th><th>Page</th><th>Graphics</th><th>Wording</th><th>Clarity</th><th>Style</th><th>Scan</th></tr></thead><tbody>{feedbackRows.slice(0, 40).map((row) => <tr key={row.id ?? `${row.created_at}-${row.scan_id}`}><td>{row.created_at ? new Date(row.created_at).toLocaleString() : "Unknown"}</td><td>{row.page ?? "unknown"}</td><td>{row.graphics_rating ?? "-"}</td><td>{row.wording_rating ?? "-"}</td><td>{row.clarity_rating ?? "-"}</td><td>{row.selected_summary_style ?? "-"}</td><td>{row.scan_id ?? "-"}</td></tr>)}</tbody></table></div></section>
            </>
          ) : null}
        </main>
      </div>
    </>
  );
}
