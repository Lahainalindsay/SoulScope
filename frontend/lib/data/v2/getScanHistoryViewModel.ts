import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSoulScopeReport, type SoulScopeReport } from "../../buildSoulScopeReport";
import type { ScanWithCompleteness } from "../../partialScan";
import { listScanHistory } from "./scanRepository";
import { listPatternMatchesForScans } from "./patternRepository";
import { listReflectionVariantsForScans } from "./reflectionRepository";
import { listScanReflectionPreferences } from "./preferenceRepository";
import { listDomainsForScans } from "./domainRepository";
import { listInterpretationDiagnosticsForScans } from "./diagnosticsRepository";
import { hydrateReportFromV2 } from "./hydrateReportFromV2";
import type { JsonObject, QualityLevel, ReflectionStyle, ScanStatus } from "./types";

export interface ScanHistoryItemViewModel {
  scanId: string;
  createdAt: string;
  status: ScanStatus;
  quality: QualityLevel;
  patternName: string;
  patternId: string;
  expressionTitle: string | null;
  conciseSummary: string;
  selectedStyle: ReflectionStyle | null;
  rawResult: JsonObject | null;
  scan: ScanWithCompleteness | null;
  report: SoulScopeReport | null;
}

export interface ScanHistoryViewModel {
  items: ScanHistoryItemViewModel[];
}

function parseScan(rawResult: JsonObject | null): ScanWithCompleteness | null {
  if (!rawResult || !Array.isArray(rawResult.noteEnergies) || typeof rawResult.summary !== "string") return null;
  return rawResult as unknown as ScanWithCompleteness;
}

export async function getScanHistoryViewModel(
  client: SupabaseClient,
  limit = 100,
): Promise<ScanHistoryViewModel> {
  const sessions = await listScanHistory(client, limit);
  const scanIds = sessions.map((session) => session.id);
  const [patterns, reflections, preferences, domains, diagnostics] = await Promise.all([
    listPatternMatchesForScans(client, scanIds),
    listReflectionVariantsForScans(client, scanIds),
    listScanReflectionPreferences(client, scanIds),
    listDomainsForScans(client, scanIds),
    listInterpretationDiagnosticsForScans(client, scanIds),
  ]);

  const items = sessions.map((session) => {
    const scan = parseScan(session.raw_result);
    const scanPatterns = patterns.filter((row) => row.scan_id === session.id);
    const scanReflections = reflections.filter((row) => row.scan_id === session.id);
    const scanDomains = domains.filter((row) => row.scan_id === session.id);
    const scanDiagnostics = diagnostics.filter((row) => row.scan_id === session.id);
    const diagnostic = scanDiagnostics[0];
    const primary = scanPatterns.find((row) => row.role === "primary");
    const preference = preferences.find((row) => row.scan_id === session.id);
    const selected = preference
      ? scanReflections.find((row) => row.style === preference.selected_style)
      : scanReflections.find((row) => row.style === "direct") ?? scanReflections[0];
    const report = scan
      ? hydrateReportFromV2(buildSoulScopeReport(scan, { scanId: session.id }), {
          patterns: scanPatterns,
          reflections: scanReflections,
          domains: scanDomains,
          diagnostics: scanDiagnostics,
        })
      : null;
    const canonicalName = diagnostic?.canonical_display_name
      ?? diagnostic?.display_name
      ?? primary?.pattern_expression_title
      ?? primary?.pattern_name
      ?? report?.primaryPattern.name
      ?? "Current Pattern";
    return {
      scanId: session.id,
      createdAt: session.created_at,
      status: session.status,
      quality: session.capture_quality,
      patternName: canonicalName,
      patternId: primary?.pattern_id ?? report?.primaryPattern.id ?? "unknown",
      expressionTitle: canonicalName ?? report?.patternExpression.title ?? null,
      conciseSummary: selected?.summary ?? primary?.explanation ?? report?.storyCandidates[0]?.summary ?? "Open this scan to view your reflection.",
      selectedStyle: preference?.selected_style ?? selected?.style ?? null,
      rawResult: session.raw_result,
      scan,
      report,
    };
  });
  return { items };
}
