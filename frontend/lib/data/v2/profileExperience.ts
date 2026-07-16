import type { ScanHistoryItemViewModel } from "./getScanHistoryViewModel";
import type { DailyCheckInRow } from "./checkInRepository";

export interface CalendarDayViewModel {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  checkIn: DailyCheckInRow | null;
  scan: ScanHistoryItemViewModel | null;
}

export interface PatternTimelineItem {
  scan: ScanHistoryItemViewModel;
  checkIn: DailyCheckInRow | null;
  contextLine: string;
}

export function monthRange(anchor: Date): { start: string; end: string } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { start: key(start), end: key(end) };
}

function scanDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildCalendarMonth(anchor: Date, checkIns: DailyCheckInRow[], scans: ScanHistoryItemViewModel[]): CalendarDayViewModel[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const checkInByDate = new Map(checkIns.map((item) => [item.check_in_date, item]));
  const scanByDate = new Map<string, ScanHistoryItemViewModel>();
  scans.forEach((scan) => {
    const key = scanDateKey(scan.createdAt);
    if (!scanByDate.has(key)) scanByDate.set(key, scan);
  });
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      date: key,
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === anchor.getMonth(),
      checkIn: checkInByDate.get(key) ?? null,
      scan: scanByDate.get(key) ?? null,
    };
  });
}

export function buildPatternTimeline(scans: ScanHistoryItemViewModel[], checkIns: DailyCheckInRow[]): PatternTimelineItem[] {
  const byScan = new Map(checkIns.filter((item) => item.linked_scan_id).map((item) => [item.linked_scan_id as string, item]));
  return scans.map((scan, index) => {
    const previous = scans[index + 1];
    const contextLine = !previous
      ? "The first point in your personal pattern history."
      : previous.patternId === scan.patternId
        ? "This pattern also appeared in your previous scan."
        : `Your pattern moved from ${previous.patternName} to ${scan.patternName}.`;
    return { scan, checkIn: byScan.get(scan.scanId) ?? null, contextLine };
  });
}

export function recentNotes(checkIns: DailyCheckInRow[]): DailyCheckInRow[] {
  return checkIns.filter((item) => Boolean(item.note?.trim())).sort((a, b) => b.check_in_date.localeCompare(a.check_in_date));
}
