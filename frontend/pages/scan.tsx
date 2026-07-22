import Head from "next/head";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  resetGuidedScanSession,
  setGuidedScanSubject,
  type GuidedScanSubject,
} from "../lib/guidedScanSession";
import { supabase } from "../lib/supabaseClient";
import styles from "./scan/ScanIntro.module.css";

type ScanSubjectRow = {
  id: string;
  name: string;
  subject_type: "primary" | "secondary" | "guest" | "unidentified";
  identity_metadata: {
    identityConfidence?: number;
  } | null;
};

const GUEST_SUBJECT: GuidedScanSubject = {
  subjectId: null,
  subjectLabel: "Guest scan",
  identityConfidence: 0,
  historyEligible: false,
  status: "guest",
};

function subjectFromRow(subject: ScanSubjectRow): GuidedScanSubject {
  const confidence =
    subject.subject_type === "unidentified"
      ? 0
      : Math.max(0.7, Math.min(1, subject.identity_metadata?.identityConfidence ?? 0.9));

  return {
    subjectId: subject.id,
    subjectLabel: subject.name,
    identityConfidence: confidence,
    historyEligible: subject.subject_type !== "unidentified",
    status: subject.subject_type === "unidentified" ? "unidentified" : "confirmed",
  };
}

export default function ScanIntroPage() {
  const router = useRouter();
  const [introReady, setIntroReady] = useState(false);
  const [subjects, setSubjects] = useState<ScanSubjectRow[]>([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>("guest");
  const [subjectName, setSubjectName] = useState("");
  const [subjectStatus, setSubjectStatus] = useState("Loading saved subjects...");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    resetGuidedScanSession();
    const timer = window.setTimeout(() => {
      setIntroReady(true);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSubjects = async () => {
      const userResponse = await supabase.auth.getUser();
      if (!active) return;

      if (userResponse.error || !userResponse.data.user) {
        setIsSignedIn(false);
        setSubjects([]);
        setSelectedSubjectKey("guest");
        setSubjectStatus("Sign in to save named subjects. Guest scans will not shape Pattern History.");
        return;
      }

      setIsSignedIn(true);
      const response = await supabase
        .from("scan_subjects")
        .select("id, name, subject_type, identity_metadata")
        .eq("user_id", userResponse.data.user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (response.error) {
        setSubjects([]);
        setSelectedSubjectKey("guest");
        setSubjectStatus("Saved subjects are unavailable in this environment. Guest scans remain available.");
        return;
      }

      const rows = (response.data ?? []) as ScanSubjectRow[];
      setSubjects(rows);
      setSelectedSubjectKey(rows[0]?.id ?? "guest");
      setSubjectStatus(
        rows.length
          ? "Choose the person being scanned so history only compares the same confirmed subject."
          : "Add a named subject to unlock subject-specific Pattern History after future scans."
      );
    };

    void loadSubjects();

    return () => {
      active = false;
    };
  }, []);

  const selectedSubject = useMemo<GuidedScanSubject | null>(() => {
    if (selectedSubjectKey === "guest") return GUEST_SUBJECT;
    const row = subjects.find((subject) => subject.id === selectedSubjectKey);
    return row ? subjectFromRow(row) : null;
  }, [selectedSubjectKey, subjects]);

  const createSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = subjectName.trim().replace(/\s+/g, " ");
    if (!normalizedName || isCreatingSubject) return;

    setIsCreatingSubject(true);
    setSubjectStatus("Saving subject...");

    try {
      const userResponse = await supabase.auth.getUser();
      if (userResponse.error || !userResponse.data.user) {
        setSubjectStatus("Sign in before adding a saved subject. You can still continue as a guest scan.");
        return;
      }

      const response = await supabase
        .from("scan_subjects")
        .insert({
          user_id: userResponse.data.user.id,
          name: normalizedName,
          subject_type: "secondary",
          identity_metadata: { identityConfidence: 0.9 },
        })
        .select("id, name, subject_type, identity_metadata")
        .single();

      if (response.error || !response.data) {
        setSubjectStatus("The subject could not be saved. Guest scan is still available.");
        return;
      }

      const created = response.data as ScanSubjectRow;
      setSubjects((current) => [created, ...current]);
      setSelectedSubjectKey(created.id);
      setSubjectName("");
      setSubjectStatus("Subject saved. Future history will only compare scans assigned to this subject.");
    } finally {
      setIsCreatingSubject(false);
    }
  };

  const startScan = () => {
    if (!selectedSubject) return;
    setGuidedScanSubject(selectedSubject);
    void router.push("/scan/question/1");
  };

  return (
    <>
      <Head>
        <title>Start Scan | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.introStage}>
            <button type="button" className={styles.skipLink} onClick={startScan}>
              Skip
            </button>

            <div className={styles.heroPanel}>
              <p className={styles.eyebrow}>Resonance Scan</p>
              <h1 className={styles.title}>Before you begin your Resonance Scan.</h1>
              <p className={styles.lead}>Find a quiet place. Face the camera and speak naturally.</p>

              <div className={styles.instructionsCard}>
                <p className={styles.instructionsTitle}>For best results</p>
                <div className={styles.protocolBody}>
                  <p className={styles.protocolLine}>You will be guided through five short prompts, with up to 10 seconds to answer each one.</p>
                  <p className={styles.protocolLine}>Do your best to give a spoken response to every prompt. Even “I don’t know” or “I don’t have an answer” gives SoulScope more usable vocal information than silence.</p>
                  <p className={styles.protocolLine}>Your words are not being judged. SoulScope listens to how your voice and expression respond during the scan.</p>
                </div>
              </div>

              <div className={styles.instructionsCard}>
                <p className={styles.instructionsTitle}>Microphone and camera privacy</p>
                <div className={styles.protocolBody}>
                  <p className={styles.protocolLine}>Microphone access is required to complete the scan.</p>
                  <p className={styles.protocolLine}>For the most complete result, allow camera access as well. Camera input adds facial timing and movement context to the voice measurements.</p>
                  <p className={styles.protocolLine}>Your browser controls these permissions. You can cancel before recording begins or change access later in your device or browser settings.</p>
                  <p className={styles.protocolLine}>Saved scan data can be deleted from Settings. The repository does not show advertising use, sale of information, or model-training use.</p>
                </div>
              </div>

              <div className={styles.subjectCard}>
                <div className={styles.subjectHeader}>
                  <div>
                    <p className={styles.instructionsTitle}>Scan subject</p>
                    <p className={styles.subjectIntro}>Choose who this scan belongs to before recording begins.</p>
                  </div>
                </div>
                <div className={styles.subjectOptions} role="radiogroup" aria-label="Scan subject">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      className={[
                        styles.subjectOption,
                        selectedSubjectKey === subject.id ? styles.subjectOptionSelected : "",
                      ].join(" ")}
                      role="radio"
                      aria-checked={selectedSubjectKey === subject.id}
                      onClick={() => setSelectedSubjectKey(subject.id)}
                    >
                      <span>{subject.name}</span>
                      <small>Confirmed subject</small>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={[
                      styles.subjectOption,
                      selectedSubjectKey === "guest" ? styles.subjectOptionSelected : "",
                    ].join(" ")}
                    role="radio"
                    aria-checked={selectedSubjectKey === "guest"}
                    onClick={() => setSelectedSubjectKey("guest")}
                  >
                    <span>Guest scan</span>
                    <small>No history comparison</small>
                  </button>
                </div>
                {isSignedIn ? (
                  <form className={styles.subjectForm} onSubmit={createSubject}>
                    <label className={styles.subjectLabel} htmlFor="scan-subject-name">
                      Add subject
                    </label>
                    <div className={styles.subjectFormRow}>
                      <input
                        id="scan-subject-name"
                        className={styles.subjectInput}
                        value={subjectName}
                        maxLength={48}
                        placeholder="Name"
                        onChange={(event) => setSubjectName(event.target.value)}
                      />
                      <button
                        type="submit"
                        className={styles.secondaryButton}
                        disabled={isCreatingSubject || !subjectName.trim()}
                      >
                        {isCreatingSubject ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                ) : null}
                <p className={styles.subjectStatus}>{subjectStatus}</p>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={[
                    styles.primaryButton,
                    introReady ? styles.primaryButtonReady : styles.primaryButtonWaiting,
                  ].join(" ")}
                  disabled={!introReady || !selectedSubject}
                  onClick={startScan}
                >
                  Start a Resonance Scan
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
