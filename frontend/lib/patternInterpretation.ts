import { buildEmotionDecisionLayer, type EmotionDecisionLayer } from "./emotionDecisionLayer";
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
  emotionLayer: EmotionDecisionLayer;
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
type CanonicalFeature = { value: number; confidence: number };
type FeatureMap = Record<string, CanonicalFeature>;

const LABELS: Record<DimensionKey, string> = {
  activation: "Activation",
  organization: "Organization",
  regulation: "Regulation",
  expression: "Expression",
  relationalOrientation: "Relational Orientation",
  direction: "Direction",
  capacity: "Capacity",
};
const STATES: Record<DimensionKey, [string, string, string, string]> = {
  activation: ["low", "settled", "elevated", "high"],
  organization: ["fragmenting", "searching", "coherent", "highly coherent"],
  regulation: ["strained", "effortful", "steady", "flexible"],
  expression: ["contained", "measured", "open", "forceful"],
  relationalOrientation: ["inward", "selective", "available", "connected"],
  direction: ["dispersed", "exploratory", "focused", "action-oriented"],
  capacity: ["taxed", "limited", "available", "sustained"],
};
const PATTERNS: Array<{ id: PatternFamily; name: string; target: Partial<StateVector> }> = [
  { id: "grounded", name: "The Grounded Navigator", target: { activation: 0.45, organization: 0.78, regulation: 0.8, capacity: 0.78, direction: 0.68 } },
  { id: "activated", name: "The Coherent Accelerator", target: { activation: 0.86, organization: 0.62, expression: 0.78, capacity: 0.48 } },
  { id: "reorganizing", name: "The Reorganizing Explorer", target: { activation: 0.62, organization: 0.28, regulation: 0.42, direction: 0.52 } },
  { id: "protective", name: "The Selective Protector", target: { activation: 0.42, relationalOrientation: 0.25, expression: 0.35, regulation: 0.6 } },
  { id: "overextended", name: "The Overextended Steward", target: { activation: 0.72, capacity: 0.25, regulation: 0.35, expression: 0.58 } },
  { id: "expressive", name: "The Open Communicator", target: { expression: 0.84, activation: 0.62, organization: 0.6 } },
  { id: "purposeful", name: "The Focused Navigator", target: { direction: 0.86, organization: 0.72, capacity: 0.65 } },
  { id: "recovering", name: "The Recovering Adapter", target: { regulation: 0.62, capacity: 0.58, activation: 0.46 } },
  { id: "reflective", name: "The Reflective Observer", target: { activation: 0.28, expression: 0.38, organization: 0.68 } },
  { id: "adaptive", name: "The Adaptive Integrator", target: { activation: 0.5, organization: 0.56, regulation: 0.56, expression: 0.55, direction: 0.56, capacity: 0.56 } },
];

const clamp = (value: number, min = 0, max = 1) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
const mean = (values: number[]) => values.length ? values.filter(Number.isFinite).reduce((sum, value) => sum + value, 0) / values.filter(Number.isFinite).length : 0;
const normalize = (value: number, low: number, high: number) => clamp((value - low) / Math.max(0.0001, high - low));
const round = (value: number) => Number(clamp(value).toFixed(3));
function addEvidence(ledger: EvidenceLedger, entry: EvidenceEntry) { ledger[entry.polarity].push({ ...entry, value: round(entry.value), confidence: round(entry.confidence) }); }
function acceptedCanonical(prompt: PromptAnalysis): FeatureMap {
  const map: FeatureMap = {};
  if (!prompt.canonicalAcoustic?.authoritative) return map;
  for (const item of prompt.canonicalAcoustic.measurements ?? []) {
    if (item.value === null || item.quality === "poor" || item.confidence < 0.35 || item.rejection_reason) continue;
    map[item.feature_id] = { value: item.value, confidence: item.confidence };
  }
  return map;
}
function promptFeature(prompt: PromptAnalysis, featureId: string, legacy: () => number | null): CanonicalFeature | null {
  const canonical = acceptedCanonical(prompt)[featureId];
  if (canonical) return canonical;
  if (prompt.canonicalAcoustic?.authoritative) return null;
  const value = legacy();
  return value === null ? null : { value, confidence: 0.45 };
}
function aggregate(prompts: PromptAnalysis[], featureId: string, legacy: (prompt: PromptAnalysis) => number | null): CanonicalFeature | null {
  const values = prompts.map((prompt) => promptFeature(prompt, featureId, () => legacy(prompt))).filter((item): item is CanonicalFeature => item !== null);
  return values.length ? { value: mean(values.map((item) => item.value)), confidence: mean(values.map((item) => item.confidence)) } : null;
}
function qualityLedger(scan: VoiceAnalysisResult, prompts: PromptAnalysis[]): EvidenceLedger["quality"] {
  const canonical = prompts.map((prompt) => prompt.canonicalAcoustic).filter((item) => item?.authoritative);
  if (canonical.length) {
    const confidence = mean(canonical.map((item) => item?.confidence ?? 0));
    return { usable: confidence >= 0.4, confidence: round(confidence), reasons: ["Authoritative canonical acoustic measurements were used."] };
  }
  const d = scan.voiceDynamics;
  if (!d) return { usable: false, confidence: 0.15, reasons: ["Acoustic evidence was unavailable."] };
  let confidence = d.captureQuality === "good" ? 0.68 : 0.42;
  if (d.voicedFrameRatio < 0.2) confidence -= 0.15;
  if (d.clippingFrameRatio > 0.05) confidence -= 0.14;
  return { usable: confidence >= 0.4, confidence: round(confidence), reasons: ["Legacy acoustic summaries were used because canonical measurements were unavailable."] };
}

export function buildEvidenceLedger(scan: VoiceAnalysisResult): EvidenceLedger {
  const prompts = scan.analysisDebug?.promptAnalyses ?? [];
  const ledger: EvidenceLedger = { supporting: [], contradictory: [], missing: [], quality: qualityLedger(scan, prompts) };
  const speechRate = aggregate(prompts, "voice.syllable_nuclei_rate", (p) => p.voiceDynamics?.speechRateProxyPerMin ?? null);
  const pitchRange = aggregate(prompts, "voice.f0.range_semitones", (p) => p.voiceDynamics?.pitchRangeSemitones ?? null);
  const voicedRatio = aggregate(prompts, "voice.phonation_time_ratio", (p) => p.voiceDynamics?.voicedFrameRatio ?? null);
  const pitchStability = aggregate(prompts, "voice.pitch_stability", (p) => p.voiceDynamics?.pitchStability ?? null);
  const pitchClarity = aggregate(prompts, "voice.pitch_clarity", (p) => p.voiceDynamics?.pitchClarity ?? null);
  const pauseMean = aggregate(prompts, "voice.pause.duration_mean", (p) => p.voiceDynamics?.averagePauseMs ?? null);
  const flatness = aggregate(prompts, "voice.spectral_flatness", (p) => p.voiceDynamics?.spectralFlatness ?? null);
  const richness = aggregate(prompts, "voice.harmonic_richness", (p) => p.voiceDynamics?.harmonicRichness ?? null);
  if (!speechRate || !pitchRange || !voicedRatio || !pitchStability || !pitchClarity || !pauseMean || !flatness || !richness) addEvidence(ledger, { id: "acoustic-evidence-limited", label: "Acoustic evidence incomplete", value: 1, confidence: 0.9, polarity: "missing", measurements: {}, prompts: [], longitudinal: false, rationale: "Rejected or unavailable measurements are not replaced by conflicting legacy values." });
  const activation = mean([speechRate ? normalize(speechRate.value, 90, 210) : 0.5, pitchRange ? normalize(pitchRange.value, 3, 15) : 0.5, voicedRatio ? normalize(voicedRatio.value, 0.55, 0.95) : 0.5]);
  addEvidence(ledger, { id: "acoustic-activation", label: "Acoustic activation", value: activation, confidence: mean([speechRate?.confidence ?? 0.35, pitchRange?.confidence ?? 0.35, voicedRatio?.confidence ?? 0.35]), polarity: "supporting", measurements: { speechRate: speechRate?.value ?? null, pitchRangeSemitones: pitchRange?.value ?? null, phonationRatio: voicedRatio?.value ?? null }, prompts: prompts.map((p) => `Prompt ${p.index + 1}`), longitudinal: false, rationale: "Activation is estimated from pace, pitch modulation, and phonation time." });
  const organization = mean([pitchStability?.value ?? 0.5, pitchClarity?.value ?? 0.5, pauseMean ? 1 - normalize(pauseMean.value, 200, 1100) : 0.5, flatness ? 1 - normalize(flatness.value, 0.02, 0.3) : 0.5]);
  addEvidence(ledger, { id: "acoustic-organization", label: "Acoustic organization", value: organization, confidence: mean([pitchStability?.confidence ?? 0.35, pitchClarity?.confidence ?? 0.35, pauseMean?.confidence ?? 0.35, flatness?.confidence ?? 0.35]), polarity: "supporting", measurements: { pitchStability: pitchStability?.value ?? null, pitchClarity: pitchClarity?.value ?? null, pauseMeanMs: pauseMean?.value ?? null, spectralFlatness: flatness?.value ?? null }, prompts: prompts.map((p) => `Prompt ${p.index + 1}`), longitudinal: false, rationale: "Organization is estimated from pitch reliability, pause timing, and spectral structure." });
  const expression = mean([pitchRange ? normalize(pitchRange.value, 3, 15) : 0.5, speechRate ? normalize(speechRate.value, 90, 210) : 0.5, richness ? normalize(richness.value, 0.35, 0.95) : 0.5]);
  addEvidence(ledger, { id: "acoustic-expression", label: "Acoustic expression", value: expression, confidence: mean([pitchRange?.confidence ?? 0.35, speechRate?.confidence ?? 0.35, richness?.confidence ?? 0.35]), polarity: "supporting", measurements: { pitchRangeSemitones: pitchRange?.value ?? null, speechRate: speechRate?.value ?? null, harmonicRichness: richness?.value ?? null }, prompts: prompts.map((p) => `Prompt ${p.index + 1}`), longitudinal: false, rationale: "Expression is estimated from prosodic range, pace, and harmonic structure." });
  if (prompts.length >= 3) {
    const [opening, challenge, future] = prompts;
    const features = (prompt: PromptAnalysis) => ({ range: promptFeature(prompt, "voice.f0.range_semitones", () => prompt.voiceDynamics?.pitchRangeSemitones ?? null), stability: promptFeature(prompt, "voice.pitch_stability", () => prompt.voiceDynamics?.pitchStability ?? null), phonation: promptFeature(prompt, "voice.phonation_time_ratio", () => prompt.voiceDynamics?.voicedFrameRatio ?? null) });
    const a = features(opening), b = features(challenge), c = features(future);
    if (a.range && a.stability && a.phonation && b.range && b.stability && b.phonation && c.range && c.stability && c.phonation) {
      const distance = (x: typeof a, y: typeof a) => mean([normalize(Math.abs(x.range!.value - y.range!.value), 0, 7), normalize(Math.abs(x.stability!.value - y.stability!.value), 0, 0.3), normalize(Math.abs(x.phonation!.value - y.phonation!.value), 0, 0.25)]);
      const challengeDistance = distance(a, b), futureDistance = distance(a, c);
      const recovery = challengeDistance > 0.08 ? clamp((challengeDistance - futureDistance) / challengeDistance) : 0.5;
      addEvidence(ledger, { id: "challenge-modulation", label: "Challenge modulation", value: challengeDistance, confidence: mean([opening.canonicalAcoustic?.confidence ?? 0.45, challenge.canonicalAcoustic?.confidence ?? 0.45]), polarity: "supporting", measurements: { challengeDistance: round(challengeDistance) }, prompts: ["Prompt 1", "Prompt 2"], longitudinal: false, rationale: "The challenge prompt is compared directly with the opening prompt." });
      addEvidence(ledger, { id: "within-scan-recovery", label: "Within-scan recovery", value: recovery, confidence: mean([opening.canonicalAcoustic?.confidence ?? 0.45, challenge.canonicalAcoustic?.confidence ?? 0.45, future.canonicalAcoustic?.confidence ?? 0.45]), polarity: "supporting", measurements: { challengeDistance: round(challengeDistance), futureDistance: round(futureDistance) }, prompts: ["Prompt 1", "Prompt 2", "Prompt 3"], longitudinal: false, rationale: "Recovery measures whether the future-oriented prompt moved toward the opening pattern after challenge modulation." });
    } else addEvidence(ledger, { id: "recovery-evidence-missing", label: "Recovery evidence unavailable", value: 1, confidence: 0.9, polarity: "missing", measurements: {}, prompts: [], longitudinal: false, rationale: "All three prompts need accepted measurements for recovery scoring." });
  } else addEvidence(ledger, { id: "recovery-evidence-missing", label: "Recovery evidence unavailable", value: 1, confidence: 0.9, polarity: "missing", measurements: {}, prompts: [], longitudinal: false, rationale: "Three prompts are required for recovery scoring." });
  if (!scan.protocolNotes?.camera || scan.protocolNotes.camera.trackingConfidence < 0.45) addEvidence(ledger, { id: "camera-evidence-missing", label: "Reliable camera evidence unavailable", value: 1, confidence: 0.9, polarity: "missing", measurements: {}, prompts: [], longitudinal: false, rationale: "Camera absence limits cross-modal confidence without invalidating voice evidence." });
  const subject = scan.scanMeta?.subject;
  if (!(subject?.subjectId && subject.historyEligible === true && (subject.identityConfidence ?? 0) >= 0.7)) addEvidence(ledger, { id: "personal-baseline-unavailable", label: "Personal baseline unavailable", value: 1, confidence: 1, polarity: "missing", measurements: {}, prompts: [], longitudinal: true, rationale: "Longitudinal claims remain disabled until eligible prior scans exist." });
  return ledger;
}
function evidenceValue(ledger: EvidenceLedger, id: string, fallback = 0.5) { return ledger.supporting.find((item) => item.id === id)?.value ?? fallback; }
function domain(domains: UserResultDomain[], title: UserResultDomain["title"]) { return (domains.find((item) => item.title === title)?.score ?? 50) / 100; }
function buildStateVector(ledger: EvidenceLedger, domains: UserResultDomain[]): StateVector {
  const activation = evidenceValue(ledger, "acoustic-activation"), organization = evidenceValue(ledger, "acoustic-organization"), expression = evidenceValue(ledger, "acoustic-expression"), recovery = evidenceValue(ledger, "within-scan-recovery");
  return { activation: round(activation), organization: round(organization), regulation: round(mean([organization, recovery, domain(domains, "Regulation")])), expression: round(expression), relationalOrientation: round(mean([expression, domain(domains, "Connection & Support")])), direction: round(mean([domain(domains, "Direction & Adaptability"), recovery])), capacity: round(mean([recovery, organization, domain(domains, "Recovery & Restoration")])) };
}
function stateFor(key: DimensionKey, value: number) { const states = STATES[key]; return value < 0.34 ? states[0] : value < 0.52 ? states[1] : value < 0.72 ? states[2] : states[3]; }
function buildDimensions(vector: StateVector, ledger: EvidenceLedger): DynamicPatternResult["dimensions"] {
  const ids: Record<DimensionKey, string[]> = { activation: ["acoustic-activation"], organization: ["acoustic-organization"], expression: ["acoustic-expression"], regulation: ["acoustic-organization", "within-scan-recovery"], relationalOrientation: ["acoustic-expression"], direction: ["within-scan-recovery"], capacity: ["acoustic-organization", "within-scan-recovery"] };
  const result = {} as DynamicPatternResult["dimensions"];
  for (const key of Object.keys(vector) as DimensionKey[]) {
    const supportingEvidence = ids[key].filter((id) => ledger.supporting.some((entry) => entry.id === id));
    const relevantMissing = ledger.missing.filter((entry) => key === "regulation" || key === "capacity" || key === "direction" ? entry.id === "recovery-evidence-missing" : entry.id === "acoustic-evidence-limited").map((entry) => entry.id);
    const confidenceEntries = ledger.supporting.filter((entry) => supportingEvidence.includes(entry.id));
    result[key] = { key, label: LABELS[key], state: stateFor(key, vector[key]), score: vector[key], confidence: round(confidenceEntries.length ? mean(confidenceEntries.map((entry) => entry.confidence)) : ledger.quality.confidence * 0.5), supportingEvidence, contradictoryEvidence: [], missingEvidence: relevantMissing };
  }
  return result;
}
function compatibility(vector: StateVector, target: Partial<StateVector>) { const entries = Object.entries(target) as Array<[DimensionKey, number]>; return round(1 - mean(entries.map(([key, value]) => Math.abs(vector[key] - value)))); }

export function buildDynamicPatternResult(scan: VoiceAnalysisResult, domains: UserResultDomain[], legacyCandidates: LegacyPatternCandidate[] = []): DynamicPatternResult {
  const evidenceLedger = buildEvidenceLedger(scan);
  const stateVector = buildStateVector(evidenceLedger, domains);
  const dimensions = buildDimensions(stateVector, evidenceLedger);
  const recovery = evidenceValue(evidenceLedger, "within-scan-recovery");
  const challengeModulation = evidenceValue(evidenceLedger, "challenge-modulation", 0.35);
  const emotionLayer = buildEmotionDecisionLayer({ ...stateVector, recovery, challengeModulation, evidenceConfidence: evidenceLedger.quality.confidence, evidenceIds: evidenceLedger.supporting.map((entry) => entry.id) });
  const pairBias = emotionLayer.pairs.loadCapacity.balance * 0.08 + emotionLayer.pairs.opennessProtection.balance * 0.05 + emotionLayer.pairs.activationRestoration.balance * 0.06;
  const alternatives = PATTERNS.map((pattern) => {
    let score = compatibility(stateVector, pattern.target);
    if (pattern.id === "overextended") score = clamp(score + Math.max(0, pairBias));
    if (pattern.id === "protective") score = clamp(score + Math.max(0, -emotionLayer.pairs.opennessProtection.balance) * 0.08);
    if (pattern.id === "recovering") score = clamp(score + Math.max(0, -emotionLayer.pairs.activationRestoration.balance) * 0.08);
    if (pattern.id === "expressive") score = clamp(score + Math.max(0, emotionLayer.pairs.expressionReflection.balance) * 0.08);
    if (pattern.id === "purposeful") score = clamp(score + Math.max(0, emotionLayer.pairs.certaintyFlexibility.balance) * 0.06);
    return { id: pattern.id, name: pattern.name, compatibility: round(score), supportingEvidence: [...evidenceLedger.supporting.map((entry) => entry.id), ...Object.keys(emotionLayer.emotions).map((id) => `emotion:${id}`), ...Object.keys(emotionLayer.pairs).map((id) => `pair:${id}`)], contradictoryEvidence: evidenceLedger.contradictory.map((entry) => entry.id), missingEvidence: evidenceLedger.missing.map((entry) => entry.id) };
  }).sort((a, b) => b.compatibility - a.compatibility);
  const selected = alternatives[0], family = selected.id, displayName = selected.name;
  const confidence = round(mean([evidenceLedger.quality.confidence, mean(Object.values(dimensions).map((item) => item.confidence)), selected.compatibility, emotionLayer.style.confidence]) - evidenceLedger.missing.length * 0.02);
  const subject = scan.scanMeta?.subject, subjectId = subject?.subjectId ?? null, identityConfidence = subject?.identityConfidence ?? 0;
  const comparisonAvailable = Boolean(subjectId && subject?.historyEligible === true && identityConfidence >= 0.7);
  const rejected = alternatives.slice(1, 5).map((candidate) => ({ id: candidate.id, name: candidate.name, reasons: [`Compatibility ${candidate.compatibility} ranked below selected compatibility ${selected.compatibility}.`] }));
  rejected.push(...legacyCandidates.slice(0, 3).map((candidate) => ({ id: `legacy:${candidate.id}`, name: candidate.name, reasons: [`Legacy profile score ${candidate.confidence.toFixed(3)} is retained for audit only and cannot override the canonical decision.`] })));
  return {
    family, dimensions, evidenceLedger, stateVector, emotionLayer,
    patternSignature: `${(Object.keys(dimensions) as DimensionKey[]).map((key) => `${key}:${dimensions[key].state}`).join("+")}+style:${emotionLayer.style.id}`,
    displayName, confidence,
    interpretationLimits: [...(!evidenceLedger.quality.usable ? ["Capture quality limits the strength of this interpretation."] : []), ...(evidenceLedger.missing.some((entry) => entry.id === "recovery-evidence-missing") ? ["Recovery is not described because accepted three-prompt evidence was unavailable."] : []), "Emotion scores are derived evidence dimensions, not direct measurements or diagnoses.", "The pattern describes measured signal relationships, not a diagnosis or fixed identity."],
    decisionLedger: { selected: `${displayName} from ${family} family with compatibility ${selected.compatibility}; emotion style ${emotionLayer.style.id}`, rejected, alternatives },
    baseline: { subjectId, comparisonAvailable, identityConfidence, deviationScore: null, changedDimensions: [] },
  };
}
