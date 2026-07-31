import type { CanonicalEvidenceRecord } from "./canonicalResult";

export const CANONICAL_DIMENSION_ENGINE_VERSION = "canonical-dimension-engine-v0.1";
export const DIMENSION_REGISTRY_VERSION = "soulscope-constellation-bible-v0.1";

export type ConstellationId = "COG" | "REG" | "CAP" | "EXP";
export type BaselineTrust = "established" | "provisional" | "within_session" | "absent";
export type CanonicalDimensionId =
  | "COG-P1"
  | "COG-P2"
  | "COG-P3"
  | "COG-P4"
  | "REG-P1"
  | "REG-P2"
  | "REG-P3"
  | "REG-P4"
  | "CAP-P1"
  | "CAP-P2"
  | "CAP-P3"
  | "CAP-P4"
  | "EXP-P1"
  | "EXP-P2"
  | "EXP-P3"
  | "EXP-P4";

export type CanonicalDimensionRecord = {
  dimensionId: CanonicalDimensionId;
  constellation: ConstellationId;
  label: string;
  value: number;
  posterior: {
    mean: number;
    interval: { low: number; high: number };
  };
  confidence: number;
  uncertainty: number;
  evidenceCoverage: number;
  resolved: boolean;
  contradictionStrength: number;
  baselineTrust: BaselineTrust;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
  confounds: string[];
  allowedInferenceTier: "B";
  prohibitedInferences: string[];
  calculation: {
    ruleId: string;
    ruleVersion: string;
    registryVersion: string;
    requiredFamilies: string[];
    weights: Record<string, number>;
  };
};

type DimensionRule = {
  id: CanonicalDimensionId;
  constellation: ConstellationId;
  label: string;
  positive: string[];
  inverse: string[];
  requiredFamilies: string[];
  weights: Record<string, number>;
  confounds: string[];
};

const FEATURE_ALIASES: Record<string, string[]> = {
  speech_rate: ["voice.syllable_nuclei_rate"],
  pitch_range: ["voice.f0.range_semitones"],
  voiced_ratio: ["voice.phonation_time_ratio"],
  pitch_stability: ["voice.pitch_stability"],
  pitch_clarity: ["voice.pitch_clarity"],
  pause_mean: ["voice.pause.duration_mean"],
  spectral_flatness: ["voice.spectral_flatness"],
  harmonic_richness: ["voice.harmonic_richness"],
  f0_median: ["voice.f0.median"],
};

const FAMILY_BY_FEATURE: Record<string, string> = {
  speech_rate: "temporal",
  pitch_range: "prosody",
  voiced_ratio: "temporal",
  pitch_stability: "voice_quality",
  pitch_clarity: "voice_quality",
  pause_mean: "temporal",
  spectral_flatness: "spectral",
  harmonic_richness: "voice_quality",
  f0_median: "prosody",
};

const RULES: DimensionRule[] = [
  {
    id: "COG-P1",
    constellation: "COG",
    label: "Organization",
    positive: ["pitch_stability", "pitch_clarity"],
    inverse: ["pause_mean", "spectral_flatness"],
    requiredFamilies: ["temporal", "prosody_or_articulation"],
    weights: { pitch_stability: 0.28, pitch_clarity: 0.28, pause_mean: 0.22, spectral_flatness: 0.22 },
    confounds: ["reading_or_rehearsal", "language_rhythm", "vad_or_tracking_error"],
  },
  {
    id: "COG-P2",
    constellation: "COG",
    label: "Exploration",
    positive: ["pitch_range", "harmonic_richness", "spectral_flatness"],
    inverse: [],
    requiredFamilies: ["prosody", "temporal_or_spectral"],
    weights: { pitch_range: 0.36, harmonic_richness: 0.26, spectral_flatness: 0.18, speech_rate: 0.2 },
    confounds: ["open_ended_prompt", "multilingual_speech", "attention_interruption"],
  },
  {
    id: "COG-P3",
    constellation: "COG",
    label: "Focus Continuity",
    positive: ["voiced_ratio", "pitch_stability", "speech_rate"],
    inverse: ["pause_mean"],
    requiredFamilies: ["temporal", "prosody"],
    weights: { voiced_ratio: 0.3, pitch_stability: 0.28, speech_rate: 0.18, pause_mean: 0.24 },
    confounds: ["prompt_difficulty", "deliberate_contemplative_pauses", "external_interruption"],
  },
  {
    id: "COG-P4",
    constellation: "COG",
    label: "Processing Demand",
    positive: ["pause_mean", "spectral_flatness"],
    inverse: ["pitch_clarity", "pitch_stability"],
    requiredFamilies: ["temporal", "voice_quality_or_effort", "prosody"],
    weights: { pause_mean: 0.34, spectral_flatness: 0.24, pitch_clarity: 0.2, pitch_stability: 0.22 },
    confounds: ["prompt_complexity", "fatigue_or_illness", "second_language"],
  },
  {
    id: "REG-P1",
    constellation: "REG",
    label: "Activation",
    positive: ["speech_rate", "pitch_range", "voiced_ratio", "f0_median"],
    inverse: [],
    requiredFamilies: ["energy_or_temporal", "prosody", "spectral_or_onset"],
    weights: { speech_rate: 0.28, pitch_range: 0.28, voiced_ratio: 0.26, f0_median: 0.18 },
    confounds: ["microphone_gain", "cultural_style", "exercise_or_stimulant"],
  },
  {
    id: "REG-P2",
    constellation: "REG",
    label: "Stability",
    positive: ["pitch_stability", "pitch_clarity", "voiced_ratio"],
    inverse: ["spectral_flatness"],
    requiredFamilies: ["voice_quality", "timing_consistency"],
    weights: { pitch_stability: 0.32, pitch_clarity: 0.28, voiced_ratio: 0.2, spectral_flatness: 0.2 },
    confounds: ["voice_condition", "illness", "device_processing"],
  },
  {
    id: "REG-P3",
    constellation: "REG",
    label: "Flexibility",
    positive: ["pitch_range", "harmonic_richness", "speech_rate"],
    inverse: ["spectral_flatness"],
    requiredFamilies: ["prompt_modulation", "change_families"],
    weights: { pitch_range: 0.32, harmonic_richness: 0.28, speech_rate: 0.18, spectral_flatness: 0.22 },
    confounds: ["prompt_design", "acting_or_masking", "device_gain"],
  },
  {
    id: "REG-P4",
    constellation: "REG",
    label: "Recovery",
    positive: ["pitch_stability", "voiced_ratio", "harmonic_richness"],
    inverse: ["pause_mean", "spectral_flatness"],
    requiredFamilies: ["ordered_challenge_recovery", "temporal", "voice_quality"],
    weights: { pitch_stability: 0.24, voiced_ratio: 0.22, harmonic_richness: 0.18, pause_mean: 0.18, spectral_flatness: 0.18 },
    confounds: ["practice_effect", "prompt_order", "microphone_drift"],
  },
  {
    id: "CAP-P1",
    constellation: "CAP",
    label: "Mobilization",
    positive: ["voiced_ratio", "speech_rate", "pitch_range"],
    inverse: [],
    requiredFamilies: ["energy", "temporal", "prosody"],
    weights: { voiced_ratio: 0.34, speech_rate: 0.28, pitch_range: 0.24, harmonic_richness: 0.14 },
    confounds: ["mic_distance", "quiet_style", "vocal_rest_or_illness"],
  },
  {
    id: "CAP-P2",
    constellation: "CAP",
    label: "Reserve",
    positive: ["pitch_stability", "pitch_clarity", "harmonic_richness"],
    inverse: ["pause_mean", "spectral_flatness"],
    requiredFamilies: ["task_response", "stability_under_demand", "recovery"],
    weights: { pitch_stability: 0.24, pitch_clarity: 0.22, harmonic_richness: 0.18, pause_mean: 0.18, spectral_flatness: 0.18 },
    confounds: ["protocol_too_easy", "motivation", "unfamiliarity"],
  },
  {
    id: "CAP-P3",
    constellation: "CAP",
    label: "Effort Cost",
    positive: ["pause_mean", "spectral_flatness"],
    inverse: ["pitch_clarity", "harmonic_richness"],
    requiredFamilies: ["voice_quality_effort", "temporal", "instability"],
    weights: { pause_mean: 0.32, spectral_flatness: 0.28, pitch_clarity: 0.2, harmonic_richness: 0.2 },
    confounds: ["vocal_pathology", "dehydration", "recent_voice_use"],
  },
  {
    id: "CAP-P4",
    constellation: "CAP",
    label: "Sustainability",
    positive: ["pitch_stability", "voiced_ratio", "pitch_clarity"],
    inverse: ["pause_mean", "spectral_flatness"],
    requiredFamilies: ["time_on_task", "quality_slope", "recovery"],
    weights: { pitch_stability: 0.26, voiced_ratio: 0.22, pitch_clarity: 0.2, pause_mean: 0.16, spectral_flatness: 0.16 },
    confounds: ["warmup", "topic_change", "device_drift"],
  },
  {
    id: "EXP-P1",
    constellation: "EXP",
    label: "Range",
    positive: ["pitch_range", "harmonic_richness", "speech_rate"],
    inverse: [],
    requiredFamilies: ["variation", "prompt_modulation"],
    weights: { pitch_range: 0.42, harmonic_richness: 0.32, speech_rate: 0.26 },
    confounds: ["culture", "language", "professional_voice_use"],
  },
  {
    id: "EXP-P2",
    constellation: "EXP",
    label: "Openness",
    positive: ["voiced_ratio", "pitch_range", "speech_rate", "harmonic_richness"],
    inverse: ["pause_mean"],
    requiredFamilies: ["voiced_continuity", "modulation"],
    weights: { voiced_ratio: 0.26, pitch_range: 0.22, speech_rate: 0.2, harmonic_richness: 0.18, pause_mean: 0.14 },
    confounds: ["privacy_or_safety", "culture", "topic_sensitivity"],
  },
  {
    id: "EXP-P3",
    constellation: "EXP",
    label: "Restraint",
    positive: ["pause_mean", "pitch_stability"],
    inverse: ["pitch_range", "speech_rate"],
    requiredFamilies: ["containment", "context_contrast"],
    weights: { pause_mean: 0.34, pitch_stability: 0.24, pitch_range: 0.24, speech_rate: 0.18 },
    confounds: ["professional_context", "public_setting", "recording_discomfort"],
  },
  {
    id: "EXP-P4",
    constellation: "EXP",
    label: "Relational Availability",
    positive: ["voiced_ratio", "speech_rate", "harmonic_richness"],
    inverse: ["pause_mean"],
    requiredFamilies: ["latency_or_contingency", "prompt_modulation"],
    weights: { voiced_ratio: 0.32, speech_rate: 0.24, harmonic_richness: 0.24, pause_mean: 0.2 },
    confounds: ["automated_prompt", "neurotype", "language_or_hearing"],
  },
];

const NORMALIZATION: Record<string, { low: number; high: number }> = {
  speech_rate: { low: 70, high: 210 },
  pitch_range: { low: 2, high: 16 },
  voiced_ratio: { low: 0.2, high: 0.9 },
  pitch_stability: { low: 0.25, high: 0.92 },
  pitch_clarity: { low: 0.2, high: 0.95 },
  pause_mean: { low: 180, high: 1400 },
  spectral_flatness: { low: 0.02, high: 0.35 },
  harmonic_richness: { low: 0.15, high: 0.95 },
  f0_median: { low: 75, high: 260 },
};

const PROHIBITED = ["diagnosis", "truthfulness", "deception", "personality", "clinical_condition"];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function round(value: number) {
  return Number(clamp(value).toFixed(3));
}

function featureRecords(evidence: CanonicalEvidenceRecord[], featureKey: string) {
  const featureIds = FEATURE_ALIASES[featureKey] ?? [featureKey];
  return evidence.filter((record) => featureIds.includes(record.featureId));
}

function normalizedValue(record: CanonicalEvidenceRecord, featureKey: string) {
  if (record.measuredValue === null) return null;
  const bounds = NORMALIZATION[featureKey];
  if (!bounds) return clamp(record.measuredValue);
  return clamp((record.measuredValue - bounds.low) / Math.max(0.000001, bounds.high - bounds.low));
}

function weightedAverage(values: Array<{ value: number; weight: number }>) {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0.5;
  return values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function contradictionStrengthFor(args: {
  terms: Array<{ value: number; weight: number; confidence: number }>;
  value: number;
  coveredFamilies: Set<string>;
  contradictoryEvidence: string[];
}) {
  if (!args.contradictoryEvidence.length) return 0;
  const disagreements = args.terms
    .map((term) => Math.max(0, Math.abs(term.value - args.value) - 0.42) * term.confidence)
    .filter((value) => value > 0);
  const magnitude = disagreements.length ? Math.min(1, weightedAverage(disagreements.map((value) => ({ value, weight: 1 }))) / 0.58) : 0.2;
  const independence = Math.min(1, args.coveredFamilies.size / 4);
  const reliability = args.terms.length
    ? weightedAverage(args.terms.map((term) => ({ value: term.confidence, weight: term.weight })))
    : 0;
  return round(magnitude * 0.5 + reliability * 0.3 + independence * 0.2);
}

function featureKeyFromEvidenceId(evidenceId: string) {
  const found = Object.entries(FEATURE_ALIASES).find(([, ids]) =>
    ids.some((id) => evidenceId.includes(id)),
  );
  return found?.[0] ?? evidenceId;
}

export function buildCanonicalDimensions(evidence: CanonicalEvidenceRecord[]): CanonicalDimensionRecord[] {
  return RULES.map((rule) => {
    const terms: Array<{ featureKey: string; value: number; weight: number; evidenceId: string; confidence: number }> = [];
    const missingEvidence: string[] = [];
    const contradictoryEvidence: string[] = [];

    for (const featureKey of [...rule.positive, ...rule.inverse]) {
      const records = featureRecords(evidence, featureKey);
      const accepted = records.filter((record) => !record.missingEvidence && record.measuredValue !== null);
      const missing = records.filter((record) => record.missingEvidence);
      if (!accepted.length) {
        missingEvidence.push(`${rule.id}:${featureKey}`);
        missingEvidence.push(...missing.map((record) => record.evidenceId));
        continue;
      }
      const weight = rule.weights[featureKey] ?? 0;
      for (const record of accepted) {
        const normalized = normalizedValue(record, featureKey);
        if (normalized === null) continue;
        const directionalValue = rule.inverse.includes(featureKey) ? 1 - normalized : normalized;
        terms.push({
          featureKey,
          value: directionalValue,
          weight: weight / accepted.length,
          evidenceId: record.evidenceId,
          confidence: record.confidence,
        });
      }
    }

    const coveredFamilies = new Set(terms.map((term) => FAMILY_BY_FEATURE[term.featureKey] ?? term.featureKey));
    const evidenceCoverage = round(Math.min(1, coveredFamilies.size / Math.max(1, rule.requiredFamilies.length)));
    const value = round(weightedAverage(terms));
    const confidence = round((terms.length ? weightedAverage(terms.map((term) => ({ value: term.confidence, weight: term.weight }))) : 0) * evidenceCoverage);
    const uncertainty = round(1 - confidence);

    if (terms.some((term) => Math.abs(term.value - value) > 0.42)) {
      contradictoryEvidence.push(`${rule.id}:wide_feature_disagreement`);
    }
    const contradictionStrength = contradictionStrengthFor({ terms, value, coveredFamilies, contradictoryEvidence });
    const intervalWidth = Math.min(1, uncertainty);
    const resolved = evidenceCoverage >= 0.5
      && confidence >= 0.2
      && intervalWidth <= 0.8
      && contradictionStrength < 0.72;

    return {
      dimensionId: rule.id,
      constellation: rule.constellation,
      label: rule.label,
      value,
      posterior: {
        mean: value,
        interval: {
          low: round(Math.max(0, value - uncertainty / 2)),
          high: round(Math.min(1, value + uncertainty / 2)),
        },
      },
      confidence,
      uncertainty,
      evidenceCoverage,
      resolved,
      contradictionStrength,
      baselineTrust: "absent",
      supportingEvidence: Array.from(new Set(terms.map((term) => term.evidenceId))).sort(),
      contradictoryEvidence,
      missingEvidence: Array.from(new Set(missingEvidence)).sort(),
      confounds: rule.confounds,
      allowedInferenceTier: "B",
      prohibitedInferences: PROHIBITED,
      calculation: {
        ruleId: `dimension:${rule.id}`,
        ruleVersion: CANONICAL_DIMENSION_ENGINE_VERSION,
        registryVersion: DIMENSION_REGISTRY_VERSION,
        requiredFamilies: rule.requiredFamilies,
        weights: rule.weights,
      },
    };
  });
}

export function evidenceFeatureKeysForDimension(dimension: CanonicalDimensionRecord) {
  return Array.from(new Set(dimension.supportingEvidence.map(featureKeyFromEvidenceId))).sort();
}
