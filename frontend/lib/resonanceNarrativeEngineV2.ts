import type { CanonicalPatternResult } from "./canonicalPattern";
import type { ScanCompleteness } from "./partialScan";
import type { ScoreBand, UserResultDomain, UserResultDomainName } from "./systemDimensions";

export const RESONANCE_NARRATIVE_ENGINE_VERSION = "resonance-narrative-v2";

type NarrativeTone = "resource" | "balanced" | "demand";
type ConfidenceLabel = "Developing" | "Moderate" | "Strong";

export type NarrativeEvidenceRef = {
  domain: UserResultDomainName;
  score: number;
  band: ScoreBand;
  signalSources: string[];
  orientation: NarrativeTone;
};

export type ComponentNarrative = {
  domain: UserResultDomainName;
  score: number;
  band: ScoreBand;
  stateLabel: string;
  orientation: NarrativeTone;
  observation: string;
  oftenFeelsLike: string[];
  strength: string;
  tradeoff?: string;
  evidence: NarrativeEvidenceRef;
};

export type RelationshipNarrative = {
  id: string;
  statement: string;
  evidence: NarrativeEvidenceRef[];
  confidence: number;
};

export type ResonanceNarrative = {
  engineVersion: string;
  generatedPattern: {
    title: string;
    fingerprintCode: string;
    territory: string;
    dominantState: string;
    supportingQuality: string;
    closestTerritories: string[];
    confidence: number;
    confidenceLabel: ConfidenceLabel;
    decisive: boolean;
    componentKey: string;
    ruleId: string;
  };
  introduction: string;
  beneathTheSurface: string;
  howThisOftenFeels: string[];
  whatOthersMayNotice: string[];
  strengthToday: string;
  worthNoticing: string;
  reflectionQuestion: string;
  components: ComponentNarrative[];
  relationships: RelationshipNarrative[];
  evidenceLedger: NarrativeEvidenceRef[];
  limitations: string[];
};

const BAND_ORDER: ScoreBand[] = ["Extremely Low", "Low", "Balanced", "High", "Extremely High"];

function clamp(value: number, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function scoreBand(score: number): ScoreBand {
  if (score <= 20) return "Extremely Low";
  if (score <= 40) return "Low";
  if (score < 67) return "Balanced";
  if (score < 85) return "High";
  return "Extremely High";
}

function orientationFor(domain: UserResultDomain): NarrativeTone {
  if (domain.title === "Focus & Mental Load") {
    if (domain.score >= 67) return "demand";
    if (domain.score <= 40) return "resource";
    return "balanced";
  }
  if (domain.score >= 67) return "resource";
  if (domain.score <= 40) return "demand";
  return "balanced";
}

const DOMAIN_LANGUAGE: Record<UserResultDomainName, {
  subject: string;
  high: string;
  balanced: string;
  low: string;
  positive: string[];
  caution: string;
  others: string;
}> = {
  "Energy & Vitality": {
    subject: "available energy",
    high: "There is meaningful energy available for engagement today, giving you room to participate actively without needing to force momentum.",
    balanced: "Your energy appears measured and usable today, with enough activation to stay involved while preserving some reserve.",
    low: "Your energy appears quieter today, making selectivity and pacing more useful than pushing for constant output.",
    positive: ["You may feel able to engage without needing to rush.", "Momentum may return once the right priority becomes clear."],
    caution: "Available energy can make it tempting to take on more than the rest of your system wants to sustain.",
    others: "Others may notice a steady presence, even when you are carefully managing your energy.",
  },
  "Recovery & Restoration": {
    subject: "recovery",
    high: "Your system appears to have meaningful reserves available today. Even when demands increase, you seem capable of regaining your footing.",
    balanced: "Recovery appears available, though it may depend on real pauses rather than continuous output.",
    low: "Recovery appears slower than the effort currently being asked of you, suggesting that your reserves may need more protection than usual.",
    positive: ["You may still be able to regain your footing after effort.", "Small pauses may have more value than they usually do."],
    caution: "Continuing to function can hide how much restoration is still needed.",
    others: "Others may experience you as capable without seeing the recovery cost beneath that capability.",
  },
  "Communication & Clarity": {
    subject: "communication clarity",
    high: "Your thoughts appear readily available for expression, making it easier to communicate clearly and move conversations forward.",
    balanced: "Your communication appears measured today, with enough clarity to express what matters without filling every silence.",
    low: "Your words may need more time to form today, especially when the subject carries emotional or cognitive weight.",
    positive: ["You may be able to explain what matters without overworking the message.", "Thoughtful pauses may support clearer communication."],
    caution: "Clarity can become overexplaining when you feel responsible for making everyone understand.",
    others: "Others may experience you as thoughtful and deliberate in how you communicate.",
  },
  "Emotional Expression": {
    subject: "emotional expression",
    high: "Your emotional range appears available for expression, understanding, or creative use rather than remaining entirely internal.",
    balanced: "Emotion appears available without dominating the whole picture, leaving room for both feeling and perspective.",
    low: "Emotional expression appears more protected today, which may reflect privacy, careful processing, or a need for greater safety before opening.",
    positive: ["You may be aware of what you feel without needing to reveal all of it.", "Expression may become easier in the right setting."],
    caution: "When emotion is highly available, others may see the intensity before they understand its meaning.",
    others: "Others may notice sensitivity or depth without fully seeing what is being held privately.",
  },
  "Connection & Support": {
    subject: "relational availability",
    high: "You appear available for connection today, with enough openness to receive support as well as offer it.",
    balanced: "Connection appears accessible, though you may still be selective about where your attention and trust are placed.",
    low: "Your relational energy appears more protected, suggesting space, safety, or lower social demand may feel especially valuable.",
    positive: ["You may prefer fewer, more meaningful interactions.", "Support may feel most useful when it does not create another obligation."],
    caution: "Being available to others can make your own need for support less visible.",
    others: "Others may experience you as selective, private, or quietly attentive.",
  },
  "Focus & Mental Load": {
    subject: "mental demand",
    high: "Your mind appears to be carrying several active threads at once. Strong processing may be present, but it is being asked to do a great deal.",
    balanced: "Your mental load appears active but manageable, allowing you to stay engaged without every thought competing for attention.",
    low: "Your cognitive field appears relatively uncluttered today, leaving more room for presence and unhurried decisions.",
    positive: ["You may be able to hold complexity and still find the central thread.", "Important details may remain accessible while several things are moving."],
    caution: "Sustained processing can look like productivity from the outside while still becoming tiring internally.",
    others: "Others may notice concentration and capability without seeing how many mental threads remain active underneath it.",
  },
  "Direction & Adaptability": {
    subject: "adaptability",
    high: "You seem able to adjust as new information, challenges, or opportunities emerge while staying connected to what matters most.",
    balanced: "You appear able to adjust when needed while still preferring enough continuity to remain oriented and intentional.",
    low: "Change may require more preparation today, making clarity, predictability, and time to adjust especially supportive.",
    positive: ["You may find another route without losing sight of the purpose.", "You may remain responsive even when the plan changes."],
    caution: "Adapting well can make it easy to keep reorganizing around other people's needs without checking your own.",
    others: "Others may experience you as flexible and capable during change.",
  },
  Regulation: {
    subject: "inner steadiness",
    high: "Your system appears able to stay engaged while returning toward balance, creating steadiness without emotional flatness.",
    balanced: "Your regulation appears usable today, with enough flexibility to respond and enough stability to settle again.",
    low: "Your system may be taking longer to settle after stimulation, making pace, predictability, and lower pressure more valuable.",
    positive: ["You may still be able to respond thoughtfully even when settling takes effort.", "Steadiness may return more easily when pressure decreases."],
    caution: "Appearing composed can make the effort required to stay regulated invisible to others.",
    others: "Others may see composure without realizing how actively you are maintaining it.",
  },
};

function componentFor(domain: UserResultDomain): ComponentNarrative {
  const language = DOMAIN_LANGUAGE[domain.title];
  const band = scoreBand(domain.score);
  const orientation = orientationFor(domain);
  const observation = band === "High" || band === "Extremely High"
    ? language.high
    : band === "Low" || band === "Extremely Low"
    ? language.low
    : language.balanced;
  return {
    domain: domain.title,
    score: domain.score,
    band,
    stateLabel: domain.functionalState,
    orientation,
    observation,
    oftenFeelsLike: language.positive,
    strength: domain.supportiveReframe,
    tradeoff: orientation === "balanced" ? undefined : language.caution,
    evidence: {
      domain: domain.title,
      score: domain.score,
      band,
      signalSources: domain.signalSources,
      orientation,
    },
  };
}

function byTitle(components: ComponentNarrative[], title: UserResultDomainName) {
  return components.find((component) => component.domain === title);
}

function relationship(id: string, statement: string, components: ComponentNarrative[]): RelationshipNarrative {
  const confidence = clamp(components.reduce((sum, component) => sum + Math.abs(component.score - 50) / 50, 0) / components.length);
  return { id, statement, evidence: components.map((component) => component.evidence), confidence };
}

function buildRelationships(components: ComponentNarrative[]): RelationshipNarrative[] {
  const recovery = byTitle(components, "Recovery & Restoration");
  const load = byTitle(components, "Focus & Mental Load");
  const regulation = byTitle(components, "Regulation");
  const adaptability = byTitle(components, "Direction & Adaptability");
  const clarity = byTitle(components, "Communication & Clarity");
  const emotion = byTitle(components, "Emotional Expression");
  const connection = byTitle(components, "Connection & Support");
  const energy = byTitle(components, "Energy & Vitality");
  const result: RelationshipNarrative[] = [];

  if (load && recovery && load.score >= 60 && recovery.score <= 42) result.push(relationship("load-outpaces-recovery", "You appear able to keep several responsibilities moving, but recovery is not keeping pace with the effort required to do it.", [load, recovery]));
  if (regulation && recovery && regulation.score <= 42 && recovery.score <= 42) result.push(relationship("effortful-continuation", "You seem to be maintaining function while both settling and restoration require more effort beneath the surface.", [regulation, recovery]));
  if (adaptability && recovery && adaptability.score >= 45 && recovery.score <= 42) result.push(relationship("adaptation-carrying-demand", "Your ability to adjust appears to be helping you continue, although that flexibility is currently carrying demand rather than reflecting full reserves.", [adaptability, recovery]));
  if (clarity && emotion && clarity.score >= 45 && emotion.score <= 45) result.push(relationship("measured-expression", "Your thinking appears more available than your emotional expression, suggesting that you may understand more than you currently want to reveal.", [clarity, emotion]));
  if (connection && recovery && connection.score >= 45 && recovery.score <= 42) result.push(relationship("support-selectivity", "You may still be available to others while becoming more selective about where your limited energy is spent.", [connection, recovery]));
  if (energy && regulation && energy.score >= 50 && regulation.score <= 42) result.push(relationship("energy-with-effortful-regulation", "There is enough energy to keep participating, but maintaining steadiness may cost more than it appears from the outside.", [energy, regulation]));
  if (load && recovery && load.score >= 67 && recovery.score >= 67) result.push(relationship("load-supported-by-recovery", "You are carrying meaningful mental demand, and your available recovery is helping that demand remain workable.", [load, recovery]));
  if (adaptability && regulation && adaptability.score >= 67 && regulation.score >= 67) result.push(relationship("regulated-adaptability", "Flexibility and steadiness are working together, helping you adjust without losing your center.", [adaptability, regulation]));

  return result.sort((a, b) => b.confidence - a.confidence);
}

function hashFingerprint(componentKey: string) {
  let hash = 2166136261;
  for (const character of componentKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(7, "0");
}

type PatternRule = {
  id: string;
  title: string;
  dominantState: string;
  supportingQuality: string;
  matches: (c: Record<string, number>, canonical: CanonicalPatternResult) => boolean;
};

const PATTERN_RULES: PatternRule[] = [
  { id: "steady-carrier", title: "The Steady Carrier", dominantState: "Continuing under demand", supportingQuality: "Organized persistence", matches: (c, p) => c.recovery <= 42 && c.regulation <= 42 && p.stateVector.organization >= 0.55 },
  { id: "adaptive-carrier", title: "The Adaptive Carrier", dominantState: "Adjusting while reserves lag", supportingQuality: "Flexible continuation", matches: (c) => c.recovery <= 42 && c.adaptability >= 45 },
  { id: "quiet-overextender", title: "The Quiet Overextender", dominantState: "Sustained demand", supportingQuality: "Contained capability", matches: (c) => c.recovery <= 42 && c.load >= 67 && c.expression <= 50 },
  { id: "contained-navigator", title: "The Contained Navigator", dominantState: "Careful forward movement", supportingQuality: "Measured expression", matches: (c) => c.expression <= 42 && c.adaptability >= 45 && c.regulation >= 43 },
  { id: "selective-observer", title: "The Selective Observer", dominantState: "Protected engagement", supportingQuality: "Thoughtful awareness", matches: (c) => c.connection <= 42 && c.expression <= 45 && c.load >= 50 },
  { id: "measured-strategist", title: "The Measured Strategist", dominantState: "Active processing", supportingQuality: "Deliberate communication", matches: (c) => c.load >= 60 && c.clarity >= 45 && c.expression <= 55 },
  { id: "recovering-builder", title: "The Recovering Builder", dominantState: "Capacity returning", supportingQuality: "Practical re-engagement", matches: (c) => c.recovery >= 43 && c.recovery <= 60 && c.energy >= 50 && c.load <= 66 },
  { id: "grounded-navigator", title: "The Grounded Navigator", dominantState: "Steady direction", supportingQuality: "Regulated adaptability", matches: (c) => c.regulation >= 67 && c.adaptability >= 60 },
  { id: "adaptive-integrator", title: "The Adaptive Integrator", dominantState: "Fluid reorganization", supportingQuality: "Coordinated flexibility", matches: (c) => c.adaptability >= 67 && c.regulation >= 55 && c.recovery >= 50 },
  { id: "open-connector", title: "The Open Connector", dominantState: "Relational engagement", supportingQuality: "Available expression", matches: (c) => c.connection >= 67 && c.expression >= 60 },
  { id: "clear-communicator", title: "The Clear Communicator", dominantState: "Direct expression", supportingQuality: "Organized thought", matches: (c) => c.clarity >= 67 && c.expression >= 55 },
  { id: "purposeful-initiator", title: "The Purposeful Initiator", dominantState: "Forward momentum", supportingQuality: "Available energy", matches: (c) => c.energy >= 67 && c.adaptability >= 55 && c.load <= 66 },
  { id: "reflective-processor", title: "The Reflective Processor", dominantState: "Internal meaning-making", supportingQuality: "Patient observation", matches: (c) => c.load >= 55 && c.expression <= 45 && c.energy <= 55 },
  { id: "resilient-restorer", title: "The Resilient Restorer", dominantState: "Active restoration", supportingQuality: "Returning capacity", matches: (c) => c.recovery >= 67 && c.regulation >= 55 },
  { id: "balanced-integrator", title: "The Balanced Integrator", dominantState: "Coordinated engagement", supportingQuality: "Evenly available capacity", matches: (c) => Object.values(c).every((score) => score >= 43 && score <= 66) },
];

function confidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.76) return "Strong";
  if (confidence >= 0.64) return "Moderate";
  return "Developing";
}

function buildGeneratedPattern(components: ComponentNarrative[], canonical: CanonicalPatternResult) {
  const score = (title: UserResultDomainName) => byTitle(components, title)?.score ?? 50;
  const c = {
    energy: score("Energy & Vitality"),
    recovery: score("Recovery & Restoration"),
    clarity: score("Communication & Clarity"),
    expression: score("Emotional Expression"),
    connection: score("Connection & Support"),
    load: score("Focus & Mental Load"),
    adaptability: score("Direction & Adaptability"),
    regulation: score("Regulation"),
  };
  const selected = PATTERN_RULES.find((rule) => rule.matches(c, canonical)) ?? {
    id: "current-integrator",
    title: "The Current Integrator",
    dominantState: "Mixed present-moment state",
    supportingQuality: "Responsive coordination",
  };
  const componentKey = [...components]
    .sort((a, b) => a.domain.localeCompare(b.domain))
    .map((component) => `${component.domain.replaceAll(" ", "-").toLowerCase()}:${BAND_ORDER.indexOf(component.band)}`)
    .join("|");
  const alternatives = canonical.decisionLedger.alternatives
    .filter((candidate) => !candidate.disqualified)
    .sort((a, b) => b.score - a.score);
  const familyMargin = alternatives.length > 1 ? alternatives[0].score - alternatives[1].score : 1;
  const coordinateAlternatives = canonical.reflectionSource ? [canonical.canonicalDisplayName] : [];
  const closestTerritories = Array.from(new Set([
    ...alternatives.slice(0, 2).map((candidate) => candidate.family),
    ...coordinateAlternatives,
  ])).slice(0, 3);
  const missingPenalty = canonical.evidenceLedger.missing.length >= 2 ? 0.08 : canonical.evidenceLedger.missing.length ? 0.04 : 0;
  const tiePenalty = familyMargin < 0.08 ? 0.08 : familyMargin < 0.14 ? 0.04 : 0;
  const confidence = clamp(canonical.confidence - missingPenalty - tiePenalty);
  const decisive = confidence >= 0.72 && familyMargin >= 0.14 && canonical.resultType === "single";
  return {
    title: selected.title,
    fingerprintCode: hashFingerprint(componentKey),
    territory: canonical.canonicalDisplayName,
    dominantState: selected.dominantState,
    supportingQuality: selected.supportingQuality,
    closestTerritories,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    decisive,
    componentKey,
    ruleId: selected.id,
  };
}

export function buildResonanceNarrative(domains: UserResultDomain[], canonical: CanonicalPatternResult, completeness?: ScanCompleteness): ResonanceNarrative {
  const components = domains.map(componentFor);
  const relationships = buildRelationships(components);
  const generatedPattern = buildGeneratedPattern(components, canonical);
  const demands = components.filter((component) => component.orientation === "demand").sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));
  const resources = components.filter((component) => component.orientation === "resource").sort((a, b) => b.score - a.score);
  const balanced = components.filter((component) => component.orientation === "balanced").sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));
  const primaryRelationship = relationships[0];
  const lead = demands[0] ?? resources[0] ?? balanced[0] ?? components[0];
  const support = resources[0] ?? balanced.find((component) => component.domain !== lead.domain) ?? components.find((component) => component.domain !== lead.domain) ?? lead;

  const introduction = primaryRelationship
    ? `${primaryRelationship.statement} ${support.observation}`
    : `${lead.observation} ${support.observation}`;
  const beneathTheSurface = relationships[1]?.statement
    ?? `The strongest theme is ${generatedPattern.dominantState.toLowerCase()}, supported by ${generatedPattern.supportingQuality.toLowerCase()}.`;
  const howThisOftenFeels = Array.from(new Set([
    ...(primaryRelationship ? primaryRelationship.evidence.flatMap((evidence) => byTitle(components, evidence.domain)?.oftenFeelsLike ?? []) : []),
    ...lead.oftenFeelsLike,
    ...support.oftenFeelsLike,
  ])).slice(0, 6);
  const whatOthersMayNotice = Array.from(new Set([
    DOMAIN_LANGUAGE[support.domain].others,
    DOMAIN_LANGUAGE[lead.domain].others,
    ...balanced.slice(0, 2).map((component) => DOMAIN_LANGUAGE[component.domain].others),
  ])).slice(0, 4);
  const strengthToday = resources.length
    ? `${resources[0].observation} ${resources[0].strength}`
    : `${support.observation} Even while some areas are asking for support, this capacity remains available.`;
  const worthNoticing = lead.tradeoff ?? "Continuing to function does not always mean the effort is fully sustainable.";
  const reflectionQuestion = lead.domain === "Recovery & Restoration"
    ? "What could be protected today so recovery does not have to wait until everything else is finished?"
    : `What would help ${DOMAIN_LANGUAGE[lead.domain].subject} feel more supported today?`;
  const limitations = [
    "This describes the present scan rather than a permanent identity.",
    "Every narrative statement is traceable to scored domains and preserved signal references.",
  ];
  if (!generatedPattern.decisive) limitations.push("The pattern title represents the best current synthesis, while nearby territories remain relevant context.");
  if (canonical.evidenceLedger.missing.length) limitations.push("Missing camera or baseline evidence reduced pattern certainty.");
  if (completeness?.qualityLevel === "limited") limitations.push("Limited clear voice data kept the interpretation intentionally broad.");
  else if (completeness?.status === "partial") limitations.push("Only recordings captured clearly were used.");

  return {
    engineVersion: RESONANCE_NARRATIVE_ENGINE_VERSION,
    generatedPattern,
    introduction,
    beneathTheSurface,
    howThisOftenFeels,
    whatOthersMayNotice,
    strengthToday,
    worthNoticing,
    reflectionQuestion,
    components,
    relationships,
    evidenceLedger: components.map((component) => component.evidence),
    limitations,
  };
}
