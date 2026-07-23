import { ATLAS_EVIDENCE, ATLAS_SUBPATTERNS, resolveAtlasProfile, type AtlasEvidenceId, type AtlasInput, type AtlasResult } from "./patternAtlas";
import type { BaselineComparison } from "./patternPersonalization";
import type { PatternPresentation } from "./patternKnowledge";
import type { UserResultDomain } from "./systemDimensions";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const norm = (value: number | null | undefined, low: number, high: number) => {
  if (value == null || !Number.isFinite(value)) return 0.5;
  return clamp((value - low) / Math.max(1e-6, high - low));
};

function domain(domains: UserResultDomain[], title: UserResultDomain["title"]) {
  return domains.find((item) => item.title === title);
}

function availability(item: UserResultDomain | undefined) {
  if (!item) return 0.5;
  const stateBias: Record<string, number> = {
    "Highly Engaged": 0.88,
    "Readily Available": 0.76,
    "Working Hard": 0.48,
    "Under Pressure": 0.3,
    "Asking for Support": 0.24,
    Recovering: 0.42,
    "Less Accessible": 0.18,
  };
  return clamp((stateBias[item.functionalState] ?? item.score / 100) * 0.62 + (item.score / 100) * 0.38);
}

function demand(item: UserResultDomain | undefined) {
  if (!item) return 0.5;
  const stateBias: Record<string, number> = {
    "Highly Engaged": 0.45,
    "Readily Available": 0.22,
    "Working Hard": 0.76,
    "Under Pressure": 0.9,
    "Asking for Support": 0.82,
    Recovering: 0.62,
    "Less Accessible": 0.78,
  };
  return clamp((stateBias[item.functionalState] ?? 0.5) * 0.72 + (1 - item.score / 100) * 0.28);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function cameraPromptChange(scan: VoiceAnalysisResult) {
  const prompts = (scan.protocolNotes?.prompts ?? []).map((prompt) => prompt.camera).filter(Boolean);
  if (prompts.length < 2) return null;
  const first = prompts[0]!;
  const last = prompts[prompts.length - 1]!;
  const tensionRise = clamp((last.facialTension - first.facialTension + 0.25) / 0.5);
  const opennessShift = clamp(Math.abs(last.eyeOpenness - first.eyeOpenness) * 2.5);
  const blinkShift = clamp(Math.abs(last.blinkRatePerMin - first.blinkRatePerMin) / 18);
  return {
    restraint: clamp(tensionRise * 0.7 + (1 - opennessShift) * 0.3),
    flexibility: clamp(opennessShift * 0.55 + blinkShift * 0.25 + (1 - tensionRise) * 0.2),
  };
}

function baselineChange(baseline: BaselineComparison, dimension: string) {
  return baseline.changes.find((change) => change.dimension === dimension);
}

export function buildAtlasEvidenceInput(
  scan: VoiceAnalysisResult,
  domains: UserResultDomain[],
  baseline: BaselineComparison,
): AtlasInput {
  const energy = domain(domains, "Energy & Vitality");
  const recovery = domain(domains, "Recovery & Restoration");
  const communication = domain(domains, "Communication & Clarity");
  const expression = domain(domains, "Emotional Expression");
  const connection = domain(domains, "Connection & Support");
  const focus = domain(domains, "Focus & Mental Load");
  const direction = domain(domains, "Direction & Adaptability");
  const regulation = domain(domains, "Regulation");
  const dynamics = scan.voiceDynamics;

  const pauseLoad = average([
    norm(dynamics?.pauseDensityPerMin, 2, 18),
    norm(dynamics?.averagePauseMs, 180, 1400),
    norm(dynamics?.longestPauseMs, 450, 4200),
  ]);
  const timingContinuity = average([
    norm(dynamics?.voicedFrameRatio, 0.18, 0.72),
    norm(dynamics?.activeFrameRatio, 0.22, 0.8),
    1 - pauseLoad,
  ]);
  const vocalCoherence = average([
    norm(dynamics?.pitchStability, 0.25, 0.9),
    norm(dynamics?.pitchClarity, 0.2, 0.9),
    norm(dynamics?.harmonicToNoiseRatioDb, 5, 24),
    norm(dynamics?.formantStability, 0.2, 0.9),
  ]);
  const vocalVariation = average([
    norm(dynamics?.pitchRangeSemitones, 1, 12),
    norm(dynamics?.formantDynamics, 0.1, 0.85),
    norm(dynamics?.harmonicRichness, 0.1, 0.9),
  ]);
  const quality = dynamics?.captureQuality === "good" ? 1 : dynamics?.captureQuality === "fair" ? 0.72 : 0.42;
  const camera = cameraPromptChange(scan);
  const vocalContainment = 1 - vocalVariation * 0.35;

  const effort = average([demand(energy), demand(focus), demand(direction), 1 - timingContinuity * 0.45]);
  const recoveryGap = average([demand(recovery), effort * 0.72, 1 - availability(recovery)]);
  const searching = average([demand(focus), pauseLoad, 1 - availability(communication) * 0.45]);
  const steadiness = average([availability(regulation), vocalCoherence, timingContinuity]);
  const expressive = average([availability(expression), availability(communication), vocalVariation, ...(camera ? [camera.flexibility] : [])]);
  const protectiveDemand = average([demand(expression), demand(connection)]);
  const protective = clamp(
    protectiveDemand * 0.66
      + vocalContainment * 0.18
      + (camera ? camera.restraint * 0.16 : 0)
  );
  const adaptive = average([availability(direction), availability(regulation), timingContinuity, expressive * 0.45]);
  const fragmentation = average([demand(focus), 1 - vocalCoherence, 1 - timingContinuity, pauseLoad * 0.55]);
  const grounded = average([steadiness, availability(recovery), availability(energy), 1 - Math.abs(effort - availability(recovery))]);
  const social = average([availability(connection), availability(communication), expressive, 1 - protective * 0.38]);
  const clarity = average([availability(direction), availability(communication), timingContinuity, 1 - searching * 0.35]);

  const recoveryDelta = baselineChange(baseline, "Recovery & Restoration");
  const regulationDelta = baselineChange(baseline, "Regulation");
  const energyDelta = baselineChange(baseline, "Energy & Vitality");
  const returningCapacity = baseline.available
    ? clamp(0.3
      + (recoveryDelta?.direction === "higher" ? norm(recoveryDelta.delta, 2, 18) * 0.35 : 0)
      + (regulationDelta?.direction === "higher" ? norm(regulationDelta.delta, 2, 18) * 0.2 : 0)
      + (energyDelta?.direction === "higher" ? norm(energyDelta.delta, 2, 18) * 0.2 : 0)
      + steadiness * 0.15)
    : 0;

  const raw: AtlasInput = {
    "sustained-effort": effort,
    "reduced-recovery": recoveryGap,
    "cognitive-searching": searching,
    "steady-regulation": steadiness,
    "protective-restraint": protective,
    "expressive-flexibility": expressive,
    "adaptive-momentum": adaptive,
    "fragmented-processing": fragmentation,
    "returning-capacity": returningCapacity,
    "grounded-presence": grounded,
    "social-availability": social,
    "directional-clarity": clarity,
  };

  return Object.fromEntries(
    Object.entries(raw).map(([id, value]) => [id, clamp((value ?? 0) * quality + 0.5 * (1 - quality))]),
  ) as AtlasInput;
}

export function buildAtlasRuntime(
  scan: VoiceAnalysisResult,
  domains: UserResultDomain[],
  baseline: BaselineComparison,
): { input: AtlasInput; result: AtlasResult } {
  const input = buildAtlasEvidenceInput(scan, domains, baseline);
  return { input, result: resolveAtlasProfile(input) };
}

export function topAtlasEvidence(input: AtlasInput, limit = 4) {
  return (Object.entries(input) as Array<[AtlasEvidenceId, number]>)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([id, score]) => ({ ...ATLAS_EVIDENCE[id], score }));
}

const reflectionQuestion: Record<string, string> = {
  overextended: "What could become lighter before your system has to ask more loudly?",
  reflective: "What may become clearer if you stop requiring an immediate answer?",
  protective: "What conditions would let honesty feel safe without requiring you to overexpose yourself?",
  adaptive: "What adjustment would preserve the direction while reducing unnecessary effort?",
  recovering: "What returning capacity deserves protection before it is asked to perform again?",
  grounded: "Which part of your current rhythm is most worth protecting?",
  expressive: "Where does expression feel most natural when you are not managing how it will be received?",
  purposeful: "What is the smallest meaningful step that keeps purpose from becoming pressure?",
};

export function buildAtlasPresentation(
  input: AtlasInput,
  result: AtlasResult,
  baseline: BaselineComparison,
): PatternPresentation {
  const evidence = topAtlasEvidence(input, 4);
  const subpatterns = result.subpatterns.slice(0, 2).map(({ id }) => ATLAS_SUBPATTERNS[id]);
  const profile = result.profile;
  const evidenceNames = evidence.slice(0, 2).map((item) => item.label.toLowerCase()).join(" and ");
  const subpatternNames = subpatterns.map((item) => item.label.toLowerCase()).join(" alongside ");
  const longitudinalMessage = baseline.available
    ? baseline.overallSummary ?? "Your personal baseline is beginning to show how this state is changing over time."
    : "This is an initial observation. Repeated scans will show what is characteristic for you and what is specific to today.";

  return {
    summary: profile.theme,
    explanation: [
      `The strongest converging signals in this scan were ${evidenceNames}. Together, they form a pattern of ${subpatternNames}.`,
      `This does not define who you are. It describes how effort, recovery, expression and regulation appeared to organize during this scan.`,
    ],
    observedBullets: evidence.slice(0, 3).map((item) => item.description) as [string, string, string],
    dailyLife: profile.dailyLife,
    reflectionQuestion: reflectionQuestion[profile.family] ?? "What feels most worth noticing about this pattern today?",
    longitudinalMessage,
  };
}
