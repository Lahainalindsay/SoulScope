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
import { mapScanSession } from "./mappers/mapScanSession";
import { mapSensorCaptures } from "./mappers/mapSensorCaptures";
import { mapRawFeatures } from "./mappers/mapRawFeatures";
import { mapEvidenceSignals } from "./mappers/mapEvidenceSignals";
import { mapObservations } from "./mappers/mapObservations";
import { mapDomains } from "./mappers/mapDomains";
import { mapPatternMatches } from "./mappers/mapPatternMatches";
import { mapReflectionVariants } from "./mappers/mapReflectionVariants";
import type { ScanSessionRow, ScanSessionUpdate } from "./types";

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
    return await updateScanSession(
      args.client,
      args.scanId,
      finalSessionUpdate(mapScanSession(context, args.completeness.status)),
    );
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
