import type { ConfidenceLevel, DomainOrientation, QualityLevel, ScanStatus, SignalDirection } from "./data/v2/types";

export type BaselineWindowId = "recent" | "intermediate" | "long_term";
export type SimilarityCategory = "Very Similar" | "Moderately Different" | "Noticeably Different" | "Significant Shift";
export type ObservationStability = "emerging" | "recurring" | "consistent" | "rare";
export type PatternEvolutionKind = "insufficient_history" | "stable" | "oscillating" | "gradual_movement" | "rapid_shifts";

export interface LongitudinalEvidencePoint { id: string; direction: SignalDirection; strength: number; confidence: ConfidenceLevel }
export interface LongitudinalObservationPoint { id: string; direction: SignalDirection; strength: number; confidence: ConfidenceLevel }
export interface LongitudinalDomainPoint { id: string; score: number; orientation: DomainOrientation; confidence: ConfidenceLevel }
export interface LongitudinalPatternPoint { id: string; confidence: number }
export interface LongitudinalScanSnapshot {
  scanId: string;
  createdAt: string;
  status: ScanStatus;
  quality: QualityLevel;
  evidence: LongitudinalEvidencePoint[];
  observations: LongitudinalObservationPoint[];
  domains: LongitudinalDomainPoint[];
  patterns: LongitudinalPatternPoint[];
  primaryPatternId?: string;
  signalDistribution?: number[];
  resonanceDistribution?: number[];
}

export interface RollingBaseline {
  window: BaselineWindowId;
  available: boolean;
  scansUsed: number;
  sourceScanIds: string[];
  evidenceAverages: Record<string, number>;
  observationFrequency: Record<string, number>;
  domainAverages: Record<string, number>;
  patternFrequency: Record<string, number>;
  confidenceTrend: Record<ConfidenceLevel, number>;
  signalDistribution: number[];
  resonanceDistribution: number[];
}

export interface SimilarityResult { available: boolean; score?: number; category?: SimilarityCategory; components?: Record<string, number> }
export interface TrendResult { domainId: string; direction: "higher" | "lower" | "stable"; delta: number; summary: string; window: BaselineWindowId }
export interface ObservationStabilityResult { observationId: string; stability: ObservationStability; frequency: number; appearances: number; scansUsed: number }
export interface PatternEvolution { available: boolean; kind: PatternEvolutionKind; transitions: Array<{ from: string; to: string; count: number }>; summary: string }
export interface LongitudinalAnalysis {
  baselines: Record<BaselineWindowId, RollingBaseline>;
  similarity: Record<BaselineWindowId, SimilarityResult>;
  trends: TrendResult[];
  observationStability: ObservationStabilityResult[];
  patternEvolution: PatternEvolution;
}

const CONFIDENCE_WEIGHT: Record<ConfidenceLevel, number> = { exploratory: 0.5, moderate: 0.75, high: 1 };
const DIRECTION_VALUE: Record<SignalDirection, number> = { reduced: -1, stable: 0, mixed: 0, unavailable: 0, elevated: 1 };

export function isBaselineEligible(scan: LongitudinalScanSnapshot): boolean {
  return scan.status === "completed" || (scan.status === "partial" && (scan.quality === "good" || scan.quality === "high"));
}

function mean(values: number[]): number { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function rounded(value: number): number { return Number(value.toFixed(4)); }
function averageVector(vectors: number[][]): number[] {
  const width = Math.max(0, ...vectors.map((vector) => vector.length));
  return Array.from({ length: width }, (_, index) => rounded(mean(vectors.map((vector) => vector[index]).filter(Number.isFinite))));
}
function normalizedPoint(direction: SignalDirection, strength: number, confidence: ConfidenceLevel): number {
  return DIRECTION_VALUE[direction] * Math.max(0, Math.min(1, strength)) * CONFIDENCE_WEIGHT[confidence];
}
function averages<T extends { id: string; direction: SignalDirection; strength: number; confidence: ConfidenceLevel }>(scans: LongitudinalScanSnapshot[], pick: (scan: LongitudinalScanSnapshot) => T[]): Record<string, number> {
  const grouped = new Map<string, number[]>();
  scans.forEach((scan) => pick(scan).forEach((point) => grouped.set(point.id, [...(grouped.get(point.id) ?? []), normalizedPoint(point.direction, point.strength, point.confidence)])));
  return Object.fromEntries(Array.from(grouped, ([id, values]) => [id, rounded(mean(values))]));
}
function frequency(scans: LongitudinalScanSnapshot[], ids: (scan: LongitudinalScanSnapshot) => string[]): Record<string, number> {
  const counts = new Map<string, number>();
  scans.forEach((scan) => new Set(ids(scan)).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  return Object.fromEntries(Array.from(counts, ([id, count]) => [id, rounded(count / Math.max(scans.length, 1))]));
}
function confidenceTrend(scans: LongitudinalScanSnapshot[]): Record<ConfidenceLevel, number> {
  const all = scans.flatMap((scan) => [...scan.evidence.map((item) => item.confidence), ...scan.observations.map((item) => item.confidence), ...scan.domains.map((item) => item.confidence)]);
  return { high: rounded(all.filter((value) => value === "high").length / Math.max(all.length, 1)), moderate: rounded(all.filter((value) => value === "moderate").length / Math.max(all.length, 1)), exploratory: rounded(all.filter((value) => value === "exploratory").length / Math.max(all.length, 1)) };
}

const WINDOW_CONFIG: Record<BaselineWindowId, { limit?: number; minimum: number }> = {
  recent: { limit: 10, minimum: 3 },
  intermediate: { limit: 50, minimum: 10 },
  long_term: { minimum: 15 },
};

export function buildRollingBaselines(history: LongitudinalScanSnapshot[]): Record<BaselineWindowId, RollingBaseline> {
  const eligible = history.filter(isBaselineEligible).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const build = (window: BaselineWindowId): RollingBaseline => {
    const config = WINDOW_CONFIG[window];
    const scans = config.limit ? eligible.slice(0, config.limit) : eligible;
    const available = scans.length >= config.minimum;
    const used = available ? scans : [];
    return {
      window, available, scansUsed: used.length, sourceScanIds: used.map((scan) => scan.scanId),
      evidenceAverages: averages(used, (scan) => scan.evidence),
      observationFrequency: frequency(used, (scan) => scan.observations.map((item) => item.id)),
      domainAverages: Object.fromEntries(Array.from(new Set(used.flatMap((scan) => scan.domains.map((item) => item.id)))).map((id) => [id, rounded(mean(used.flatMap((scan) => scan.domains.filter((item) => item.id === id).map((item) => item.score))))])),
      patternFrequency: frequency(used, (scan) => scan.patterns.map((item) => item.id)),
      confidenceTrend: confidenceTrend(used),
      signalDistribution: averageVector(used.map((scan) => scan.signalDistribution ?? [])),
      resonanceDistribution: averageVector(used.map((scan) => scan.resonanceDistribution ?? [])),
    };
  };
  return { recent: build("recent"), intermediate: build("intermediate"), long_term: build("long_term") };
}

function mapDistance(current: Record<string, number>, baseline: Record<string, number>, scale: number): number {
  const keys = Array.from(new Set([...Object.keys(current), ...Object.keys(baseline)]));
  return keys.length ? mean(keys.map((key) => Math.min(1, Math.abs((current[key] ?? 0) - (baseline[key] ?? 0)) / scale))) : 0.5;
}
function vectorDistance(current: number[], baseline: number[]): number {
  const width = Math.max(current.length, baseline.length);
  return width ? mean(Array.from({ length: width }, (_, index) => Math.min(1, Math.abs((current[index] ?? 0) - (baseline[index] ?? 0))))) : 0.5;
}
function category(score: number): SimilarityCategory { return score >= 0.82 ? "Very Similar" : score >= 0.64 ? "Moderately Different" : score >= 0.42 ? "Noticeably Different" : "Significant Shift"; }

export function calculateSimilarity(current: LongitudinalScanSnapshot, baseline: RollingBaseline): SimilarityResult {
  if (!baseline.available) return { available: false };
  const evidence = Object.fromEntries(current.evidence.map((item) => [item.id, normalizedPoint(item.direction, item.strength, item.confidence)]));
  const observations = Object.fromEntries(current.observations.map((item) => [item.id, 1]));
  const domains = Object.fromEntries(current.domains.map((item) => [item.id, item.score]));
  const patterns = Object.fromEntries(current.patterns.map((item) => [item.id, item.confidence]));
  const components = {
    evidence: 1 - mapDistance(evidence, baseline.evidenceAverages, 2),
    observations: 1 - mapDistance(observations, baseline.observationFrequency, 1),
    domains: 1 - mapDistance(domains, baseline.domainAverages, 100),
    patterns: 1 - mapDistance(patterns, baseline.patternFrequency, 1),
    signal: 1 - vectorDistance(current.signalDistribution ?? [], baseline.signalDistribution),
    resonance: 1 - vectorDistance(current.resonanceDistribution ?? [], baseline.resonanceDistribution),
  };
  const score = rounded(components.evidence * 0.25 + components.observations * 0.18 + components.domains * 0.25 + components.patterns * 0.14 + components.signal * 0.08 + components.resonance * 0.1);
  return { available: true, score, category: category(score), components: Object.fromEntries(Object.entries(components).map(([key, value]) => [key, rounded(value)])) };
}

function trendSummary(domain: LongitudinalDomainPoint, direction: "higher" | "lower" | "stable", window: BaselineWindowId): string {
  const label = domain.id === "recovery_restoration" ? "Recovery" : domain.id === "focus_mental_demand" ? "Mental demand" : domain.id === "expression_communication" ? "Expression" : domain.id === "regulation_stability" ? "Regulation" : domain.id.replaceAll("_", " ");
  const baseline = window === "recent" ? "recent baseline" : window === "intermediate" ? "intermediate baseline" : "long-term baseline";
  if (direction === "stable") return `${label} remains within your usual ${baseline} range.`;
  if (domain.id === "focus_mental_demand") return direction === "higher" ? `Mental demand appears higher than your ${baseline}.` : `Mental demand appears lower than your ${baseline}.`;
  if (domain.id === "recovery_restoration") return direction === "higher" ? `Recovery appears stronger than your ${baseline}.` : `Recovery appears less available than your ${baseline}.`;
  if (domain.id === "regulation_stability") return direction === "higher" ? `Regulation appears steadier than your ${baseline}.` : `Regulation appears less steady than your ${baseline}.`;
  return `${label} appears ${direction} than your ${baseline}.`;
}

export function detectTrends(current: LongitudinalScanSnapshot, baselines: Record<BaselineWindowId, RollingBaseline>): TrendResult[] {
  const preferred: BaselineWindowId[] = ["recent", "intermediate", "long_term"];
  return current.domains.flatMap((domain) => {
    const window = preferred.find((candidate) => baselines[candidate].available && baselines[candidate].domainAverages[domain.id] !== undefined);
    if (!window) return [];
    const delta = rounded(domain.score - baselines[window].domainAverages[domain.id]);
    const direction = Math.abs(delta) < 4 ? "stable" : delta > 0 ? "higher" : "lower";
    return [{ domainId: domain.id, direction, delta, summary: trendSummary(domain, direction, window), window }];
  });
}

export function classifyObservationStability(current: LongitudinalScanSnapshot, baseline: RollingBaseline): ObservationStabilityResult[] {
  if (!baseline.available) return current.observations.map((item) => ({ observationId: item.id, stability: "emerging", frequency: 0, appearances: 1, scansUsed: 0 }));
  return current.observations.map((item) => {
    const frequencyValue = baseline.observationFrequency[item.id] ?? 0;
    const stability: ObservationStability = frequencyValue >= 0.75 ? "consistent" : frequencyValue >= 0.35 ? "recurring" : frequencyValue > 0 ? "rare" : "emerging";
    return { observationId: item.id, stability, frequency: frequencyValue, appearances: Math.round(frequencyValue * baseline.scansUsed) + 1, scansUsed: baseline.scansUsed };
  });
}

export function analyzePatternEvolution(history: LongitudinalScanSnapshot[], current: LongitudinalScanSnapshot): PatternEvolution {
  const sequence = [...history.filter(isBaselineEligible).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)), current].map((scan) => scan.primaryPatternId).filter((id): id is string => Boolean(id));
  if (sequence.length < 3) return { available: false, kind: "insufficient_history", transitions: [], summary: "Complete more scans to begin seeing how your current patterns change over time." };
  const transitions = new Map<string, number>();
  for (let index = 1; index < sequence.length; index += 1) if (sequence[index] !== sequence[index - 1]) transitions.set(`${sequence[index - 1]}→${sequence[index]}`, (transitions.get(`${sequence[index - 1]}→${sequence[index]}`) ?? 0) + 1);
  const changes = Array.from(transitions.values()).reduce((sum, count) => sum + count, 0);
  const unique = new Set(sequence).size;
  const recent = sequence.slice(-4);
  const oscillating = recent.length === 4 && recent[0] === recent[2] && recent[1] === recent[3] && recent[0] !== recent[1];
  const kind: PatternEvolutionKind = changes === 0 ? "stable" : oscillating ? "oscillating" : changes >= Math.ceil(sequence.length * 0.6) ? "rapid_shifts" : unique >= 3 && changes >= 2 ? "gradual_movement" : "stable";
  const summary = kind === "oscillating" ? "Your recent scans alternate between two current-state patterns." : kind === "rapid_shifts" ? "Your recent scans show several pattern shifts rather than one stable sequence." : kind === "gradual_movement" ? "Your scan history shows gradual movement across several current-state patterns." : "Your current pattern has remained relatively stable across recent scans.";
  return { available: true, kind, transitions: Array.from(transitions, ([key, count]) => { const [from, to] = key.split("→"); return { from, to, count }; }), summary };
}

export function buildLongitudinalAnalysis(current: LongitudinalScanSnapshot, history: LongitudinalScanSnapshot[]): LongitudinalAnalysis {
  const baselines = buildRollingBaselines(history);
  const stabilityBaseline = baselines.recent.available ? baselines.recent : baselines.intermediate.available ? baselines.intermediate : baselines.long_term;
  return {
    baselines,
    similarity: { recent: calculateSimilarity(current, baselines.recent), intermediate: calculateSimilarity(current, baselines.intermediate), long_term: calculateSimilarity(current, baselines.long_term) },
    trends: detectTrends(current, baselines),
    observationStability: classifyObservationStability(current, stabilityBaseline),
    patternEvolution: analyzePatternEvolution(history, current),
  };
}

export function buildCalibrationAnalytics(scans: LongitudinalScanSnapshot[]) {
  const eligible = scans.filter(isBaselineEligible);
  return {
    scanCount: scans.length,
    eligibleCount: eligible.length,
    partialScanRate: rounded(scans.filter((scan) => scan.status === "partial").length / Math.max(scans.length, 1)),
    captureQuality: frequency(scans, (scan) => [scan.quality]),
    patternFrequency: frequency(eligible, (scan) => scan.primaryPatternId ? [scan.primaryPatternId] : []),
    evidenceDistribution: Object.fromEntries(Object.entries(averages(eligible, (scan) => scan.evidence))),
    observationDistribution: frequency(eligible, (scan) => scan.observations.map((item) => item.id)),
    confidenceDistribution: confidenceTrend(eligible),
  };
}
