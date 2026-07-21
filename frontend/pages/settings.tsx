import Head from "next/head";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  LOCAL_SCAN_KEY,
  LOCAL_SCAN_LIST_KEY,
  getLocalDevSession,
} from "../lib/localSession";
import { resetGuidedScanSession } from "../lib/guidedScanSession";
import styles from "./Settings.module.css";

type AccessState = "checking" | "signed-in" | "local" | "signed-out";
type DeleteState = "idle" | "confirming" | "deleting" | "complete";

function clearLocalScanData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_SCAN_KEY);
  window.localStorage.removeItem(LOCAL_SCAN_LIST_KEY);
  window.sessionStorage.removeItem("soulscope.guidedScanSession");
  resetGuidedScanSession();
}

async function deleteIfAvailable(
  table: string,
  userId: string,
  setMessage: (message: string) => void
) {
  const response = await supabase.from(table).delete().eq("user_id", userId);
  if (!response.error) return;

  const message = response.error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    setMessage(`Skipped ${table}; the table is not available in this environment.`);
    return;
  }

  throw response.error;
}

export default function SettingsPage() {
  const [access, setAccess] = useState<AccessState>("checking");
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await supabase.auth.getUser();
      if (response.data.user) {
        setUserId(response.data.user.id);
        setAccess("signed-in");
        return;
      }

      setAccess(getLocalDevSession() ? "local" : "signed-out");
    };

    void load();
  }, []);

  const deleteSavedData = async () => {
    setError(null);
    setMessage(null);
    setDeleteState("deleting");

    try {
      if (userId) {
        await deleteIfAvailable("scan_sessions", userId, setMessage);
        await deleteIfAvailable("scan_subjects", userId, setMessage);
      }

      clearLocalScanData();
      setDeleteState("complete");
      setMessage("Saved scan results, local scan copies, and saved scan subjects have been cleared.");
    } catch (deleteError) {
      setDeleteState("confirming");
      setError(deleteError instanceof Error ? deleteError.message : "Saved scan data could not be deleted.");
    }
  };

  return (
    <>
      <Head>
        <title>Settings | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.header}>
            <p className={styles.eyebrow}>Settings</p>
            <h1 className={styles.title}>Your private data.</h1>
            <p className={styles.lead}>
              Manage saved Resonance Scan data for this account and browser.
            </p>
          </section>

          {access === "checking" ? <div className={styles.state}>Checking session...</div> : null}
          {access === "signed-out" ? (
            <div className={styles.state}>Sign in to manage saved account scan data.</div>
          ) : null}

          {access !== "checking" && access !== "signed-out" ? (
            <section className={styles.panel}>
              <p className={styles.eyebrow}>Data deletion</p>
              <h2 className={styles.sectionTitle}>Delete saved scan data</h2>
              <p className={styles.body}>
                This removes saved scan rows for this account, saved scan subjects, local fallback results,
                and any in-progress browser scan session. It does not delete the login account itself.
              </p>
              <ul className={styles.details}>
                <li>Original guided-scan audio kept in browser session storage is cleared.</li>
                <li>Saved scan results and linked report rows are removed for the signed-in account.</li>
                <li>Saved subject labels are removed so future history starts fresh.</li>
              </ul>

              {deleteState === "confirming" ? (
                <div className={styles.confirmBox}>
                  <p className={styles.confirmTitle}>Confirm deletion</p>
                  <p className={styles.message}>
                    This action clears saved scan data for this account. It cannot be undone from SoulScope.
                  </p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.dangerButton} onClick={deleteSavedData}>
                      Delete Saved Scan Data
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setDeleteState("idle")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={deleteState === "deleting"}
                    onClick={() => setDeleteState("confirming")}
                  >
                    {deleteState === "deleting" ? "Deleting..." : "Delete Saved Scan Data"}
                  </button>
                </div>
              )}

              {message ? <p className={styles.message}>{message}</p> : null}
              {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
