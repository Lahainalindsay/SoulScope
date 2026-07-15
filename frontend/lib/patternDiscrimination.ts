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
  const concentratedBalance = signal(pipeline, "note_balance", "elevated");
  const broadDistribution = signal(pipeline, "resonance_distribution", "elevated");
  const stableSignals = pipeline.evidenceSignals.filter((item) => item.direction === "stable").length / Math.max(pipeline.evidenceSignals.length, 1);
  const loads = pipeline.domains.filter((item) => item.state === "working_hard" || item.state === "asking_for_support").length / Math.max(pipeline.domains.length, 1);
  const spread = clamp(domainSpread(pipeline));

  switch (id) {
    case "overextended-achiever":
      return clamp(recoveryLoad * 0.28 + mentalLoad * 0.2 + elevatedActivation * 0.16 + energyResource * 0.13 + adaptabilityResource * 0.1 + elevatedPauses * 0.08 + spread * 0.05);
    case "deep-processor":
      return clamp(mentalLoad * 0.3 + elevatedPauses * 0.25 + reducedConsistency * 0.14 + reducedDynamics * 0.12 + concentratedBalance * 0.08 + expressionLoad * 0.07 + reducedEnergy * 0.04);
    case "guarded-but-responsive":
      return clamp(expressionLoad * 0.27 + reducedVariability * 0.23 + reducedStability * 0.16 + concentratedBalance * 0.12 + elevatedActivation * 0.1 + regulationLoad * 0.08 + reducedDynamics * 0.04);
    case "recovering-adapter":
      return clamp(recoveryResource * 0.28 + regulationResource * 0.24 + adaptabilityResource * 0.2 + energyResource * 0.12 + broadDistribution * 0.08 + (1 - loads) * 0.08);
    case "quietly-overloaded":
      return clamp(loads * 0.3 + (1 - spread) * 0.2 + recoveryLoad * 0.15 + regulationLoad * 0.12 + reducedEnergy * 0.1 + reducedConsistency * 0.08 + concentratedBalance * 0.05);
    case "balanced-regulator":
      return clamp(regulationResource * 0.25 + recoveryResource * 0.23 + energyResource * 0.15 + adaptabilityResource * 0.15 + stableSignals * 0.14 + broadDistribution * 0.08);
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