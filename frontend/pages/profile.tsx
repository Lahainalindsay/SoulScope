"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import NoteAuraMap from "../components/NoteAuraMap";
import { supabase } from "../lib/supabaseClient";
import { getScanHistoryViewModel, type ScanHistoryItemViewModel } from "../lib/data/v2/getScanHistoryViewModel";
import { CHECK_IN_EMOTIONS, deleteDailyCheckIn, listCheckInsForRange, toLocalDateKey, upsertDailyCheckIn, type CheckInEmotion, type DailyCheckInRow } from "../lib/data/v2/checkInRepository";
import { getOwnProfile, normalizeProfileName, upsertOwnProfileName, type ProfileRow } from "../lib/data/v2/profileRepository";
import { buildCalendarMonth, buildPatternTimeline, monthRange, recentNotes } from "../lib/data/v2/profileExperience";
import styles from "./Profile.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ProfilePage() {
  const session = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [scans, setScans] = useState<ScanHistoryItemViewModel[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckInRow[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<CheckInEmotion[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError("");
    try {
      const rangeStart = new Date();
      rangeStart.setFullYear(rangeStart.getFullYear() - 2);
      const [nextProfile, history, nextCheckIns] = await Promise.all([
        getOwnProfile(supabase),
        getScanHistoryViewModel(supabase, 100),
        listCheckInsForRange(supabase, toLocalDateKey(rangeStart), toLocalDateKey()),
      ]);
      setProfile(nextProfile);
      setNameInput(nextProfile?.display_name ?? "");
      setScans(history.items);
      setCheckIns(nextCheckIns);
      const today = nextCheckIns.find((item) => item.check_in_date === toLocalDateKey());
      setSelectedEmotions(today?.emotions ?? []);
      setNote(today?.note ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not open your personal space.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [session?.user?.id]);

  const latest = scans[0] ?? null;
  const noteEnergies = latest?.scan?.noteEnergies ?? [];
  const calendar = useMemo(() => buildCalendarMonth(month, checkIns, scans), [month, checkIns, scans]);
  const selectedDay = calendar.find((day) => day.date === selectedDate) ?? null;
  const timeline = useMemo(() => buildPatternTimeline(scans, checkIns), [scans, checkIns]);
  const notes = useMemo(() => recentNotes(checkIns), [checkIns]);

  const toggleEmotion = (emotion: CheckInEmotion) => {
    setStatus("");
    setSelectedEmotions((current) => current.includes(emotion)
      ? current.filter((item) => item !== emotion)
      : current.length < 3 ? [...current, emotion] : current);
  };

  const saveCheckIn = async () => {
    try {
      const saved = await upsertDailyCheckIn(supabase, {
        date: toLocalDateKey(),
        emotions: selectedEmotions,
        note,
        linkedScanId: latest && toLocalDateKey(new Date(latest.createdAt)) === toLocalDateKey() ? latest.scanId : null,
      });
      setCheckIns((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setStatus("Check-in saved.");
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your check-in.");
    }
  };

  const saveName = async () => {
    try {
      const saved = await upsertOwnProfileName(supabase, nameInput);
      setProfile(saved);
      setNameInput(saved.display_name ?? "");
      setStatus("Name saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your name.");
    }
  };

  const editDay = (item: DailyCheckInRow) => {
    setSelectedDate(item.check_in_date);
    if (item.check_in_date === toLocalDateKey()) {
      setSelectedEmotions(item.emotions);
      setNote(item.note ?? "");
      document.getElementById("daily-check-in")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const removeNote = async (item: DailyCheckInRow) => {
    if (!window.confirm("Delete this check-in and note?")) return;
    await deleteDailyCheckIn(supabase, item.id);
    setCheckIns((current) => current.filter((entry) => entry.id !== item.id));
  };

  const displayName = profile?.display_name?.trim();

  return (
    <>
      <Head><title>Your SoulScope | SoulScope</title></Head>
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Welcome Back</p>
              <h1 className={styles.title}>{displayName || "Welcome back."}</h1>
              <p className={styles.lead}>Your recent reflections, patterns, and check-ins—together in one place.</p>
            </div>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primary}>{scans.length ? "Start New Scan" : "Start Scan"}</Link>
              <button className={styles.secondary} type="button" onClick={() => document.getElementById("daily-check-in")?.scrollIntoView({ behavior: "smooth" })}>Daily Check-In</button>
            </div>
            {!displayName && !loading ? (
              <div className={styles.namePrompt}>
                <p>What should SoulScope call you?</p>
                <div className={styles.actions}>
                  <input className={styles.input} value={nameInput} maxLength={50} onChange={(event) => setNameInput(normalizeProfileName(event.target.value))} aria-label="Preferred profile name" />
                  <button className={styles.primary} type="button" onClick={saveName}>Save Name</button>
                </div>
              </div>
            ) : null}
          </header>

          {error ? <p className={styles.error}>{error}</p> : null}

          <section className={styles.section}>
            <div className={styles.sectionHeader}><p className={styles.eyebrow}>Current Resonance</p><h2 className={styles.sectionTitle}>{latest ? "Your latest reflection" : "Your Resonance Map begins with your first scan."}</h2></div>
            {latest && latest.scan ? (
              <div className={styles.resonance}>
                <div className={styles.mapWrap}><NoteAuraMap noteEnergies={noteEnergies} title="Resonance Map" /></div>
                <div className={styles.reflection}>
                  <p className={styles.meta}>{formatDate(latest.createdAt)}</p>
                  <h3>{latest.patternName}</h3>
                  <p>{latest.conciseSummary}</p>
                  <Link href={`/results/${latest.scanId}`} className={styles.secondary}>Open Insight</Link>
                </div>
              </div>
            ) : <div className={styles.empty}><p>No technical placeholder. Your first map will appear here after a scan.</p><Link href="/scan" className={styles.primary}>Start Scan</Link></div>}
          </section>

          <section id="daily-check-in" className={`${styles.section} ${styles.checkIn}`}>
            <p className={styles.eyebrow}>Daily Check-In</p>
            <h2 className={styles.sectionTitle}>How are you arriving today?</h2>
            <div className={styles.chips}>{CHECK_IN_EMOTIONS.map((emotion) => <button key={emotion} type="button" className={`${styles.chip} ${selectedEmotions.includes(emotion) ? styles.chipSelected : ""}`} aria-pressed={selectedEmotions.includes(emotion)} onClick={() => toggleEmotion(emotion)}>{emotion}</button>)}</div>
            <textarea className={styles.note} value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="Anything you want to remember about today?" />
            <div className={styles.formFooter}><p className={styles.status}>{status}</p><button className={styles.primary} type="button" onClick={saveCheckIn}>Save Check-In</button></div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}><p className={styles.eyebrow}>Your Days</p><h2 className={styles.sectionTitle}>A record of your check-ins and scans.</h2></div>
            <div className={styles.calendar}>
              <div className={styles.calendarHeader}><button className={styles.monthButton} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button><h3 className={styles.monthTitle}>{new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(month)}</h3><button className={styles.monthButton} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button></div>
              <div className={styles.weekday}>{["S","M","T","W","T","F","S"].map((day,index)=><span key={`${day}-${index}`}>{day}</span>)}</div>
              <div className={styles.calendarGrid}>{calendar.map((day) => <button key={day.date} className={`${styles.day} ${!day.inCurrentMonth ? styles.dayMuted : ""} ${selectedDate===day.date ? styles.daySelected : ""}`} onClick={() => setSelectedDate(day.date)}><span>{day.dayNumber}</span><span className={styles.markers}>{day.checkIn ? <i className={styles.checkMarker}/> : null}{day.scan ? <i className={styles.scanMarker}/> : null}</span></button>)}</div>
              {selectedDay ? <div className={styles.dayDetail}><h3>{selectedDay.date}</h3>{selectedDay.checkIn ? <><div className={styles.emotionRow}>{selectedDay.checkIn.emotions.map((emotion)=><span key={emotion} className={styles.emotion}>{emotion}</span>)}</div>{selectedDay.checkIn.note ? <p>{selectedDay.checkIn.note}</p> : null}</> : <p>No check-in saved.</p>}{selectedDay.scan ? <><p>{selectedDay.scan.patternName}</p><Link href={`/results/${selectedDay.scan.scanId}`}>Open Insight</Link></> : null}</div> : null}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}><p className={styles.eyebrow}>Recent Reflections</p><h2 className={styles.sectionTitle}>Your pattern history.</h2></div>
            {timeline.length ? <div className={styles.timeline}>{timeline.slice(0,12).map(({scan,checkIn,contextLine}) => <article key={scan.scanId} className={styles.timelineItem}><div className={styles.timelineDate}>{formatDate(scan.createdAt)}<br/>{scan.quality}</div><div className={styles.timelineMain}><h3>{scan.patternName}</h3><p>{contextLine}</p>{checkIn?.emotions.length ? <div className={styles.emotionRow}>{checkIn.emotions.map((emotion)=><span className={styles.emotion} key={emotion}>{emotion}</span>)}</div> : null}</div><Link href={`/results/${scan.scanId}`} className={styles.secondary}>Open Insight</Link></article>)}</div> : <div className={styles.empty}>Your pattern history begins with your first scan.</div>}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}><p className={styles.eyebrow}>Notes</p><h2 className={styles.sectionTitle}>What you wanted to remember.</h2></div>
            {notes.length ? <div className={styles.notes}>{notes.slice(0,8).map((item)=><article key={item.id} className={styles.noteCard}><p className={styles.meta}>{item.check_in_date}</p><p>{item.note}</p><div className={styles.actions}><button className={styles.secondary} onClick={() => editDay(item)}>Edit</button><button className={styles.secondary} onClick={() => void removeNote(item)}>Delete</button></div></article>)}</div> : <div className={styles.empty}>Notes you add during a check-in will appear here.</div>}
          </section>

          <details className={styles.account}>
            <summary>Account</summary>
            <div className={styles.accountBody}>
              <div className={styles.field}><label>Preferred name</label><input className={styles.input} value={nameInput} maxLength={50} onChange={(event)=>setNameInput(event.target.value)} /><button className={styles.secondary} onClick={saveName}>Save Name</button></div>
              <div><p className={styles.meta}>Email</p><p className={styles.email}>{session?.user?.email ?? ""}</p></div>
              <div><p className={styles.meta}>Member since</p><p>{session?.user?.created_at ? formatDate(session.user.created_at) : "—"}</p></div>
              <div><p className={styles.meta}>Scans completed</p><p>{scans.length}</p></div>
            </div>
          </details>
        </div>
      </main>
    </>
  );
}
