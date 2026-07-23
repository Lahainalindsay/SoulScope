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

export const EVIDENCE_DEFINITIONS: EvidenceDefinition[] = [
  {
    id: "vocal_activation",
    label: "Vocal activation",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.f0.median", "voice.spectral_centroid", "voice.active_frame_ratio", "voice.speech_rate_proxy"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes relative vocal activation from pitch, spectral brightness, active output, and pacing measures.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.f0.median", (value) => (value - 80) / 240, 0.16),
        normalized(features, "voice.spectral_centroid", (value) => value / 2600, 0.2),
        normalized(features, "voice.active_frame_ratio", (value) => value, 0.25),
        normalized(features, "voice.speech_rate_proxy", (value) => value / 180, 0.2),
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
    optionalFeatures: ["voice.active_frame_ratio", "voice.voiced_frame_ratio", "voice.voiced_duration", "voice.speech_rate_proxy"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes available vocal output using active proportion, voiced proportion, duration, and pacing.",
    calculate(features) {
      const result = weighted([
        normalized(features, "voice.active_frame_ratio", (value) => value, 0.26),
        normalized(features, "voice.voiced_frame_ratio", (value) => value, 0.25),
        normalized(features, "voice.voiced_duration", (value) => value / 45000, 0.16),
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
];
