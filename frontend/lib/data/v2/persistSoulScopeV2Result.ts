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
import type { ReflectionVariantRow, ScanInterpretationDiagnosticRow, ScanSessionRow, ScanSessionUpdate } from "./types";
import { toJsonObject, toJsonValue } from "./json";
import { throwIfError } from "./client";
import { isDiagnosticsSchemaDriftError } from "./diagnosticsRepository";

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

type DiagnosticsPayload = Record<string, unknown>;

const REQUIRED_DIAGNOSTIC_COLUMNS = [
  "scan_id",
  "user_id",
  "canonical_pattern_signature",
  "canonical_display_name",
  "organizing_quality",
  "result_type",
  "naming_matrix_version",
  "confidence",
  "confidence_margin",
  "state_vector",
  "decision_ledger",
  "reflection_source",
  "subpattern_scores",
  "engine_version",
].join(",");

export function diagnosticPayloadVariants(args: PersistSoulScopeV2ResultArgs): DiagnosticsPayload[] {
  const canonical = args.report.canonicalPattern;
  const legacy = {
    scan_id: args.scanId,
    user_id: args.userId,
    subject_id: args.report.dynamicPattern.baseline.subjectId,
    pattern_signature: canonical.canonicalPatternSignature,
    display_name: canonical.canonicalDisplayName,
    family: canonical.canonicalFamily,
    confidence: canonical.confidence,
    state_vector: toJsonObject(canonical.stateVector),
    evidence_ledger: toJsonObject(canonical.evidenceLedger),
    dimension_ledger: toJsonObject(canonical.dimensionLedger),
    decision_ledger: toJsonObject(canonical.decisionLedger),
    baseline: toJsonObject(args.report.dynamicPattern.baseline),
    interpretation_limits: canonical.interpretationLimits.map(toJsonValue),
    engine_version: canonical.engineVersion,
  };
  const canonicalFields = {
    ...legacy,
    canonical_pattern_signature: canonical.canonicalPatternSignature,
    canonical_display_name: canonical.canonicalDisplayName,
    canonical_family: canonical.canonicalFamily,
    primary_family: canonical.primaryFamily,
    secondary_family: canonical.secondaryFamily,
    confidence_margin: canonical.confidenceMargin,
    reflection_source: toJsonObject(canonical.reflectionSource),
  };
  const matrixFields = {
    ...canonicalFields,
    organizing_quality: canonical.organizingQuality,
    result_type: canonical.resultType,
    naming_matrix_version: canonical.namingMatrixVersion,
    subpattern_scores: args.report.atlas.result.subpatterns.map(toJsonValue),
  };
  return [matrixFields, canonicalFields, legacy];
}

function canonicalPersistenceSchemaError(error: unknown) {
  if (!isDiagnosticsSchemaDriftError(error)) return null;
  const details = error instanceof Error ? error.message : typeof error === "object" && error ? JSON.stringify(error) : String(error);
  return new Error(
    `Canonical diagnostic persistence failed because the Supabase schema is behind the application. Apply migration 20260723033318_add_pattern_matrix_diagnostics.sql. Details: ${details}`,
  );
}

function assertJsonObjectField(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) {
    throw new Error(`Canonical diagnostic verification failed: ${field} was not saved.`);
  }
}

function verifyCanonicalDiagnostic(row: ScanInterpretationDiagnosticRow | null, args: PersistSoulScopeV2ResultArgs) {
  const canonical = args.report.canonicalPattern;
  if (!row) throw new Error("Canonical diagnostic verification failed: no diagnostic row was returned.");
  if (row.scan_id !== args.scanId) throw new Error("Canonical diagnostic verification failed: scan id mismatch.");
  if (row.canonical_display_name !== canonical.canonicalDisplayName) {
    throw new Error("Canonical diagnostic verification failed: canonical display name mismatch.");
  }
  if (row.canonical_pattern_signature !== canonical.canonicalPatternSignature) {
    throw new Error("Canonical diagnostic verification failed: canonical signature mismatch.");
  }
  if (!row.organizing_quality || !row.result_type || !row.naming_matrix_version) {
    throw new Error("Canonical diagnostic verification failed: naming matrix fields were not saved.");
  }
  assertJsonObjectField(row.state_vector, "state_vector");
  assertJsonObjectField(row.decision_ledger, "decision_ledger");
}

function verifyReflectionIdentity(rows: ReflectionVariantRow[], args: PersistSoulScopeV2ResultArgs) {
  const canonical = args.report.canonicalPattern;
  if (rows.length !== args.report.storyCandidates.length) {
    throw new Error("Reflection verification failed: not all reflection variants were saved.");
  }
  for (const row of rows) {
    const content = row.content as { canonicalDisplayName?: unknown; canonicalPatternSignature?: unknown } | null;
    if (content?.canonicalDisplayName !== canonical.canonicalDisplayName) {
      throw new Error("Reflection verification failed: canonical display name mismatch.");
    }
    if (content?.canonicalPatternSignature !== canonical.canonicalPatternSignature) {
      throw new Error("Reflection verification failed: canonical signature mismatch.");
    }
  }
}

async function upsertAndVerifyInterpretationDiagnostics(args: PersistSoulScopeV2ResultArgs) {
  const [payload] = diagnosticPayloadVariants(args);
  const response = await args.client
    .from("scan_interpretation_diagnostics")
    .upsert(payload, { onConflict: "scan_id" })
    .select(REQUIRED_DIAGNOSTIC_COLUMNS)
    .single();
  const schemaError = canonicalPersistenceSchemaError(response.error);
  if (schemaError) throw schemaError;
  throwIfError(response.error, "Could not save scan interpretation diagnostics");
  verifyCanonicalDiagnostic((response.data ?? null) as unknown as ScanInterpretationDiagnosticRow | null, args);
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
    const reflectionRows = await insertReflectionVariants(args.client, mapReflectionVariants(context));
    verifyReflectionIdentity(reflectionRows, args);
    await upsertAndVerifyInterpretationDiagnostics(args);
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
