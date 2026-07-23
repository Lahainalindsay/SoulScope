import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { CanonicalFamilyCandidate } from "./canonicalPattern";
import type { PatternFamily, StateVector } from "./patternInterpretation";

export type ReviewAccuracy = "accurate" | "mostly_accurate" | "partially_accurate" | "inaccurate";

export type ReviewIdentityIssue =
  | "none"
  | "wrong_core_state"
  | "wrong_expression_style"
  | "wrong_organizing_quality"
  | "correct_state_wrong_name"
  | "reflection_mismatch"
  | "too_generic"
  | "too_specific"
  | "too_positive"
  | "too_negative"
  | "insufficiently_bounded";

export type ReviewExpectedDirection =
  | "more_protective"
  | "more_overextended"
  | "more_activated"
  | "more_reflective"
  | "more_grounded"
  | "more_reorganizing"
  | "more_recovering"
  | "more_adaptive"
  | "more_expressive"
  | "more_purposeful";

export type FounderReviewLabels = {
  overallAccuracy: ReviewAccuracy;
  identityIssue: ReviewIdentityIssue;
  expectedDirection?: ReviewExpectedDirection;
  notes?: string;
};

export type ScanPatternReviewContext = {
  scanId: string;
  canonicalDisplayName: string;
  primaryFamily: PatternFamily;
  secondaryFamily: PatternFamily | null;
  organizingQuality: string;
  stateVector: StateVector;
  dimensions: SoulScopeReport["canonicalPattern"]["dimensions"];
  evidenceLedger: SoulScopeReport["canonicalPattern"]["evidenceLedger"];
  topSubpatterns: Array<{ id: string; score: number }>;
  familyCandidates: CanonicalFamilyCandidate[];
  rejectedCandidates: SoulScopeReport["canonicalPattern"]["decisionLedger"]["rejected"];
  confidence: number;
  winningMargin: number;
  interpretationLimits: string[];
  founderReview?: FounderReviewLabels;
};

export function createPatternReviewContext(
  report: SoulScopeReport,
  scanId: string,
  founderReview?: FounderReviewLabels,
): ScanPatternReviewContext {
  const canonical = report.canonicalPattern;
  return {
    scanId,
    canonicalDisplayName: canonical.canonicalDisplayName,
    primaryFamily: canonical.primaryFamily,
    secondaryFamily: canonical.secondaryFamily,
    organizingQuality: canonical.organizingQuality,
    stateVector: canonical.stateVector,
    dimensions: canonical.dimensions,
    evidenceLedger: canonical.evidenceLedger,
    topSubpatterns: report.atlas.result.subpatterns,
    familyCandidates: canonical.decisionLedger.alternatives,
    rejectedCandidates: canonical.decisionLedger.rejected,
    confidence: canonical.confidence,
    winningMargin: canonical.confidenceMargin,
    interpretationLimits: canonical.interpretationLimits,
    founderReview,
  };
}
