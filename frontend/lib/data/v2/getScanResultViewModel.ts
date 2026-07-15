import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSoulScopeReport, type SoulScopeReport } from "../../buildSoulScopeReport";
import { buildLongitudinalAnalysis, type LongitudinalAnalysis, type LongitudinalScanSnapshot } from "../../longitudinalIntelligence";
import { personalizeReportWithHistory } from "../../personalizeReflectionWithHistory";
import type { ScanWithCompleteness } from "../../partialScan";
import { getScanSession } from "./scanRepository";
import { listPatternMatchesForScan } from "./patternRepository";
import { listReflectionVariantsForScan } from "./reflectionRepository";
import { listDomainsForScan } from "./domainRepository";
import { listObservationsForScan } from "./observationRepository";
import { listEvidenceForScan } from "./evidenceRepository";
import { getScanReflectionPreference, getUserNarrativePreference } from "./preferenceRepository";
import { getPersonalBaselines } from "./baselineRepository";
import { listLongitudinalSnapshots } from "./longitudinalRepository";
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
  if (!Array.isArray(candidate.noteEnergies) || typeof candidate.summary !== "string") throw new Error("This scan result is incomplete.");
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
  longitudinal: LongitudinalAnalysis;
}

export async function getScanResultViewModel(client: SupabaseClient, scanId: string, includeEvidence = false): Promise<ScanResultViewModel | null> {
  const session = await getScanSession(client, scanId);
  if (!session) return null;
  const scan = parseRawResult(session.raw_result);
  const [patterns, reflections, domains, observations, allEvidence, selectedPreference, narrativePreference, baselines, history] = await Promise.all([
    listPatternMatchesForScan(client, scanId),
    listReflectionVariantsForScan(client, scanId),
    listDomainsForScan(client, scanId),
    listObservationsForScan(client, scanId),
    listEvidenceForScan(client, scanId),
    getScanReflectionPreference(client, scanId),
    getUserNarrativePreference(client),
    getPersonalBaselines(client),
    listLongitudinalSnapshots(client, { before: session.created_at, excludeScanId: scanId, limit: 200 }),
  ]);
  const current: LongitudinalScanSnapshot = {
    scanId,
    createdAt: session.created_at,
    status: session.status,
    quality: session.capture_quality,
    evidence: allEvidence.map((row) => ({ id: row.evidence_id, direction: row.direction, strength: row.strength, confidence: row.evidence_confidence })),
    observations: observations.map((row) => ({ id: row.observation_id, direction: row.direction, strength: row.strength, confidence: row.interpretation_confidence })),
    domains: domains.map((row) => ({ id: row.domain_id, score: row.score, orientation: row.orientation, confidence: row.interpretation_confidence })),
    patterns: patterns.map((row) => ({ id: row.pattern_id, confidence: row.confidence_score ?? 0 })),
    primaryPatternId: patterns.find((row) => row.role === "primary")?.pattern_id,
    signalDistribution: scan.noteEnergies?.slice().sort((a, b) => a.note.localeCompare(b.note)).map((note) => note.relativeEnergy) ?? [],
    resonanceDistribution: scan.noteEnergies?.slice().sort((a, b) => a.note.localeCompare(b.note)).map((note) => note.score / 100) ?? [],
  };
  const longitudinal = buildLongitudinalAnalysis(current, history);
  const hydrated = hydrateReportFromV2(buildSoulScopeReport(scan, { scanId }), { patterns, reflections, domains });
  const report = personalizeReportWithHistory(hydrated, longitudinal);
  return { session, scan, report, selectedPreference, narrativePreference, observations, evidence: includeEvidence ? allEvidence : [], baselines, longitudinal };
}
