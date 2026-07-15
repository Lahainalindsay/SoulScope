import type { ObservationPipelineResult } from "../../../observationFramework/types";
import type { SoulScopeReport } from "../../../buildSoulScopeReport";
import type { ScanCompleteness } from "../../../partialScan";

export interface V2MappingContext {
  scanId: string;
  userId: string;
  report: SoulScopeReport;
  pipeline: ObservationPipelineResult;
  completeness: ScanCompleteness;
  rawResult: unknown;
  startedAt?: string | null;
  completedAt: string;
}
