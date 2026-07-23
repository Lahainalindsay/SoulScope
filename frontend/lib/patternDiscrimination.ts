import type { PatternMatch } from "./resonancePatterns";
import type { ObservationPipelineResult, SignalDirection } from "./observationFramework/types";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function signal(pipeline: ObservationPipelineResult, id: string, direction?: SignalDirection) {
  const match = pipeline.evidenceSignals.find((item) => item.evidenceId === id);
  if (!match || (direction && match.direction !== direction)) return 0;
  const confidence = match.evidenceConfidence === "high" ? 1 : match.evidenceConfidence === "moderate" ? 0.72 : 0.42;
  return match.strength * confidence;
}

function domain(pipeline: ObservationPipelineResult, id: string) {
  return pipeline.domains.find((item) => item.domainId === id);
}

function availabilityLoad(pipeline: ObservationPipelineResult, id: string) {
  const item = domain(pipeline, id);
  if (!item) return 0;
  return item.orientation === "demand" ? clamp((item.score - 50) / 50) : clamp((50 - item.score) / 50);
}

function availabilityResource(pipeline: ObservationPipelineResult, id: string) {
  const item = domain(pipeline, id);
  if (!item) return 0;
  return item.orientation === "demand" ? clamp((50 - item.score) / 50) : clamp((item.score - 50) / 50);
}

function domainSpread(pipeline: ObservationPipelineResult) {
  const values = pipeline.domains.map((item) => item.score);
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) / 25;
}

function fingerprint(id: PatternMatch["id"], pipeline: ObservationPipelineResult) {
  const recoveryLoad = availabilityLoad(pipeline, "recovery_restoration");
  const mentalLoad = availabilityLoad(pipeline, "focus_mental_demand");
  const expressionLoad = availabilityLoad(pipeline, "expression_communication");
  const regulationLoad = availabilityLoad(pipeline, "regulation_stability");
  const recoveryResource = availabilityResource(pipeline, "recovery_restoration");
  const regulationResource = availabilityResource(pipeline, "regulation_stability");
  const adaptabilityResource = availabilityResource(pipeline, "adaptability_direction");
  const energyResource = availabilityResource(pipeline, "energy_vitality");
  const elevatedPauses = signal(pipeline, "processing_pauses", "elevated");
  const reducedConsistency = signal(pipeline, "response_consistency", "reduced");
  const reducedDynamics = signal(pipeline, "speech_dynamics", "reduced");
  const elevatedActivation = signal(pipeline, "vocal_activation", "elevated");
  const reducedEnergy = signal(pipeline, "vocal_energy", "reduced");
  const reducedStability = signal(pipeline, "vocal_stability", "reduced");
  const reducedVariability = signal(pipeline, "expressive_variability", "reduced");
  const elevatedVariability = signal(pipeline, "expressive_variability", "elevated");
  const elevatedDynamics = signal(pipeline, "speech_dynamics", "elevated");
  const organizedSpectrum = signal(pipeline, "spectral_organization", "elevated");
  const harmonicClarity = signal(pipeline, "harmonic_clarity", "elevated");
  const stableSignals = pipeline.evidenceSignals.filter((item) => item.direction === "stable").length / Math.max(pipeline.evidenceSignals.length, 1);
  const loads = pipeline.domains.filter((item) => item.state === "working_hard" || item.state === "asking_for_support").length / Math.max(pipeline.domains.length, 1);
  const spread = clamp(domainSpread(pipeline));

  switch (id) {
    case "overextended-achiever":
      return clamp(recoveryLoad * 0.24 + mentalLoad * 0.17 + elevatedActivation * 0.17 + elevatedDynamics * 0.12 + elevatedVariability * 0.1 + energyResource * 0.08 + adaptabilityResource * 0.07 + spread * 0.05);
    case "deep-processor":
      return clamp(mentalLoad * 0.31 + elevatedPauses * 0.28 + reducedConsistency * 0.15 + reducedDynamics * 0.14 + expressionLoad * 0.08 + reducedEnergy * 0.04);
    case "guarded-but-responsive":
      return clamp(expressionLoad * 0.28 + reducedVariability * 0.25 + reducedStability * 0.18 + reducedDynamics * 0.13 + elevatedActivation * 0.08 + regulationLoad * 0.08);
    case "recovering-adapter":
      return clamp(recoveryResource * 0.26 + regulationResource * 0.22 + adaptabilityResource * 0.18 + energyResource * 0.11 + harmonicClarity * 0.09 + organizedSpectrum * 0.06 + (1 - loads) * 0.08);
    case "quietly-overloaded":
      return clamp(loads * 0.18 + (1 - spread) * 0.1 + recoveryLoad * 0.17 + regulationLoad * 0.12 + reducedEnergy * 0.17 + reducedConsistency * 0.12 + elevatedPauses * 0.14);
    case "balanced-regulator":
      return clamp(regulationResource * 0.24 + recoveryResource * 0.22 + energyResource * 0.14 + adaptabilityResource * 0.14 + stableSignals * 0.12 + harmonicClarity * 0.08 + organizedSpectrum * 0.06);
  }
}

export function discriminatePatternMatches(
  matches: Array<PatternMatch | undefined>,
  pipeline?: ObservationPipelineResult,
): PatternMatch[] {
  const available = matches.filter((match): match is PatternMatch => Boolean(match));
  if (!pipeline || pipeline.domains.length < 4 || pipeline.evidenceSignals.length < 5) return available;

  const ranked = available
    .map((match) => {
      const fingerprintScore = fingerprint(match.id, pipeline);
      const combined = clamp(match.confidence * 0.58 + fingerprintScore * 0.42);
      return { ...match, confidence: combined, fingerprintScore };
    })
    .sort((a, b) => {
      const difference = b.confidence - a.confidence;
      if (Math.abs(difference) > 0.006) return difference;
      const fingerprintDifference = b.fingerprintScore - a.fingerprintScore;
      if (Math.abs(fingerprintDifference) > 0.003) return fingerprintDifference;
      return a.id.localeCompare(b.id);
    });

  return ranked.map(({ fingerprintScore: _fingerprintScore, ...match }, index) => {
    if (index === 0 || !ranked[index - 1]) return match;
    const previous = ranked[index - 1].confidence;
    return { ...match, confidence: Math.min(match.confidence, Math.max(0, previous - 0.015)) };
  });
}
