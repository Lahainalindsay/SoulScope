"use client";

import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { CHECK_IN_EMOTIONS, listCheckInsForRange, toLocalDateKey, upsertDailyCheckIn, type CheckInEmotion } from "../lib/data/v2/checkInRepository";
import styles from "./HomeDailyCheckIn.module.css";

type HomeDailyCheckInProps = { linkedScanId?: string | null };

export default function HomeDailyCheckIn({ linkedScanId = null }: HomeDailyCheckInProps) {
  const session = useSession();
  const [emotions, setEmotions] = useState<CheckInEmotion[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    const date = toLocalDateKey();
    void listCheckInsForRange(supabase, date, date).then((items) => {
      const today = items[0];
      setEmotions(today?.emotions ?? []);
      setNote(today?.note ?? "");
    }).catch(() => undefined);
  }, [session?.user]);

  const toggle = (emotion: CheckInEmotion) => {
    setStatus("");
    setEmotions((current) => current.includes(emotion)
      ? current.filter((item) => item !== emotion)
      : current.length < 3 ? [...current, emotion] : current);
  };

  const save = async () => {
    if (!session?.user) {
      setStatus("Sign in to save your check-in.");
      return;
    }
    try {
      await upsertDailyCheckIn(supabase, { date: toLocalDateKey(), emotions, note, linkedScanId });
      setStatus("Today’s check-in is saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Your check-in could not be saved.");
    }
  };

  return (
    <section className={styles.card} aria-labelledby="daily-check-in-title">
      <div className={styles.header}>
        <div><p className={styles.eyebrow}>Personal Check-In</p><h2 id="daily-check-in-title">Add context to this moment.</h2></div>
        <span>{emotions.length}/3 selected</span>
      </div>
      <div className={styles.chips}>
        {CHECK_IN_EMOTIONS.map((emotion) => <button key={emotion} type="button" aria-pressed={emotions.includes(emotion)} onClick={() => toggle(emotion)}>{emotion}</button>)}
      </div>
      <textarea value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="Optional note about what was happening around this moment" aria-label="Optional check-in note" />
      <div className={styles.footer}><p aria-live="polite">{status}</p><button type="button" onClick={save}>Save Check-In</button></div>
    </section>
  );
}
