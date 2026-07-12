import type { PatternId } from "./resonancePatterns";
import type { UserResultDomain, UserResultStoryCandidate } from "./systemDimensions";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export type PatternExpression = {
  id: string;
  title: string;
  summary: string;
  matchedSignals: string[];
};

export type PatternModifier = {
  id: string;
  label: string;
  category: "resource" | "load" | "recovery" | "expression" | "regulation" | "change";
  evidence: string[];
};

export type BaselineComparison = {
  available: boolean;
  scansUsed: number;
  changes: Array<{
    dimension: string;
    direction: "higher" | "lower" | "stable";
    delta: number;
    userFacingSummary: string;
  }>;
  overallSummary?: string;
};

export type NarrativePreference = {
  directCount: number;
  supportiveCount: number;
  insightCount: number;
  preferredStyle: "Direct" | "Supportive" | "Insight" | null;
  totalSelections: number;
  lastSelectedStyle: "Direct" | "Supportive" | "Insight" | null;
  established: boolean;
};

type ExpressionDefinition = {
  id: string;
  title: string;
  summary: string;
  score: (scan: VoiceAnalysisResult, domains: UserResultDomain[]) => { score: number; evidence: string[] };
};

const domain = (domains: UserResultDomain[], title: UserResultDomain["title"]) => domains.find((item) => item.title === title);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const overactiveCount = (scan: VoiceAnalysisResult) => (scan.noteEnergies ?? []).filter((note) => note.status === "overactive").length;
const underactiveCount = (scan: VoiceAnalysisResult) => (scan.noteEnergies ?? []).filter((note) => note.status === "underactive").length;
const balancedCount = (scan: VoiceAnalysisResult) => (scan.noteEnergies ?? []).filter((note) => note.status === "balanced").length;
const noteSpread = (scan: VoiceAnalysisResult) => {
  const values = (scan.noteEnergies ?? []).map((note) => note.relativeEnergy);
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
};
const strongestTwoShare = (scan: VoiceAnalysisResult) => (scan.noteEnergies ?? []).slice().sort((a, b) => b.relativeEnergy - a.relativeEnergy).slice(0, 2).reduce((sum, note) => sum + note.relativeEnergy, 0);

const expressionLibrary: Record<PatternId, ExpressionDefinition[]> = {
  "overextended-achiever": [
    {
      id: "sustained-output-reduced-recovery",
      title: "Sustained Output, Reduced Recovery",
      summary: "Output remains available, but recovery is not keeping pace with the amount of effort being used.",
      score: (_scan, domains) => {
        const recovery = domain(domains, "Recovery & Restoration")?.score ?? 50;
        const direction = domain(domains, "Direction & Adaptability")?.score ?? 50;
        return { score: clamp((direction - recovery + 45) / 100), evidence: [`Direction ${direction}`, `Recovery ${recovery}`] };
      },
    },
    {
      id: "carrying-too-much-at-once",
      title: "Carrying Too Much at Once",
      summary: "Several systems appear active at the same time, creating distributed demand rather than one isolated pressure point.",
      score: (scan, domains) => {
        const loadCount = domains.filter((item) => ["Working Hard", "Under Pressure", "Asking for Support"].includes(item.functionalState)).length;
        return { score: clamp((loadCount + overactiveCount(scan)) / 10), evidence: [`${loadCount} loaded domains`, `${overactiveCount(scan)} overactive signals`] };
      },
    },
    {
      id: "forward-motion-under-pressure",
      title: "Forward Motion Under Pressure",
      summary: "Adaptability and momentum remain present even while the system is working through pressure.",
      score: (scan, domains) => {
        const adaptability = domain(domains, "Direction & Adaptability")?.score ?? 50;
        const stability = scan.voiceDynamics?.pitchStability ?? 0.5;
        return { score: clamp(adaptability / 100 + stability * 0.25), evidence: [`Adaptability ${adaptability}`, `Pitch stability ${stability.toFixed(2)}`] };
      },
    },
  ],
  "deep-processor": [
    {
      id: "carrying-open-loops",
      title: "Carrying Open Loops",
      summary: "Reflection remains active and unresolved material may be staying mentally open longer than usual.",
      score: (scan, domains) => {
        const focus = domain(domains, "Focus & Mental Load")?.score ?? 50;
        const pauses = scan.voiceDynamics?.pauseCount ?? 0;
        return { score: clamp(focus / 100 + Math.min(pauses, 8) / 20), evidence: [`Mental load ${focus}`, `${pauses} pauses`] };
      },
    },
    {
      id: "quietly-integrating",
      title: "Quietly Integrating",
      summary: "The scan suggests active internal processing without the same degree of outward strain.",
      score: (scan, domains) => {
        const clarity = scan.voiceDynamics?.pitchClarity ?? 0.5;
        const communication = domain(domains, "Communication & Clarity")?.score ?? 50;
        return { score: clamp(clarity * 0.65 + communication / 250), evidence: [`Pitch clarity ${clarity.toFixed(2)}`, `Communication ${communication}`] };
      },
    },
    {
      id: "reflection-under-load",
      title: "Reflection Under Load",
      summary: "Meaning-making remains available, but it appears to be happening under elevated demand.",
      score: (scan, domains) => {
        const focus = domain(domains, "Focus & Mental Load")?.score ?? 50;
        const hnr = scan.voiceDynamics?.harmonicToNoiseRatioDb ?? 10;
        return { score: clamp(focus / 100 + Math.max(0, 10 - hnr) / 20), evidence: [`Mental load ${focus}`, `HNR ${hnr}`] };
      },
    },
  ],
  "guarded-but-responsive": [
    {
      id: "expression-with-protective-bracing",
      title: "Expression With Protective Bracing",
      summary: "Expression remains available, but the body appears to add tension or control as pressure rises.",
      score: (scan, domains) => {
        const expression = domain(domains, "Emotional Expression")?.score ?? 50;
        const tension = scan.protocolNotes?.camera?.facialTension ?? 0.35;
        return { score: clamp(expression / 150 + tension * 0.6), evidence: [`Expression ${expression}`, `Facial tension ${tension.toFixed(2)}`] };
      },
    },
    {
      id: "available-but-carefully-held",
      title: "Available, but Carefully Held",
      summary: "The system is responsive and present, while expression remains measured rather than fully open.",
      score: (scan, domains) => {
        const communication = domain(domains, "Communication & Clarity")?.score ?? 50;
        const range = scan.voiceDynamics?.pitchRangeSemitones ?? 4;
        return { score: clamp(communication / 120 + Math.max(0, 4 - range) / 8), evidence: [`Communication ${communication}`, `Pitch range ${range}`] };
      },
    },
    {
      id: "openness-narrowing-under-pressure",
      title: "Openness Narrowing Under Pressure",
      summary: "Connection remains possible, but openness appears to narrow when demand or vulnerability increases.",
      score: (scan, domains) => {
        const connection = domain(domains, "Connection & Support")?.score ?? 50;
        const openness = scan.protocolNotes?.camera?.eyeOpenness ?? 0.6;
        return { score: clamp((100 - connection) / 100 + Math.max(0, 0.55 - openness)), evidence: [`Connection ${connection}`, `Eye openness ${openness.toFixed(2)}`] };
      },
    },
  ],
  "recovering-adapter": [
    {
      id: "capacity-returning",
      title: "Capacity Returning",
      summary: "More of the system appears available again, even if recovery is not yet complete.",
      score: (scan, domains) => {
        const energy = domain(domains, "Energy & Vitality")?.score ?? 50;
        const voiced = scan.voiceDynamics?.voicedFrameRatio ?? 0.5;
        return { score: clamp(energy / 120 + voiced * 0.35), evidence: [`Energy ${energy}`, `Voiced ratio ${voiced.toFixed(2)}`] };
      },
    },
    {
      id: "stabilizing-after-strain",
      title: "Stabilizing After Strain",
      summary: "The current signal looks steadier than a fully strained state, while still showing signs of recent demand.",
      score: (scan, domains) => {
        const recovery = domain(domains, "Recovery & Restoration")?.score ?? 50;
        const stability = scan.voiceDynamics?.pitchStability ?? 0.5;
        return { score: clamp(recovery / 150 + stability * 0.55), evidence: [`Recovery ${recovery}`, `Pitch stability ${stability.toFixed(2)}`] };
      },
    },
    {
      id: "rebuilding-through-consistency",
      title: "Rebuilding Through Consistency",
      summary: "Recovery appears to be supported by steadiness and repeatable regulation rather than bursts of effort.",
      score: (scan) => {
        const stability = scan.voiceDynamics?.pitchStability ?? 0.5;
        const clarity = scan.voiceDynamics?.pitchClarity ?? 0.5;
        return { score: clamp((stability + clarity) / 2), evidence: [`Pitch stability ${stability.toFixed(2)}`, `Pitch clarity ${clarity.toFixed(2)}`] };
      },
    },
  ],
  "quietly-overloaded": [
    {
      id: "functional-on-the-surface",
      title: "Functional on the Surface",
      summary: "The outward signal remains organized, while quieter domains suggest more internal demand than is immediately visible.",
      score: (scan, domains) => {
        const stability = scan.voiceDynamics?.pitchStability ?? 0.5;
        const lowDomains = domains.filter((item) => item.score < 35).length;
        return { score: clamp(stability * 0.6 + lowDomains / 8), evidence: [`Pitch stability ${stability.toFixed(2)}`, `${lowDomains} low domains`] };
      },
    },
    {
      id: "distributed-low-grade-strain",
      title: "Distributed Low-Grade Strain",
      summary: "Demand appears spread across several areas instead of concentrated in one obvious pressure point.",
      score: (scan, domains) => {
        const strained = domains.filter((item) => item.score < 45).length;
        return { score: clamp(strained / 8 + (noteSpread(scan) < 0.22 ? 0.2 : 0)), evidence: [`${strained} quieter domains`, `Signal spread ${noteSpread(scan).toFixed(2)}`] };
      },
    },
    {
      id: "holding-more-than-it-shows",
      title: "Holding More Than It Shows",
      summary: "The system appears to be containing more load than the outward presentation immediately reveals.",
      score: (scan, domains) => {
        const regulation = domain(domains, "Regulation")?.score ?? 50;
        const shimmer = scan.voiceDynamics?.shimmerLocalPct ?? 0;
        return { score: clamp((100 - regulation) / 120 + Math.min(shimmer, 40) / 80), evidence: [`Regulation ${regulation}`, `Shimmer ${shimmer}`] };
      },
    },
  ],
  "balanced-regulator": [
    {
      id: "steady-and-available",
      title: "Steady and Available",
      summary: "Multiple systems remain accessible without one area carrying an excessive share of the load.",
      score: (scan, domains) => {
        const average = domains.reduce((sum, item) => sum + item.score, 0) / Math.max(domains.length, 1);
        return { score: clamp(average / 100 + balancedCount(scan) / 24), evidence: [`Average domain ${average.toFixed(1)}`, `${balancedCount(scan)} balanced signals`] };
      },
    },
    {
      id: "flexible-with-adequate-recovery",
      title: "Flexible With Adequate Recovery",
      summary: "Adaptability is available without recovery appearing significantly compromised.",
      score: (_scan, domains) => {
        const recovery = domain(domains, "Recovery & Restoration")?.score ?? 50;
        const adaptability = domain(domains, "Direction & Adaptability")?.score ?? 50;
        return { score: clamp((recovery + adaptability) / 200), evidence: [`Recovery ${recovery}`, `Adaptability ${adaptability}`] };
      },
    },
    {
      id: "grounded-forward-movement",
      title: "Grounded Forward Movement",
      summary: "Momentum and regulation appear to be working together rather than pulling in opposite directions.",
      score: (_scan, domains) => {
        const regulation = domain(domains, "Regulation")?.score ?? 50;
        const direction = domain(domains, "Direction & Adaptability")?.score ?? 50;
        return { score: clamp((regulation + direction) / 200), evidence: [`Regulation ${regulation}`, `Direction ${direction}`] };
      },
    },
  ],
};

export function buildPatternExpression(patternId: PatternId, scan: VoiceAnalysisResult, domains: UserResultDomain[]): PatternExpression {
  if (scan.voiceDynamics?.captureQuality === "poor" || !(scan.noteEnergies ?? []).length) {
    return {
      id: "signals-still-resolving",
      title: "Signals Are Still Resolving",
      summary: "This scan did not provide enough reliable evidence for a more precise pattern expression.",
      matchedSignals: [scan.voiceDynamics?.captureQuality === "poor" ? "Poor capture quality" : "Limited signal evidence"],
    };
  }
  const ranked = expressionLibrary[patternId]
    .map((item) => ({ item, result: item.score(scan, domains) }))
    .sort((a, b) => b.result.score - a.result.score || a.item.id.localeCompare(b.item.id));
  const winner = ranked[0];
  return { id: winner.item.id, title: winner.item.title, summary: winner.item.summary, matchedSignals: winner.result.evidence };
}

export function buildPatternModifiers(scan: VoiceAnalysisResult, domains: UserResultDomain[]): PatternModifier[] {
  const modifiers: PatternModifier[] = [];
  const strongest = domains.slice().sort((a, b) => b.score - a.score)[0];
  const hardest = domains.filter((item) => ["Working Hard", "Under Pressure"].includes(item.functionalState)).sort((a, b) => b.score - a.score)[0];
  const support = domains.filter((item) => ["Asking for Support", "Recovering", "Less Accessible"].includes(item.functionalState)).sort((a, b) => a.score - b.score)[0];
  if (strongest) modifiers.push({ id: `resource-${strongest.title}`, label: `${strongest.title.toLowerCase()} remains available`, category: "resource", evidence: [`Score ${strongest.score}`, strongest.functionalState] });
  if (hardest) modifiers.push({ id: `load-${hardest.title}`, label: `${hardest.title.toLowerCase()} is working hardest`, category: "load", evidence: [`Score ${hardest.score}`, hardest.functionalState] });
  if (support) modifiers.push({ id: `support-${support.title}`, label: `${support.title.toLowerCase()} is asking for support`, category: "recovery", evidence: [`Score ${support.score}`, support.functionalState] });
  const pauses = scan.voiceDynamics?.pauseCount ?? 0;
  if (pauses >= 3) modifiers.push({ id: "reflection-pauses", label: "increased reflection pauses", category: "expression", evidence: [`${pauses} pauses`, `Density ${scan.voiceDynamics?.pauseDensityPerMin ?? 0}`] });
  const stability = scan.voiceDynamics?.pitchStability;
  if (typeof stability === "number" && stability >= 0.8) modifiers.push({ id: "stable-expression", label: "stable outward expression", category: "regulation", evidence: [`Pitch stability ${stability.toFixed(2)}`] });
  if (strongestTwoShare(scan) >= 0.5) modifiers.push({ id: "concentrated-strain", label: "strain is concentrated rather than distributed", category: "load", evidence: [`Top-two signal share ${strongestTwoShare(scan).toFixed(2)}`] });
  else if (noteSpread(scan) < 0.18) modifiers.push({ id: "distributed-signal", label: "activation is distributed across the signal", category: "regulation", evidence: [`Signal spread ${noteSpread(scan).toFixed(2)}`] });
  return modifiers.slice(0, 6);
}

export function computeNarrativePreference(counts: { Direct: number; Supportive: number; Insight: number }, lastSelectedStyle: NarrativePreference["lastSelectedStyle"]): NarrativePreference {
  const totalSelections = counts.Direct + counts.Supportive + counts.Insight;
  const ordered = (["Direct", "Supportive", "Insight"] as const).slice().sort((a, b) => counts[b] - counts[a] || (a === lastSelectedStyle ? -1 : b === lastSelectedStyle ? 1 : a.localeCompare(b)));
  const top = ordered[0];
  const second = ordered[1];
  const established = totalSelections >= 3 && counts[top] > counts[second];
  return {
    directCount: counts.Direct,
    supportiveCount: counts.Supportive,
    insightCount: counts.Insight,
    preferredStyle: established ? top : null,
    totalSelections,
    lastSelectedStyle,
    established,
  };
}

export function orderStoryCandidates(candidates: UserResultStoryCandidate[], preference?: NarrativePreference | null) {
  if (!preference?.established || !preference.preferredStyle) return candidates;
  return candidates.slice().sort((a, b) => a.style === preference.preferredStyle ? -1 : b.style === preference.preferredStyle ? 1 : 0);
}

export function buildBaselineComparison(current: UserResultDomain[], historical: UserResultDomain[][]): BaselineComparison {
  const valid = historical.filter((domains) => domains.length >= 4).slice(0, 5);
  if (valid.length < 2) return { available: false, scansUsed: valid.length, changes: [], overallSummary: "Complete a few more scans to begin seeing changes from your personal baseline." };
  const changes = current.map((item) => {
    const previous = valid.map((scan) => scan.find((candidate) => candidate.title === item.title)?.score).filter((value): value is number => typeof value === "number");
    const baseline = previous.reduce((sum, value) => sum + value, 0) / Math.max(previous.length, 1);
    const delta = Number((item.score - baseline).toFixed(1));
    const direction = Math.abs(delta) < 4 ? "stable" as const : delta > 0 ? "higher" as const : "lower" as const;
    const label = item.title === "Focus & Mental Load" ? "Mental demand" : item.title.replace(" & ", " and ");
    const userFacingSummary = direction === "stable"
      ? `${label} remains within your usual recent range.`
      : `${label} appears ${direction === "higher" ? "more available or active" : "quieter"} than in your recent scans.`;
    return { dimension: item.title, direction, delta, userFacingSummary };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const meaningful = changes.filter((change) => change.direction !== "stable").slice(0, 3);
  return {
    available: true,
    scansUsed: valid.length,
    changes,
    overallSummary: meaningful.length ? meaningful.map((change) => change.userFacingSummary).join(" ") : "Your current dimensions remain close to your recent personal baseline.",
  };
}
