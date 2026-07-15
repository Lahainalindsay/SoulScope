import type { CaptureQuality, EvidenceSignal, RawFeatureMeasurement, SignalDirection, ValidityLevel } from "./types";
import { EVIDENCE_RULE_VERSION } from "./versions";

export type EvidenceDefinition = {
  id: string;
  label: string;
  version: string;
  requiredFeatures: string[];
  optionalFeatures: string[];
  contradictoryFeatures?: string[];
  minimumCaptureQuality: CaptureQuality;
  validityLevel: ValidityLevel;
  developerDescription: string;
  calculate: (features: Map<string, RawFeatureMeasurement>) => Pick<EvidenceSignal, "direction" | "strength" | "contributingFeatureIds" | "notes"> | null;
};

type WeightedValue = { id: string; value: number; weight: number };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const featureValue = (features: Map<string, RawFeatureMeasurement>, id: string) => features.get(id)?.value;
const directionFrom = (score: number, low = 0.4, high = 0.6): SignalDirection => score >= high ? "elevated" : score <= low ? "reduced" : "stable";

function normalized(features: Map<string, RawFeatureMeasurement>, id: string, transform: (value: number) => number, weight: number): WeightedValue | undefined {
  const raw = featureValue(features, id);
  if (raw === undefined || !Number.isFinite(raw)) return undefined;
  return { id, value: clamp(transform(raw)), weight };
}

function weighted(values: Array<WeightedValue | undefined>, minimum = 2) {
  const available = values.filter((item): item is WeightedValue => Boolean(item));
  if (available.length < minimum) return null;
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const score = available.reduce((sum, item) => sum + item.value * item.weight, 0) / Math.max(totalWeight, 0.001);
  return {
    score,
    ids: available.map((item) => item.id),
    strength: clamp(Math.abs(score - 0.5) * 2),
  };
}

function noteFeatures(features: Map<string, RawFeatureMeasurement>) {
  return Array.from(features.values()).filter((feature) => feature.featureId.startsWith("voice.note_energy."));
}

function normalizedEntropy(values: number[]) {
  const positive = values.map((value) => Math.max(0, value));
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || positive.length < 2) return 0;
  const entropy = positive.reduce((sum, value) => {
    const probability = value / total;
    return probability > 0 ? sum - probability * Math.log(probability) : sum;
  }, 0);
  return clamp(entropy / Math.log(positive.length));
}

export const EVIDENCE_DEFINITIONS: EvidenceDefinition[] = [
  {
    id: "vocal_activation",
    label: "Vocal activation",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.f0.median", "voice.spectral_centroid", "voice.active_frame_ratio", "voice.speech_rate_proxy", "voice.resonance_score"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes relative vocal activation from pitch, spectral brightness, active output, pacing, and resonance measures.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.f0.median", (value) => (value - 80) / 240, 0.16),
        normalized(features, "voice.spectral_centroid", (value) => value / 2600, 0.2),
        normalized(features, "voice.active_frame_ratio", (value) => value, 0.25),
        normalized(features, "voice.speech_rate_proxy", (value) => value / 180, 0.2),
        normalized(features, "voice.resonance_score", (value) => value, 0.19),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "vocal_stability",
    label: "Vocal stability",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: ["voice.pitch_clarity"],
    optionalFeatures: ["voice.pitch_stability", "voice.jitter", "voice.shimmer", "voice.formant_stability"],
    contradictoryFeatures: ["voice.formant_dynamics"],
    minimumCaptureQuality: "limited",
    validityLevel: "supported",
    developerDescription: "Combines pitch, cycle-level, amplitude, and formant stability rather than treating any one measure as decisive.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.pitch_clarity", (value) => value, 0.25),
        normalized(features, "voice.pitch_stability", (value) => value, 0.23),
        normalized(features, "voice.jitter", (value) => 1 - value / 5, 0.2),
        normalized(features, "voice.shimmer", (value) => 1 - value / 12, 0.17),
        normalized(features, "voice.formant_stability", (value) => value, 0.15),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "harmonic_clarity",
    label: "Harmonic clarity",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.hnr", "voice.harmonic_richness", "voice.spectral_flatness", "voice.zero_crossing_rate"],
    minimumCaptureQuality: "limited",
    validityLevel: "supported",
    developerDescription: "Describes harmonic organization using noise ratio, richness, spectral flatness, and crossing rate.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.hnr", (value) => (value + 5) / 25, 0.34),
        normalized(features, "voice.harmonic_richness", (value) => value, 0.3),
        normalized(features, "voice.spectral_flatness", (value) => 1 - value, 0.24),
        normalized(features, "voice.zero_crossing_rate", (value) => 1 - value / 0.25, 0.12),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "processing_pauses",
    label: "Processing pauses",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.pause.count", "voice.pause.duration_mean", "voice.pause.duration_max", "voice.pause.density", "voice.voiced_frame_ratio", "voice.speech_rate_proxy"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes pause amount, duration, density, and its relationship to voiced output and pacing.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.pause.density", (value) => value / 18, 0.25),
        normalized(features, "voice.pause.duration_mean", (value) => value / 1200, 0.2),
        normalized(features, "voice.pause.duration_max", (value) => value / 2400, 0.14),
        normalized(features, "voice.pause.count", (value) => value / 9, 0.13),
        normalized(features, "voice.voiced_frame_ratio", (value) => 1 - value, 0.16),
        normalized(features, "voice.speech_rate_proxy", (value) => 1 - value / 180, 0.12),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "expressive_variability",
    label: "Expressive variability",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.f0.range_semitones", "voice.f0.range_hz", "voice.formant_dynamics", "voice.pitch_stability", "voice.spectral_centroid"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes current expressive range across pitch, formant movement, and spectral variation.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.f0.range_semitones", (value) => value / 14, 0.32),
        normalized(features, "voice.f0.range_hz", (value) => value / 220, 0.14),
        normalized(features, "voice.formant_dynamics", (value) => value, 0.28),
        normalized(features, "voice.pitch_stability", (value) => 1 - value, 0.16),
        normalized(features, "voice.spectral_centroid", (value) => value / 2600, 0.1),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "vocal_energy",
    label: "Vocal energy",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.active_frame_ratio", "voice.voiced_frame_ratio", "voice.voiced_duration", "voice.resonance_score", "voice.speech_rate_proxy"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes available vocal output using active proportion, voiced proportion, duration, resonance, and pacing.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.active_frame_ratio", (value) => value, 0.26),
        normalized(features, "voice.voiced_frame_ratio", (value) => value, 0.25),
        normalized(features, "voice.voiced_duration", (value) => value / 45000, 0.16),
        normalized(features, "voice.resonance_score", (value) => value, 0.21),
        normalized(features, "voice.speech_rate_proxy", (value) => value / 180, 0.12),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "response_consistency",
    label: "Response consistency",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.pitch_stability", "voice.formant_stability", "voice.pitch_clarity", "voice.clipping_ratio", "voice.jitter", "voice.shimmer"],
    minimumCaptureQuality: "limited",
    validityLevel: "exploratory",
    developerDescription: "Describes consistency across independent pitch, formant, periodicity, amplitude, and capture measures.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.pitch_stability", (value) => value, 0.22),
        normalized(features, "voice.formant_stability", (value) => value, 0.2),
        normalized(features, "voice.pitch_clarity", (value) => value, 0.2),
        normalized(features, "voice.clipping_ratio", (value) => 1 - value * 5, 0.1),
        normalized(features, "voice.jitter", (value) => 1 - value / 5, 0.15),
        normalized(features, "voice.shimmer", (value) => 1 - value / 12, 0.13),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "speech_dynamics",
    label: "Speech dynamics",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.speech_rate_proxy", "voice.active_frame_ratio", "voice.f0.range_semitones", "voice.formant_dynamics", "voice.pause.density"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes how much movement is present across pace, active output, pitch range, formant movement, and pauses.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.speech_rate_proxy", (value) => value / 180, 0.2),
        normalized(features, "voice.active_frame_ratio", (value) => value, 0.2),
        normalized(features, "voice.f0.range_semitones", (value) => value / 14, 0.23),
        normalized(features, "voice.formant_dynamics", (value) => value, 0.23),
        normalized(features, "voice.pause.density", (value) => 1 - value / 20, 0.14),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "spectral_organization",
    label: "Spectral organization",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.spectral_flatness", "voice.spectral_centroid", "voice.harmonic_richness", "voice.hnr", "voice.formant_stability"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes organization across spectral shape, harmonic structure, and formant steadiness.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.spectral_flatness", (value) => 1 - value, 0.24),
        normalized(features, "voice.spectral_centroid", (value) => 1 - Math.abs(value - 1200) / 1800, 0.12),
        normalized(features, "voice.harmonic_richness", (value) => value, 0.24),
        normalized(features, "voice.hnr", (value) => (value + 5) / 25, 0.24),
        normalized(features, "voice.formant_stability", (value) => value, 0.16),
      ], 3);
      if (!result) return null;
      return { direction: directionFrom(result.score), strength: result.strength, contributingFeatureIds: result.ids };
    },
  },
  {
    id: "note_balance",
    label: "Signal balance",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: [],
    minimumCaptureQuality: "limited",
    validityLevel: "exploratory",
    developerDescription: "Describes concentration versus distribution across the existing note-energy representation.",
    calculate(features) {
      const notes = noteFeatures(features);
      if (notes.length < 4) return null;
      const sorted = notes.map((item) => item.value).sort((a, b) => b - a);
      const concentration = (sorted[0] ?? 0) + (sorted[1] ?? 0);
      const entropy = normalizedEntropy(notes.map((item) => item.value));
      const concentrationScore = clamp((concentration - 0.2) / 0.35);
      const score = clamp(concentrationScore * 0.65 + (1 - entropy) * 0.35);
      const direction = directionFrom(score, 0.36, 0.64);
      return {
        direction,
        strength: clamp(Math.abs(score - 0.5) * 2),
        contributingFeatureIds: notes.map((item) => item.featureId),
        notes: [direction === "elevated" ? "Energy is more concentrated across the existing note representation." : direction === "reduced" ? "Energy is more broadly distributed across the existing note representation." : "Energy is moderately distributed across the existing note representation."],
      };
    },
  },
  {
    id: "resonance_distribution",
    label: "Resonance distribution",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: ["voice.resonance_score"],
    optionalFeatures: [],
    minimumCaptureQuality: "limited",
    validityLevel: "exploratory",
    developerDescription: "Describes how broadly the existing note-energy representation is distributed while retaining the aggregate resonance score.",
    calculate(features) {
      const notes = noteFeatures(features);
      const resonance = featureValue(features, "voice.resonance_score");
      if (notes.length < 4 || resonance === undefined) return null;
      const entropy = normalizedEntropy(notes.map((item) => item.value));
      const spread = Math.max(...notes.map((item) => item.value)) - Math.min(...notes.map((item) => item.value));
      const score = clamp(entropy * 0.55 + clamp(resonance) * 0.25 + (1 - clamp(spread / 0.2)) * 0.2);
      return {
        direction: directionFrom(score),
        strength: clamp(Math.abs(score - 0.5) * 2),
        contributingFeatureIds: ["voice.resonance_score", ...notes.map((item) => item.featureId)],
        notes: [score >= 0.6 ? "The current resonance distribution is broad and comparatively even." : score <= 0.4 ? "The current resonance distribution is narrower and more concentrated." : "The current resonance distribution is moderately spread."],
      };
    },
  },
];