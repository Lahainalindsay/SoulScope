import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSoulScopeReport, type SoulScopeReport } from "../../buildSoulScopeReport";
import type { ScanWithCompleteness } from "../../partialScan";
import { getScanSession } from "./scanRepository";
import { listPatternMatchesForScan } from "./patternRepository";
import { listReflectionVariantsForScan } from "./reflectionRepository";
import { listDomainsForScan } from "./domainRepository";
import { listObservationsForScan } from "./observationRepository";
import { listEvidenceForScan } from "./evidenceRepository";
import { getScanReflectionPreference, getUserNarrativePreference } from "./preferenceRepository";
import { getPersonalBaselines } from "./baselineRepository";
import { hydrateReportFromV2 } from "./hydrateReportFromV2";
import type {
  EvidenceSignalResultRow,
  ObservationResultRow,
  PersonalBaselineRow,
  ScanReflectionPreferenceRow,
  ScanSessionRow,
  UserNarrativePreferenceRow,
} from "./types";

function parseRawResult(value: ScanSessionRow["raw_result"]): ScanWithCompleteness {
  if (!value || typeof value !== "object") throw new Error("This scan does not contain a readable result.");
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.noteEnergies) || typeof candidate.summary !== "string") {
    throw new Error("This scan result is incomplete.");
  }
  return value as unknown as ScanWithCompleteness;
}

export interface ScanResultViewModel {
  session: ScanSessionRow;
  scan: ScanWithCompleteness;
  report: SoulScopeReport;
  selectedPreference: ScanReflectionPreferenceRow | null;
  narrativePreference: UserNarrativePreferenceRow | null;
  observations: ObservationResultRow[];
  evidence: EvidenceSignalResultRow[];
  baselines: PersonalBaselineRow[];
}

export async function getScanResultViewModel(
  client: SupabaseClient,
  scanId: string,
  includeEvidence = false,
): Promise<ScanResultViewModel | null> {
  const session = await getScanSession(client, scanId);
  if (!session) return null;
  const scan = parseRawResult(session.raw_result);
  const [patterns, reflections, domains, observations, evidence, selectedPreference, narrativePreference, baselines] = await Promise.all([
    listPatternMatchesForScan(client, scanId),
    listReflectionVariantsForScan(client, scanId),
    listDomainsForScan(client, scanId),
    listObservationsForScan(client, scanId),
    includeEvidence ? listEvidenceForScan(client, scanId) : Promise.resolve([]),
    getScanReflectionPreference(client, scanId),
    getUserNarrativePreference(client),
    getPersonalBaselines(client),
  ]);
  const report = hydrateReportFromV2(buildSoulScopeReport(scan, { scanId }), { patterns, reflections, domains });
  return { session, scan, report, selectedPreference, narrativePreference, observations, evidence, baselines };
}
