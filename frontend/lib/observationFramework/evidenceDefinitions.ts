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

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const value = (features: Map<string, RawFeatureMeasurement>, id: string) => features.get(id)?.value;
const available = (...values: Array<number | undefined>) => values.filter((item): item is number => Number.isFinite(item));
const directionFrom = (score: number, low = 0.38, high = 0.62): SignalDirection => score >= high ? "elevated" : score <= low ? "reduced" : "stable";

export const EVIDENCE_DEFINITIONS: EvidenceDefinition[] = [
  {
    id: "vocal_activation",
    label: "Vocal activation",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.f0.median", "voice.spectral_centroid", "voice.active_frame_ratio"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes relative vocal activation from available pitch, spectral brightness, and active-frame measures.",
    calculate(features) {
      const values = available(
        value(features, "voice.f0.median") ? clamp((value(features, "voice.f0.median")! - 85) / 255) : undefined,
        value(features, "voice.spectral_centroid") ? clamp(value(features, "voice.spectral_centroid")! / 2500) : undefined,
        value(features, "voice.active_frame_ratio"),
      );
      if (values.length < 2) return null;
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.f0.median", "voice.spectral_centroid", "voice.active_frame_ratio"].filter((id) => features.has(id)) };
    },
  },
  {
    id: "vocal_stability",
    label: "Vocal stability",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: ["voice.pitch_clarity"],
    optionalFeatures: ["voice.pitch_stability", "voice.jitter", "voice.shimmer"],
    minimumCaptureQuality: "limited",
    validityLevel: "supported",
    developerDescription: "Combines pitch clarity and stability with cycle-level variation when available.",
    calculate(features) {
      const clarity = value(features, "voice.pitch_clarity");
      if (clarity === undefined) return null;
      const values = available(clarity, value(features, "voice.pitch_stability"), value(features, "voice.jitter") !== undefined ? 1 - clamp(value(features, "voice.jitter")! / 5) : undefined, value(features, "voice.shimmer") !== undefined ? 1 - clamp(value(features, "voice.shimmer")! / 12) : undefined);
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.pitch_clarity", "voice.pitch_stability", "voice.jitter", "voice.shimmer"].filter((id) => features.has(id)) };
    },
  },
  {
    id: "harmonic_clarity",
    label: "Harmonic clarity",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.hnr", "voice.harmonic_richness", "voice.spectral_flatness"],
    minimumCaptureQuality: "limited",
    validityLevel: "supported",
    developerDescription: "Describes organization of harmonic versus noise-like energy.",
    calculate(features) {
      const values = available(value(features, "voice.hnr") !== undefined ? clamp((value(features, "voice.hnr")! + 5) / 25) : undefined, value(features, "voice.harmonic_richness"), value(features, "voice.spectral_flatness") !== undefined ? 1 - clamp(value(features, "voice.spectral_flatness")!) : undefined);
      if (values.length < 2) return null;
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.hnr", "voice.harmonic_richness", "voice.spectral_flatness"].filter((id) => features.has(id)) };
    },
  },
  {
    id: "processing_pauses",
    label: "Processing pauses",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.pause.count", "voice.pause.duration_mean", "voice.pause.density", "voice.voiced_frame_ratio"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes the amount and density of pause behavior without assigning cause.",
    calculate(features) {
      const values = available(value(features, "voice.pause.density") !== undefined ? clamp(value(features, "voice.pause.density")! / 18) : undefined, value(features, "voice.pause.duration_mean") !== undefined ? clamp(value(features, "voice.pause.duration_mean")! / 1200) : undefined, value(features, "voice.pause.count") !== undefined ? clamp(value(features, "voice.pause.count")! / 8) : undefined, value(features, "voice.voiced_frame_ratio") !== undefined ? 1 - clamp(value(features, "voice.voiced_frame_ratio")!) : undefined);
      if (values.length < 2) return null;
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.pause.count", "voice.pause.duration_mean", "voice.pause.density", "voice.voiced_frame_ratio"].filter((id) => features.has(id)) };
    },
  },
  {
    id: "expressive_variability",
    label: "Expressive variability",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.f0.range_semitones", "voice.formant_dynamics", "voice.pitch_stability"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes current range and variation in vocal expression.",
    calculate(features) {
      const values = available(value(features, "voice.f0.range_semitones") !== undefined ? clamp(value(features, "voice.f0.range_semitones")! / 12) : undefined, value(features, "voice.formant_dynamics"), value(features, "voice.pitch_stability") !== undefined ? 1 - clamp(value(features, "voice.pitch_stability")!) : undefined);
      if (values.length < 2) return null;
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.f0.range_semitones", "voice.formant_dynamics", "voice.pitch_stability"].filter((id) => features.has(id)) };
    },
  },
  {
    id: "vocal_energy",
    label: "Vocal energy",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.active_frame_ratio", "voice.voiced_frame_ratio", "voice.voiced_duration", "voice.resonance_score"],
    minimumCaptureQuality: "limited",
    validityLevel: "emerging",
    developerDescription: "Describes available vocal output using duration and active/voiced proportions.",
    calculate(features) {
      const values = available(value(features, "voice.active_frame_ratio"), value(features, "voice.voiced_frame_ratio"), value(features, "voice.resonance_score"));
      if (values.length < 2) return null;
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.active_frame_ratio", "voice.voiced_frame_ratio", "voice.voiced_duration", "voice.resonance_score"].filter((id) => features.has(id)) };
    },
  },
  {
    id: "response_consistency",
    label: "Response consistency",
    version: EVIDENCE_RULE_VERSION,
    requiredFeatures: [],
    optionalFeatures: ["voice.pitch_stability", "voice.formant_stability", "voice.clipping_ratio", "voice.pitch_clarity"],
    minimumCaptureQuality: "limited",
    validityLevel: "exploratory",
    developerDescription: "Describes consistency across available signal-organization measures.",
    calculate(features) {
      const values = available(value(features, "voice.pitch_stability"), value(features, "voice.formant_stability"), value(features, "voice.pitch_clarity"), value(features, "voice.clipping_ratio") !== undefined ? 1 - clamp(value(features, "voice.clipping_ratio")! * 4) : undefined);
      if (values.length < 2) return null;
      const score = values.reduce((a, b) => a + b, 0) / values.length;
      return { direction: directionFrom(score), strength: Math.abs(score - 0.5) * 2, contributingFeatureIds: ["voice.pitch_stability", "voice.formant_stability", "voice.pitch_clarity", "voice.clipping_ratio"].filter((id) => features.has(id)) };
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
      const notes = Array.from(features.values()).filter((feature) => feature.featureId.startsWith("voice.note_energy."));
      if (notes.length < 4) return null;
      const sorted = notes.map((item) => item.value).sort((a, b) => b - a);
      const concentration = (sorted[0] ?? 0) + (sorted[1] ?? 0);
      const direction: SignalDirection = concentration >= 0.42 ? "elevated" : concentration <= 0.26 ? "reduced" : "stable";
      return { direction, strength: clamp(Math.abs(concentration - 0.34) / 0.34), contributingFeatureIds: notes.map((item) => item.featureId), notes: [direction === "elevated" ? "Energy is more concentrated across the existing note representation." : "Energy is more broadly distributed across the existing note representation."] };
    },
  },
];
