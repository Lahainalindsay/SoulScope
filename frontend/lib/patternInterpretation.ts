import { type UserResultDomain } from "./systemDimensions";
import { type VoiceAnalysisResult } from "./voiceSpectrum";

export type PatternFamily =
  | "overextended"
  | "reflective"
  | "protective"
  | "adaptive"
  | "recovering"
  | "grounded"
  | "expressive"
  | "purposeful"
  | "activated"
  | "reorganizing";

export type EvidencePolarity = "supporting" | "contradictory" | "missing";

export type EvidenceEntry = {
  id: string;
  label: string;
  value: number;
  confidence: number;
  polarity: EvidencePolarity;
  measurements: Record<string, number | string | boolean | null>;
  prompts: string[];
  longitudinal: boolean;
  rationale: string;
};

export type EvidenceLedger = {
  supporting: EvidenceEntry[];
  contradictory: EvidenceEntry[];
  missing: EvidenceEntry[];
  quality: { usable: boolean; confidence: number; reasons: string[] };
};

export type StateVector = {
  activation: number;
  organization: number;
  regulation: number;
  expression: number;
  relationalOrientation: number;
  direction: number;
  capacity: number;
};

export type ScoredDimension = {
  key: keyof StateVector;
  label: string;
  state: string;
  score: number;
  confidence: number;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
};

export type DynamicPatternResult = {
  family: PatternFamily;
  dimensions: Record<keyof StateVector, ScoredDimension>;
  evidenceLedger: EvidenceLedger;
  stateVector: StateVector;
  patternSignature: string;
  displayName: string;
  confidence: number;
  interpretationLimits: string[];
  decisionLedger: {
    selected: string;
    rejected: Array<{ id: string; name: string; reasons: string[] }>;
    alternatives: Array<{
      id: string;
      name: string;
      compatibility: number;
      supportingEvidence: string[];
      contradictoryEvidence: string[];
      missingEvidence: string[];
    }>;
  };
  baseline: {
    subjectId: string | null;
    comparisonAvailable: boolean;
    identityConfidence: number;
    deviationScore: number | null;
    changedDimensions: string[];
  };
};

export type LegacyPatternCandidate = { id: string; name: string; confidence: number };

type PromptAnalysis = NonNullable<NonNullable<VoiceAnalysisResult["analysisDebug"]>["promptAnalyses"]>[number];
type DimensionKey = keyof StateVector;

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  activation: "Activation",
  organization: "Organization",
  regulation: "Regulation",
  expression: "Expression",
  relationalOrientation: "Relational Orientation",
  direction: "Direction",
  capacity: "Capacity",
};

const DIMENSION_STATES: Record<DimensionKey, [string, string, string, string]> = {
  activation: ["low", "settled", "elevated", "high"],
  organization: ["fragmenting", "searching", "coherent", "highly coherent"],
  regulation: ["strained", "effortful", "steady", "flexible"],
  expression: ["contained", "measured", "open", "forceful"],
  relationalOrientation: ["inward", "selective", "available", "connected"],
  direction: ["dispersed", "exploratory", "focused", "action-oriented"],
  capacity: ["taxed", "limited", "available", "sustained"],
};

function clamp(value: number, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function normalize(value: number, low: number, high: number) {
  return clamp((value - low) / Math.max(0.0001, high - low));
}

function round(value: number) {
  return Number(clamp(value).toFixed(3));
}

function addEvidence(ledger: EvidenceLedger, entry: EvidenceEntry) {
  ledger[entry.polarity].push({ ...entry, value: round(entry.value), confidence: round(entry.confidence) });
}

function qualityLedger(scan: VoiceAnalysisResult): EvidenceLedger["quality"] {
  const dynamics = scan.voiceDynamics;
  if (!dynamics) return { usable: false, confidence: 0.15, reasons: ["Voice dynamics were unavailable."] };

  let confidence = dynamics.captureQuality === "good" ? 0.84 : dynamics.captureQuality === "fair" ? 0.7 : 0.42;
  const reasons: string[] = [];
  if (dynamics.voicedFrameRatio < 0.2) {
    confidence -= 0.18;
    reasons.push("Voiced speech ratio was limited.");
  }
  if (dynamics.clippingFrameRatio > 0.05) {
    confidence -= 0.14;
    reasons.push("Clipping reduced feature reliability.");
  }
  if ((dynamics.pitchClarity ?? 0) < 0.45) {
    confidence -= 0.14;
    reasons.push("Pitch tracking clarity was limited.");
  }
  return {
    usable: confidence >= 0.4,
    confidence: round(confidence),
    reasons: reasons.length ? reasons : ["Capture quality supported a bounded acoustic interpretation."],
  };
}

function promptFeature(prompt: PromptAnalysis, key: "speechRate" | "pitchRange" | "pitchStability" | "voicedRatio" | "hnr") {
  const d = prompt.voiceDynamics;
  if (!d) return null;
  if (key === "speechRate") return d.speechRateProxyPerMin ?? null;
  if (key === "pitchRange") return d.pitchRangeSemitones ?? null;
  if (key === "pitchStability") return d.pitchStability ?? null;
  if (key === "voicedRatio") return d.voicedFrameRatio ?? null;
  return d.harmonicToNoiseRatioDb ?? null;
}

export function buildEvidenceLedger(scan: VoiceAnalysisResult): EvidenceLedger {
  const ledger: EvidenceLedger = { supporting: [], contradictory: [], missing: [], quality: qualityLedger(scan) };
  const d = scan.voiceDynamics;
  const prompts = scan.analysisDebug?.promptAnalyses ?? [];
  if (!d) {
    addEvidence(ledger, {
      id: "voice-dynamics-missing", label: "Voice dynamics unavailable", value: 1, confidence: 0.95,
      polarity: "missing", measurements: {}, prompts: [], longitudinal: false,
      rationale: "State dimensions cannot be scored without acoustic dynamics.",
    });
    return ledger;
  }

  const activation = mean([
    normalize(d.speechRateProxyPerMin ?? 0, 85, 190),
    normalize(d.pitchRangeSemitones ?? 0, 2.5, 10),
    normalize(d.voicedFrameRatio ?? 0, 0.28, 0.68),
  ]);
  addEvidence(ledger, {
    id: "acoustic-activation", label: activation >= 0.62 ? "Elevated acoustic activation" : activation <= 0.38 ? "Lower acoustic activation" : "Moderate acoustic activation",
    value: activation, confidence: ledger.quality.confidence, polarity: "supporting",
    measurements: { speechRateProxyPerMin: d.speechRateProxyPerMin ?? null, pitchRangeSemitones: d.pitchRangeSemitones ?? null, voicedFrameRatio: d.voicedFrameRatio ?? null },
    prompts: [], longitudinal: false, rationale: "Speech rate, pitch range, and voiced activity jointly estimate activation.",
  });

  const organization = mean([
    d.pitchStability ?? 0,
    d.pitchClarity ?? 0,
    1 - normalize(d.averagePauseMs ?? 0, 250, 1200),
    1 - normalize(d.spectralFlatness ?? 0, 0.02, 0.35),
  ]);
  addEvidence(ledger, {
    id: "acoustic-organization", label: organization >= 0.62 ? "Organized vocal patterning" : organization <= 0.38 ? "Variable vocal organization" : "Mixed vocal organization",
    value: organization, confidence: ledger.quality.confidence, polarity: "supporting",
    measurements: { pitchStability: d.pitchStability ?? null, pitchClarity: d.pitchClarity ?? null, averagePauseMs: d.averagePauseMs ?? null, spectralFlatness: d.spectralFlatness ?? null },
    prompts: [], longitudinal: false, rationale: "Pitch consistency, clarity, pause timing, and spectral structure estimate organization.",
  });

  const expression = mean([
    normalize(d.pitchRangeSemitones ?? 0, 2, 9),
    normalize(d.speechRateProxyPerMin ?? 0, 80, 185),
    normalize(d.harmonicRichness ?? 0, 0.35, 0.95),
  ]);
  addEvidence(ledger, {
    id: "acoustic-expression", label: expression >= 0.62 ? "Open vocal expression" : expression <= 0.38 ? "Measured vocal expression" : "Moderate vocal expression",
    value: expression, confidence: ledger.quality.confidence, polarity: "supporting",
    measurements: { pitchRangeSemitones: d.pitchRangeSemitones ?? null, speechRateProxyPerMin: d.speechRateProxyPerMin ?? null, harmonicRichness: d.harmonicRichness ?? null },
    prompts: [], longitudinal: false, rationale: "Prosodic range, pace, and harmonic richness estimate expressive availability.",
  });

  if (prompts.length >= 3) {
    const [baseline, challenge, hope] = prompts;
    const baseRate = promptFeature(baseline, "speechRate");
    const challengeRate = promptFeature(challenge, "speechRate");
    const hopeRate = promptFeature(hope, "speechRate");
    const baseRange = promptFeature(baseline, "pitchRange");
    const challengeRange = promptFeature(challenge, "pitchRange");
    const hopeRange = promptFeature(hope, "pitchRange");
    const baseStability = promptFeature(baseline, "pitchStability");
    const challengeStability = promptFeature(challenge, "pitchStability");
    const hopeStability = promptFeature(hope, "pitchStability");

    const complete = [baseRate, challengeRate, hopeRate, baseRange, challengeRange, hopeRange, baseStability, challengeStability, hopeStability].every((v) => v !== null);
    if (complete) {
      const challengeShift = mean([
        normalize(Math.abs((challengeRate as number) - (baseRate as number)), 8, 55),
        normalize(Math.abs((challengeRange as number) - (baseRange as number)), 0.8, 5.5),
        normalize(Math.abs((challengeStability as number) - (baseStability as number)), 0.04, 0.3),
      ]);
      addEvidence(ledger, {
        id: "challenge-modulation", label: challengeShift >= 0.55 ? "Clear challenge modulation" : "Limited challenge modulation",
        value: challengeShift, confidence: mean([baseline.canonicalAcoustic?.confidence ?? ledger.quality.confidence, challenge.canonicalAcoustic?.confidence ?? ledger.quality.confidence]),
        polarity: "supporting", measurements: { baselineSpeechRate: baseRate, challengeSpeechRate: challengeRate, baselinePitchRange: baseRange, challengePitchRange: challengeRange },
        prompts: ["Prompt 1", "Prompt 2"], longitudinal: false,
        rationale: "The challenge condition is compared directly with the opening condition.",
      });

      const challengeDistance = mean([
        normalize(Math.abs((challengeRate as number) - (baseRate as number)), 0, 55),
        normalize(Math.abs((challengeRange as number) - (baseRange as number)), 0, 5.5),
        normalize(Math.abs((challengeStability as number) - (baseStability as number)), 0, 0.3),
      ]);
      const hopeDistance = mean([
        normalize(Math.abs((hopeRate as number) - (baseRate as number)), 0, 55),
        normalize(Math.abs((hopeRange as number) - (baseRange as number)), 0, 5.5),
        normalize(Math.abs((hopeStability as number) - (baseStability as number)), 0, 0.3),
      ]);
      const recovery = challengeDistance > 0.08 ? clamp((challengeDistance - hopeDistance) / challengeDistance) : 0.5;
      addEvidence(ledger, {
        id: "within-scan-recovery", label: recovery >= 0.58 ? "Movement toward opening pattern" : recovery <= 0.32 ? "Limited return toward opening pattern" : "Partial return toward opening pattern",
        value: recovery, confidence: mean(prompts.slice(0, 3).map((p) => p.canonicalAcoustic?.confidence ?? ledger.quality.confidence)),
        polarity: "supporting", measurements: { challengeDistance: round(challengeDistance), hopeDistance: round(hopeDistance) },
        prompts: ["Prompt 1", "Prompt 2", "Prompt 3"], longitudinal: false,
        rationale: "Recovery is scored only from the future-oriented prompt moving toward the opening prompt after challenge modulation.",
      });
    } else {
      addEvidence(ledger, {
        id: "recovery-evidence-missing", label: "Recovery evidence unavailable", value: 1, confidence: 0.85,
        polarity: "missing", measurements: {}, prompts: [], longitudinal: false,
        rationale: "All three prompt summaries are required for within-scan recovery scoring.",
      });
    }
  } else {
    addEvidence(ledger, {
      id: "recovery-evidence-missing", label: "Recovery evidence unavailable", value: 1, confidence: 0.85,
      polarity: "missing", measurements: {}, prompts: [], longitudinal: false,
      rationale: "Three prompt summaries are required for within-scan recovery scoring.",
    });
  }

  const camera = scan.protocolNotes?.camera;
  if (!camera || camera.trackingConfidence < 0.45) {
    addEvidence(ledger, {
      id: "camera-evidence-missing", label: "Reliable camera evidence unavailable", value: 1, confidence: 0.9,
      polarity: "missing", measurements: { trackingConfidence: camera?.trackingConfidence ?? null }, prompts: [], longitudinal: false,
      rationale: "Camera absence limits cross-modal confidence but does not invalidate voice evidence.",
    });
  }

  const subject = scan.scanMeta?.subject;
  if (!(subject?.subjectId && subject.historyEligible === true && (subject.identityConfidence ?? 0) >= 0.7)) {
    addEvidence(ledger, {
      id: "personal-baseline-unavailable", label: "Longitudinal personal baseline unavailable", value: 1, confidence: 1,
      polarity: "missing", measurements: {}, prompts: [], longitudinal: true,
      rationale: "Trend and deviation claims remain disabled until eligible prior scans exist.",
    });
  }

  return ledger;
}

function evidence(ledger: EvidenceLedger, id: string) {
  return ledger.supporting.find((entry) => entry.id === id);
}

function domainScore(domains: UserResultDomain[], title: UserResultDomain["title"]) {
  return (domains.find((domain) => domain.title === title)?.score ?? 50) / 100;
}

function buildStateVector(ledger: EvidenceLedger, domains: UserResultDomain[]): StateVector {
  const activation = evidence(ledger, "acoustic-activation")?.value ?? 0.5;
  const organization = evidence(ledger, "acoustic-organization")?.value ?? 0.5;
  const expression = evidence(ledger, "acoustic-expression")?.value ?? 0.5;
  const challenge = evidence(ledger, "challenge-modulation")?.value ?? 0.35;
  const recoveryEntry = evidence(ledger, "within-scan-recovery");
  const recovery = recoveryEntry?.value;

  return {
    activation: round(activation),
    organization: round(organization),
    regulation: round(recovery === undefined ? mean([organization, 1 - challenge * 0.45, domainScore(domains, "Regulation")]) : mean([organization, recovery, 1 - challenge * 0.35])),
    expression: round(expression),
    relationalOrientation: round(mean([expression, organization, domainScore(domains, "Communication & Clarity")])),
    direction: round(mean([organization, domainScore(domains, "Direction & Adaptability"), 1 - challenge * 0.2])),
    capacity: round(recovery === undefined ? mean([organization, domainScore(domains, "Recovery & Restoration")]) : mean([organization, recovery, domainScore(domains, "Recovery & Restoration")])),
  };
}

function stateFor(key: DimensionKey, score: number) {
  const [low, midLow, midHigh, high] = DIMENSION_STATES[key];
  if (score < 0.34) return low;
  if (score < 0.52) return midLow;
  if (score < 0.72) return midHigh;
  return high;
}

const DIMENSION_EVIDENCE: Record<DimensionKey, { support: string[]; contradict: string[]; missing: string[] }> = {
  activation: { support: ["acoustic-activation"], contradict: [], missing: [] },
  organization: { support: ["acoustic-organization"], contradict: [], missing: [] },
  regulation: { support: ["acoustic-organization", "within-scan-recovery", "challenge-modulation"], contradict: [], missing: ["recovery-evidence-missing"] },
  expression: { support: ["acoustic-expression"], contradict: [], missing: [] },
  relationalOrientation: { support: ["acoustic-expression", "acoustic-organization"], contradict: [], missing: ["camera-evidence-missing"] },
  direction: { support: ["acoustic-organization", "challenge-modulation"], contradict: [], missing: [] },
  capacity: { support: ["acoustic-organization", "within-scan-recovery"], contradict: [], missing: ["recovery-evidence-missing"] },
};

function buildDimensions(vector: StateVector, ledger: EvidenceLedger): DynamicPatternResult["dimensions"] {
  return (Object.keys(vector) as DimensionKey[]).reduce((result, key) => {
    const map = DIMENSION_EVIDENCE[key];
    const supporting = map.support.filter((id) => evidence(ledger, id));
    const contradictory = map.contradict.filter((id) => evidence(ledger, id));
    const missing = map.missing.filter((id) => ledger.missing.some((entry) => entry.id === id));
    const evidenceConfidence = supporting.map((id) => evidence(ledger, id)?.confidence ?? 0);
    const confidence = evidenceConfidence.length ? mean(evidenceConfidence) : ledger.quality.confidence * 0.55;
    result[key] = {
      key, label: DIMENSION_LABELS[key], state: stateFor(key, vector[key]), score: round(vector[key]),
      confidence: round(confidence * (missing.length ? 0.78 : 1)),
      supportingEvidence: supporting, contradictoryEvidence: contradictory, missingEvidence: missing,
    };
    return result;
  }, {} as DynamicPatternResult["dimensions"]);
}

type Candidate = { id: PatternFamily; name: string; score: (v: StateVector) => number; evidence: DimensionKey[] };
const CANDIDATES: Candidate[] = [
  { id: "grounded", name: "The Grounded Navigator", score: (v) => mean([v.organization, v.regulation, v.capacity, 1 - Math.abs(v.activation - 0.45)]), evidence: ["organization", "regulation", "capacity"] },
  { id: "adaptive", name: "The Adaptive Integrator", score: (v) => mean([v.organization, v.regulation, v.direction, v.expression]), evidence: ["organization", "regulation", "direction", "expression"] },
  { id: "activated", name: "The Coherent Accelerator", score: (v) => mean([v.activation, v.organization, v.direction, 1 - v.capacity * 0.35]), evidence: ["activation", "organization", "direction"] },
  { id: "protective", name: "The Selective Protector", score: (v) => mean([1 - v.relationalOrientation, v.regulation, 1 - v.expression]), evidence: ["relationalOrientation", "regulation", "expression"] },
  { id: "overextended", name: "The Overextended Steward", score: (v) => mean([v.activation, 1 - v.capacity, 1 - v.regulation]), evidence: ["activation", "capacity", "regulation"] },
  { id: "reorganizing", name: "The Reorganizing Explorer", score: (v) => mean([1 - v.organization, 1 - v.regulation, v.activation]), evidence: ["organization", "regulation", "activation"] },
  { id: "expressive", name: "The Open Signal", score: (v) => mean([v.expression, v.relationalOrientation, v.activation]), evidence: ["expression", "relationalOrientation", "activation"] },
  { id: "purposeful", name: "The Focused Navigator", score: (v) => mean([v.direction, v.organization, v.capacity]), evidence: ["direction", "organization", "capacity"] },
  { id: "recovering", name: "The Recovering Adapter", score: (v) => mean([v.regulation, v.capacity, 1 - v.activation * 0.35]), evidence: ["regulation", "capacity"] },
  { id: "reflective", name: "The Reflective Observer", score: (v) => mean([1 - v.activation, v.organization, 1 - v.expression * 0.35]), evidence: ["activation", "organization", "expression"] },
];

function buildPatternSignature(dimensions: DynamicPatternResult["dimensions"]) {
  return [
    `activation:${dimensions.activation.state}`, `organization:${dimensions.organization.state}`,
    `regulation:${dimensions.regulation.state}`, `expression:${dimensions.expression.state}`,
    `relationship:${dimensions.relationalOrientation.state}`, `direction:${dimensions.direction.state}`,
    `capacity:${dimensions.capacity.state}`,
  ].join("+");
}

function scoreCandidates(vector: StateVector, dimensions: DynamicPatternResult["dimensions"], ledger: EvidenceLedger) {
  return CANDIDATES.map((candidate) => {
    const dimensionConfidence = mean(candidate.evidence.map((key) => dimensions[key].confidence));
    const raw = candidate.score(vector);
    const compatibility = round(raw * (0.72 + dimensionConfidence * 0.28));
    return {
      id: candidate.id,
      name: candidate.name,
      compatibility,
      supportingEvidence: Array.from(new Set(candidate.evidence.flatMap((key) => dimensions[key].supportingEvidence))),
      contradictoryEvidence: Array.from(new Set(candidate.evidence.flatMap((key) => dimensions[key].contradictoryEvidence))),
      missingEvidence: Array.from(new Set(candidate.evidence.flatMap((key) => dimensions[key].missingEvidence))),
    };
  }).sort((a, b) => b.compatibility - a.compatibility || a.id.localeCompare(b.id));
}

function confidenceFor(selectedCompatibility: number, runnerUpCompatibility: number, dimensions: DynamicPatternResult["dimensions"], ledger: EvidenceLedger) {
  const dimensionConfidence = mean(Object.values(dimensions).map((item) => item.confidence));
  const margin = clamp((selectedCompatibility - runnerUpCompatibility) / 0.2);
  return round(mean([ledger.quality.confidence, dimensionConfidence, selectedCompatibility, margin]));
}

export function buildDynamicPatternResult(scan: VoiceAnalysisResult, domains: UserResultDomain[], legacyCandidates: LegacyPatternCandidate[] = []): DynamicPatternResult {
  const evidenceLedger = buildEvidenceLedger(scan);
  const stateVector = buildStateVector(evidenceLedger, domains);
  const dimensions = buildDimensions(stateVector, evidenceLedger);
  const alternatives = scoreCandidates(stateVector, dimensions, evidenceLedger);
  const selected = alternatives[0];
  const runnerUp = alternatives[1] ?? selected;
  const family = selected.id;
  const displayName = selected.name;
  const confidence = confidenceFor(selected.compatibility, runnerUp.compatibility, dimensions, evidenceLedger);
  const subject = scan.scanMeta?.subject;
  const subjectId = subject?.subjectId ?? null;
  const identityConfidence = subject?.identityConfidence ?? 0;
  const comparisonAvailable = Boolean(subjectId && subject?.historyEligible === true && identityConfidence >= 0.7);

  return {
    family, dimensions, evidenceLedger, stateVector,
    patternSignature: buildPatternSignature(dimensions), displayName, confidence,
    interpretationLimits: [
      ...(!evidenceLedger.quality.usable ? ["Capture quality limits the strength of this interpretation."] : []),
      ...(evidenceLedger.missing.some((entry) => entry.id === "recovery-evidence-missing") ? ["Recovery is not described because the three-condition comparison was incomplete."] : []),
      ...(comparisonAvailable ? [] : ["Longitudinal deviation and trend remain unavailable until an eligible personal baseline exists."]),
      "The pattern describes measured signal relationships, not a diagnosis or fixed identity.",
    ],
    decisionLedger: {
      selected: `${displayName} from ${family} family with compatibility ${selected.compatibility}`,
      rejected: alternatives.slice(1, 5).map((candidate) => ({
        id: candidate.id, name: candidate.name,
        reasons: [
          `Compatibility ${candidate.compatibility} ranked below selected compatibility ${selected.compatibility}.`,
          ...(candidate.missingEvidence.length ? [`Missing evidence reduced confidence: ${candidate.missingEvidence.join(", ")}.`] : []),
        ],
      })).concat(legacyCandidates.slice(0, 3).map((candidate) => ({
        id: `legacy:${candidate.id}`, name: candidate.name,
        reasons: [`Legacy profile score ${candidate.confidence.toFixed(3)} is retained for audit only and cannot override the canonical decision.`],
      }))),
      alternatives,
    },
    baseline: { subjectId, comparisonAvailable, identityConfidence, deviationScore: null, changedDimensions: [] },
  };
}
