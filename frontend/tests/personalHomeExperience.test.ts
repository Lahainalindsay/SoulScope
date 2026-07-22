import assert from "node:assert/strict";
import test from "node:test";
import { CHECK_IN_EMOTIONS, toLocalDateKey, validateCheckInInput } from "../lib/data/v2/checkInRepository";
import { normalizeProfileName } from "../lib/data/v2/profileRepository";
import { buildCalendarMonth, buildPatternTimeline, recentNotes } from "../lib/data/v2/profileExperience";
import type { DailyCheckInRow } from "../lib/data/v2/checkInRepository";
import type { ScanHistoryItemViewModel } from "../lib/data/v2/getScanHistoryViewModel";
import fs from "node:fs";
import path from "node:path";

const checkIn = (overrides: Partial<DailyCheckInRow> = {}): DailyCheckInRow => ({
  id: "check-1", user_id: "user-1", check_in_date: "2026-07-16", emotions: ["Calm"], note: "A quiet morning.", linked_scan_id: null,
  created_at: "2026-07-16T08:00:00Z", updated_at: "2026-07-16T08:00:00Z", ...overrides,
});

const scan = (overrides: Partial<ScanHistoryItemViewModel> = {}): ScanHistoryItemViewModel => ({
  scanId: "scan-1", createdAt: "2026-07-16T18:00:00Z", status: "completed", quality: "good", patternName: "Balanced Regulator",
  patternId: "balanced-regulator", expressionTitle: "Steady and Available", conciseSummary: "A steady current pattern.", selectedStyle: "direct",
  rawResult: null, scan: null, report: null, ...overrides,
});

test("profile names are trimmed and normalized", () => assert.equal(normalizeProfileName("  Maya   Rose  "), "Maya Rose"));
test("profile names respect the maximum length", () => assert.equal(normalizeProfileName("a".repeat(80)).length, 50));
test("an existing account may gracefully have no display name", () => assert.equal(normalizeProfileName("   "), ""));
test("a check-in may contain zero emotions and a note", () => assert.deepEqual(validateCheckInInput({ date: "2026-07-16", emotions: [], note: "Remember this." }).emotions, []));
test("a check-in accepts one to three approved emotions", () => assert.equal(validateCheckInInput({ date: "2026-07-16", emotions: ["Calm","Focused","Hopeful"] }).emotions.length, 3));
test("more than three emotions are rejected", () => assert.throws(() => validateCheckInInput({ date: "2026-07-16", emotions: ["Calm","Focused","Hopeful","Grounded"] }), /up to three/i));
test("unknown emotion values are rejected", () => assert.throws(() => validateCheckInInput({ date: "2026-07-16", emotions: ["Calm","Focused","Unknown" as never] }), /not available/i));
test("duplicate emotions collapse before persistence", () => assert.deepEqual(validateCheckInInput({ date: "2026-07-16", emotions: ["Calm","Calm"] }).emotions, ["Calm"]));
test("local date keys do not use UTC conversion", () => assert.equal(toLocalDateKey(new Date(2026, 0, 2, 23, 30)), "2026-01-02"));
test("the approved emotion vocabulary contains eighteen neutral choices", () => assert.equal(CHECK_IN_EMOTIONS.length, 18));
test("calendar marks check-ins and scans on the same date", () => {
  const day = buildCalendarMonth(new Date(2026, 6, 1), [checkIn()], [scan()]).find((item) => item.date === "2026-07-16");
  assert.ok(day?.checkIn); assert.ok(day?.scan);
});
test("calendar produces a mobile-safe six-week grid", () => assert.equal(buildCalendarMonth(new Date(2026, 6, 1), [], []).length, 42));
test("pattern timeline links a check-in by scan id", () => assert.equal(buildPatternTimeline([scan()], [checkIn({ linked_scan_id: "scan-1" })])[0]?.checkIn?.id, "check-1"));
test("pattern timeline distinguishes repeating patterns", () => {
  const items = buildPatternTimeline([scan(), scan({ scanId: "scan-0", createdAt: "2026-07-15T18:00:00Z" })], []);
  assert.match(items[0]?.contextLine ?? "", /also appeared/i);
});
test("pattern timeline describes change without improvement language", () => {
  const items = buildPatternTimeline([scan(), scan({ scanId: "scan-0", patternId: "deep-processor", patternName: "Deep Processor" })], []);
  assert.match(items[0]?.contextLine ?? "", /moved from/i);
  assert.doesNotMatch(items[0]?.contextLine ?? "", /improved|declined/i);
});
test("recent notes exclude empty entries and sort newest first", () => {
  const notes = recentNotes([checkIn({ id:"a",check_in_date:"2026-07-14" }),checkIn({id:"b",check_in_date:"2026-07-16",note:""}),checkIn({id:"c",check_in_date:"2026-07-15"})]);
  assert.deepEqual(notes.map((item) => item.id), ["c","a"]);
});
test("profile page does not issue direct table queries", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "pages/profile.tsx"), "utf8");
  assert.doesNotMatch(source, /\.from\s*\(/);
});
test("check-in code is not imported by classification or report builders", () => {
  for (const file of ["lib/buildSoulScopeReport.ts","lib/resonancePatterns.ts","lib/observationFramework/buildObservationPipeline.ts"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    assert.doesNotMatch(source, /checkInRepository|daily_check_ins/);
  }
});
test("profile styles protect mobile width and email overflow", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "pages/Profile.module.css"), "utf8");
  assert.match(source, /overflow-x:hidden/);
  assert.match(source, /overflow-wrap:anywhere/);
  assert.match(source, /max-width:360px/);
});
test("legacy note map interaction foundation is disabled by default", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/NoteAuraMap.tsx"), "utf8");
  assert.match(source, /interactionsEnabled = false/);
  assert.match(source, /entityType: ResonanceMapEntityType/);
});
