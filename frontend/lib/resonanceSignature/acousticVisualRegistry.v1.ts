export const ACOUSTIC_VISUAL_REGISTRY_VERSION = "acoustic-visual-registry-v1";

export type AcousticVisualRegistryEntry = Readonly<{
  registryVersion: typeof ACOUSTIC_VISUAL_REGISTRY_VERSION;
  featureId: string;
  unit: string;
  normalizationRange: Readonly<{ low: number; high: number }>;
  transformation: "linear_clamp_0_1";
  validExtractorVersions: readonly string[];
  missingnessBehavior: "omit_visual_property";
  visualPropertyControlled: string;
}>;

export const ACOUSTIC_VISUAL_REGISTRY_V1 = Object.freeze({
  pitchRange: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.f0.range_semitones",
    unit: "semitones",
    normalizationRange: { low: 2, high: 16 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "field radial variation",
  },
  pitchStability: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.pitch_stability",
    unit: "ratio",
    normalizationRange: { low: 0.25, high: 0.92 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "line steadiness",
  },
  harmonicRichness: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.harmonic_richness",
    unit: "ratio",
    normalizationRange: { low: 0.15, high: 0.95 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "contour warmth",
  },
  spectralFlatness: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.spectral_flatness",
    unit: "ratio",
    normalizationRange: { low: 0.02, high: 0.35 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "texture noise",
  },
  phonationRatio: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.phonation_time_ratio",
    unit: "ratio",
    normalizationRange: { low: 0.2, high: 0.9 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "continuous voiced support",
  },
  pauseDensity: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.pause.density",
    unit: "per_min",
    normalizationRange: { low: 1, high: 18 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "interrupted arc frequency",
  },
  pauseDurationMean: {
    registryVersion: ACOUSTIC_VISUAL_REGISTRY_VERSION,
    featureId: "voice.pause.duration_mean",
    unit: "ms",
    normalizationRange: { low: 180, high: 1400 },
    transformation: "linear_clamp_0_1",
    validExtractorVersions: ["*"],
    missingnessBehavior: "omit_visual_property",
    visualPropertyControlled: "interrupted arc gap width",
  },
} satisfies Record<string, AcousticVisualRegistryEntry>);
