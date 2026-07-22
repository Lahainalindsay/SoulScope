import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoulScopeReport } from "../../buildSoulScopeReport";
import type { ScanCompleteness } from "../../partialScan";
import { createScanSession, updateScanSession } from "./scanRepository";
import { insertSensorCaptures } from "./captureRepository";
import { insertRawFeatureMeasurements } from "./featureRepository";
import { insertEvidenceSignals } from "./evidenceRepository";
import { insertObservations } from "./observationRepository";
import { insertDomainResults } from "./domainRepository";
import { insertPatternMatches } from "./patternRepository";
import { insertReflectionVariants } from "./reflectionRepository";
import { refreshPersonalBaselines } from "./refreshPersonalBaselines";
import { mapScanSession } from "./mappers/mapScanSession";
import { mapSensorCaptures } from "./mappers/mapSensorCaptures";
import { mapRawFeatures } from "./mappers/mapRawFeatures";
import { mapEvidenceSignals } from "./mappers/mapEvidenceSignals";
import { mapObservations } from "./mappers/mapObservations";
import { mapDomains } from "./mappers/mapDomains";
import { mapPatternMatches } from "./mappers/mapPatternMatches";
import { mapReflectionVariants } from "./mappers/mapReflectionVariants";
import type { ScanSessionRow, ScanSessionUpdate } from "./types";
import { toJsonObject, toJsonValue } from "./json";
import { throwIfError } from "./client";

export interface PersistSoulScopeV2ResultArgs {
  client: SupabaseClient;
  userId: string;
  scanId: string;
  completeness: ScanCompleteness;
  report: SoulScopeReport;
  rawResult: unknown;
  startedAt?: string | null;
  completedAt?: string;
}

function finalSessionUpdate(args: ReturnType<typeof mapScanSession>): ScanSessionUpdate {
  const { id: _id, user_id: _userId, ...updates } = args;
  return updates;
}

async function upsertInterpretationDiagnostics(args: PersistSoulScopeV2ResultArgs) {
  const canonical = args.report.canonicalPattern;
  const response = await args.client.from("scan_interpretation_diagnostics").upsert(
    {
      scan_id: args.scanId,
      user_id: args.userId,
      subject_id: args.report.dynamicPattern.baseline.subjectId,
      pattern_signature: canonical.canonicalPatternSignature,
      display_name: canonical.canonicalDisplayName,
      family: canonical.canonicalFamily,
      canonical_pattern_signature: canonical.canonicalPatternSignature,
      canonical_display_name: canonical.canonicalDisplayName,
      canonical_family: canonical.canonicalFamily,
      primary_family: canonical.primaryFamily,
      secondary_family: canonical.secondaryFamily,
      confidence: canonical.confidence,
      confidence_margin: canonical.confidenceMargin,
      state_vector: toJsonObject(canonical.stateVector),
      evidence_ledger: toJsonObject(canonical.evidenceLedger),
      dimension_ledger: toJsonObject(canonical.dimensionLedger),
      decision_ledger: toJsonObject(canonical.decisionLedger),
      baseline: toJsonObject(args.report.dynamicPattern.baseline),
      interpretation_limits: canonical.interpretationLimits.map(toJsonValue),
      reflection_source: toJsonObject(canonical.reflectionSource),
      engine_version: canonical.engineVersion,
    },
    { onConflict: "scan_id" },
  );
  throwIfError(response.error, "Could not save scan interpretation diagnostics");
}

export async function persistSoulScopeV2Result(args: PersistSoulScopeV2ResultArgs): Promise<ScanSessionRow> {
  const pipeline = args.report.observationPipeline;
  if (!pipeline) throw new Error("The observation pipeline is required for V2 persistence.");
  const completedAt = args.completedAt ?? new Date().toISOString();
  const context = {
    scanId: args.scanId,
    userId: args.userId,
    report: args.report,
    pipeline,
    completeness: args.completeness,
    rawResult: args.rawResult,
    startedAt: args.startedAt,
    completedAt,
  };

  await createScanSession(args.client, mapScanSession(context, "processing"));
  try {
    await insertSensorCaptures(args.client, mapSensorCaptures(context));
    await insertRawFeatureMeasurements(args.client, mapRawFeatures(context));
    await insertEvidenceSignals(args.client, mapEvidenceSignals(context));
    await insertObservations(args.client, mapObservations(context));
    await insertDomainResults(args.client, mapDomains(context));
    await insertPatternMatches(args.client, mapPatternMatches(context));
    await insertReflectionVariants(args.client, mapReflectionVariants(context));
    await upsertInterpretationDiagnostics(args);
    const session = await updateScanSession(
      args.client,
      args.scanId,
      finalSessionUpdate(mapScanSession(context, args.completeness.status)),
    );
    try {
      await refreshPersonalBaselines(args.client, args.userId);
    } catch (baselineError) {
      console.warn("The scan was saved, but personal baselines were not refreshed.", baselineError);
    }
    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : "V2 persistence failed.";
    try {
      await updateScanSession(args.client, args.scanId, {
        status: "failed",
        completed_at: null,
        warnings: [...pipeline.warnings, message],
        retry_recommended: true,
      });
    } catch {
      // Preserve the original persistence error.
    }
    throw new Error(`Could not save the SoulScope result: ${message}`);
  }
}
