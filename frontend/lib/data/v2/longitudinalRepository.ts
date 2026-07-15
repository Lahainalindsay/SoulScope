import type { SupabaseClient } from "@supabase/supabase-js";
import type { LongitudinalScanSnapshot } from "../../longitudinalIntelligence";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { DomainResultRow, EvidenceSignalResultRow, ObservationResultRow, PatternMatchRow, RawFeatureMeasurementRow, ScanSessionRow } from "./types";

function groupByScan<T extends { scan_id: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  rows.forEach((row) => grouped.set(row.scan_id, [...(grouped.get(row.scan_id) ?? []), row]));
  return grouped;
}

function distribution(rows: RawFeatureMeasurementRow[], prefix: string): number[] {
  return rows.filter((row) => row.feature_id.startsWith(prefix)).sort((a, b) => a.feature_id.localeCompare(b.feature_id)).map((row) => row.value);
}

export async function listLongitudinalSnapshots(
  client: SupabaseClient,
  options: { before?: string; excludeScanId?: string; limit?: number } = {},
): Promise<LongitudinalScanSnapshot[]> {
  const user = await requireAuthenticatedUser(client);
  let query = client.from("scan_sessions").select("*").eq("user_id", user.id).in("status", ["completed", "partial"]).order("created_at", { ascending: false }).limit(options.limit ?? 200);
  if (options.before) query = query.lt("created_at", options.before);
  if (options.excludeScanId) query = query.neq("id", options.excludeScanId);
  const { data: sessionData, error: sessionError } = await query;
  throwIfError(sessionError, "Could not load longitudinal scan history");
  const sessions = (sessionData ?? []) as ScanSessionRow[];
  const scanIds = sessions.map((session) => session.id);
  if (!scanIds.length) return [];

  const [evidenceResponse, observationResponse, domainResponse, patternResponse, featureResponse] = await Promise.all([
    client.from("evidence_signal_results").select("*").eq("user_id", user.id).in("scan_id", scanIds),
    client.from("observation_results").select("*").eq("user_id", user.id).in("scan_id", scanIds),
    client.from("domain_results").select("*").eq("user_id", user.id).in("scan_id", scanIds),
    client.from("pattern_matches").select("*").eq("user_id", user.id).in("scan_id", scanIds),
    client.from("raw_feature_measurements").select("*").eq("user_id", user.id).in("scan_id", scanIds),
  ]);
  throwIfError(evidenceResponse.error, "Could not load longitudinal evidence");
  throwIfError(observationResponse.error, "Could not load longitudinal observations");
  throwIfError(domainResponse.error, "Could not load longitudinal domains");
  throwIfError(patternResponse.error, "Could not load longitudinal patterns");
  throwIfError(featureResponse.error, "Could not load longitudinal features");

  const evidence = groupByScan((evidenceResponse.data ?? []) as EvidenceSignalResultRow[]);
  const observations = groupByScan((observationResponse.data ?? []) as ObservationResultRow[]);
  const domains = groupByScan((domainResponse.data ?? []) as DomainResultRow[]);
  const patterns = groupByScan((patternResponse.data ?? []) as PatternMatchRow[]);
  const features = groupByScan((featureResponse.data ?? []) as RawFeatureMeasurementRow[]);

  return sessions.map((session) => {
    const scanPatterns = patterns.get(session.id) ?? [];
    const scanFeatures = features.get(session.id) ?? [];
    return {
      scanId: session.id,
      createdAt: session.created_at,
      status: session.status,
      quality: session.capture_quality,
      evidence: (evidence.get(session.id) ?? []).map((row) => ({ id: row.evidence_id, direction: row.direction, strength: row.strength, confidence: row.evidence_confidence })),
      observations: (observations.get(session.id) ?? []).map((row) => ({ id: row.observation_id, direction: row.direction, strength: row.strength, confidence: row.interpretation_confidence })),
      domains: (domains.get(session.id) ?? []).map((row) => ({ id: row.domain_id, score: row.score, orientation: row.orientation, confidence: row.interpretation_confidence })),
      patterns: scanPatterns.map((row) => ({ id: row.pattern_id, confidence: row.confidence_score ?? 0 })),
      primaryPatternId: scanPatterns.find((row) => row.role === "primary")?.pattern_id,
      signalDistribution: distribution(scanFeatures, "voice.note_energy."),
      resonanceDistribution: distribution(scanFeatures, "voice.resonance_distribution."),
    };
  });
}
