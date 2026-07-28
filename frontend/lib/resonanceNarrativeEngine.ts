import type { CanonicalPatternResult } from "./canonicalPattern";
import type { ScanCompleteness } from "./partialScan";
import type { ScoreBand, UserResultDomain, UserResultDomainName } from "./systemDimensions";

export const RESONANCE_NARRATIVE_ENGINE_VERSION = "resonance-narrative-v1-preview";

type NarrativeTone = "resource" | "balanced" | "demand";

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
    confidence: number;
    componentKey: string;
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
  const isLoad = domain.title === "Focus & Mental Load";
  if (isLoad) {
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
    low: "Your energy appears quieter today, which may make selectivity and pacing more important than pushing for constant output.",
    positive: ["You may feel more ready to begin than to postpone.", "Momentum may come more naturally once you choose a direction."],
    caution: "Available energy can make it tempting to take on more than the rest of your system wants to sustain.",
    others: "Others may notice a stronger sense of presence or momentum around you.",
  },
  "Recovery & Restoration": {
    subject: "recovery capacity",
    high: "Your system appears to have meaningful reserves available today. Even when demands increase, you seem more capable of regaining your footing than remaining depleted.",
    balanced: "Recovery appears available, though it may work best when effort is followed by real pauses rather than continuous output.",
    low: "Recovery looks less accessible today, suggesting your system may benefit from fewer demands and more room to restore.",
    positive: ["You may recover your footing more quickly after effort.", "A difficult moment may feel temporary rather than consuming."],
    caution: "Feeling capable again can sometimes hide how much restoration was required to get there.",
    others: "Others may experience you as steady even when you have already spent significant energy adapting.",
  },
  "Communication & Clarity": {
    subject: "communication clarity",
    high: "Your thoughts appear readily available for expression, making it easier to communicate clearly and move conversations forward.",
    balanced: "Your communication appears measured today, with enough clarity to express what matters without needing to fill every silence.",
    low: "Your words may need more time to form today, especially when the subject carries emotional or cognitive weight.",
    positive: ["You may find it easier to explain what you mean.", "Conversations may feel more direct and less effortful."],
    caution: "Clarity can become overexplaining when you feel responsible for making everyone understand.",
    others: "Others may experience you as thoughtful, clear, or easier to follow today.",
  },
  "Emotional Expression": {
    subject: "emotional availability",
    high: "Your emotional range appears close enough to the surface to be expressed, understood, or used creatively rather than remaining entirely internal.",
    balanced: "Emotion appears available without dominating the whole picture, supporting expression with some room for perspective.",
    low: "Emotional expression appears more protected today, which may reflect privacy, careful processing, or a need for greater safety before opening.",
    positive: ["You may be more aware of what you feel while it is happening.", "Creative or relational expression may feel more accessible."],
    caution: "When emotion is highly available, other people may see the intensity before they understand its meaning.",
    others: "Others may notice more warmth, sensitivity, or emotional immediacy in your presence.",
  },
  "Connection & Support": {
    subject: "relational availability",
    high: "You appear available for connection today, with enough openness to receive support as well as offer it.",
    balanced: "Connection appears accessible, though you may still be selective about where your attention and trust are placed.",
    low: "Your relational energy appears more protected, suggesting space, safety, or lower social demand may feel especially valuable.",
    positive: ["You may find it easier to let people meet you where you are.", "Support may feel more usable rather than intrusive."],
    caution: "Being naturally available to others can make your own need for support less visible.",
    others: "Others may experience you as approachable, attentive, or emotionally present.",
  },
  "Focus & Mental Load": {
    subject: "mental demand",
    high: "Your mind appears to be carrying several active threads at once. There may be strong processing capacity present, but it is currently being asked to do a great deal.",
    balanced: "Your mental load appears active but manageable, allowing you to engage without every thought competing for attention.",
    low: "Your cognitive field appears relatively uncluttered today, leaving more room for presence, spontaneity, or unhurried decisions.",
    positive: ["You may be able to hold complexity and still find the central thread.", "Important details may remain accessible even while several things are moving."],
    caution: "Sustained processing can look like productivity from the outside while still becoming tiring internally.",
    others: "Others may notice concentration and capability without seeing how many mental tabs are open underneath it.",
  },
  "Direction & Adaptability": {
    subject: "adaptability",
    high: "You seem able to move fluidly through different aspects of your life, adjusting as new information, challenges, or opportunities emerge. Rather than becoming rigid when circumstances change, your system appears comfortable reorganizing itself while staying connected to what matters most.",
    balanced: "You appear able to adjust when needed while still preferring enough continuity to stay oriented and intentional.",
    low: "Change may require more preparation today, making clarity, predictability, and time to adjust especially supportive.",
    positive: ["You may adapt naturally as conversations, plans, or priorities evolve.", "You may find a new route without losing sight of the original purpose."],
    caution: "Because adapting comes naturally, it can be easy to keep adjusting around other people's needs without pausing to ask what you need.",
    others: "Others may experience you as flexible, capable, or calm during change.",
  },
  Regulation: {
    subject: "inner steadiness",
    high: "Your system appears able to stay engaged while returning toward balance, creating steadiness without requiring emotional flatness.",
    balanced: "Your regulation appears usable today, with enough flexibility to respond and enough stability to settle again.",
    low: "Your system may be taking longer to settle after stimulation, making pace, predictability, and lower pressure more valuable.",
    positive: ["You may respond thoughtfully without losing access to your feelings.", "You may regain balance instead of remaining caught in a difficult moment."],
    caution: "Appearing composed can sometimes make the effort required to stay regulated invisible to others.",
    others: "Others may experience you as grounded, measured, or reassuring today.",
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

function relationship(
  id: string,
  statement: string,
  components: Array<ComponentNarrative | undefined>,
): RelationshipNarrative | undefined {
  const present = components.filter((component): component is ComponentNarrative => Boolean(component));
  if (present.length !== components.length) return undefined;
  const confidence = clamp(present.reduce((sum, component) => sum + Math.abs(component.score - 50) / 50, 0) / present.length);
  return { id, statement, evidence: present.map((component) => component.evidence), confidence };
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
  const relationships: Array<RelationshipNarrative | undefined> = [];

  if (load && recovery && load.score >= 67 && recovery.score >= 67) {
    relationships.push(relationship("load-supported-by-recovery", "You appear to be carrying meaningful mental demand, but recovery capacity is helping that demand remain workable rather than consuming the whole system.", [load, recovery]));
  } else if (load && recovery && load.score >= 67 && recovery.score <= 40) {
    relationships.push(relationship("load-exceeds-recovery", "Your current mental demand appears to be moving faster than your available recovery, which may make even familiar responsibilities feel more expensive than usual.", [load, recovery]));
  }

  if (adaptability && regulation && adaptability.score >= 67 && regulation.score >= 67) {
    relationships.push(relationship("regulated-adaptability", "Flexibility and steadiness appear to be working together, helping you adjust as circumstances change without losing your center.", [adaptability, regulation]));
  }

  if (clarity && emotion && clarity.score >= 67 && emotion.score >= 67) {
    relationships.push(relationship("clear-emotional-expression", "What you feel and what you are able to communicate appear closely aligned, making honest expression more accessible today.", [clarity, emotion]));
  } else if (clarity && emotion && clarity.score >= 67 && emotion.score <= 40) {
    relationships.push(relationship("clear-protected-expression", "Your thinking may be clear while your emotional world remains more private, allowing you to communicate effectively without revealing everything underneath it.", [clarity, emotion]));
  }

  if (connection && recovery && connection.score >= 67 && recovery.score <= 40) {
    relationships.push(relationship("connection-costs-recovery", "You remain available to others even while recovery is less accessible, a combination that can feel generous but become costly when it continues too long.", [connection, recovery]));
  }

  if (energy && load && energy.score >= 67 && load.score <= 66) {
    relationships.push(relationship("usable-momentum", "Available energy is not being matched by excessive mental demand, creating room for momentum that may feel purposeful rather than pressured.", [energy, load]));
  }

  return relationships.filter((item): item is RelationshipNarrative => Boolean(item)).sort((a, b) => b.confidence - a.confidence);
}

const ADJECTIVES: Record<UserResultDomainName, string> = {
  "Energy & Vitality": "Energized",
  "Recovery & Restoration": "Resilient",
  "Communication & Clarity": "Clear-Sighted",
  "Emotional Expression": "Open-Hearted",
  "Connection & Support": "Connected",
  "Focus & Mental Load": "Deep-Processing",
  "Direction & Adaptability": "Adaptive",
  Regulation: "Grounded",
};

const NOUNS: Record<UserResultDomainName, string> = {
  "Energy & Vitality": "Initiator",
  "Recovery & Restoration": "Restorer",
  "Communication & Clarity": "Communicator",
  "Emotional Expression": "Expressor",
  "Connection & Support": "Bridge Builder",
  "Focus & Mental Load": "Strategist",
  "Direction & Adaptability": "Navigator",
  Regulation: "Anchor",
};

function generatedPattern(components: ComponentNarrative[], canonical: CanonicalPatternResult) {
  const resources = [...components]
    .filter((component) => component.orientation === "resource")
    .sort((a, b) => b.score - a.score);
  const balanced = [...components]
    .filter((component) => component.orientation === "balanced")
    .sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));
  const first = resources[0] ?? balanced[0] ?? components[0];
  const second = resources.find((component) => component.domain !== first.domain)
    ?? balanced.find((component) => component.domain !== first.domain)
    ?? components.find((component) => component.domain !== first.domain)
    ?? first;
  const title = `The ${ADJECTIVES[first.domain]} ${NOUNS[second.domain]}`;
  const componentKey = [...components]
    .sort((a, b) => a.domain.localeCompare(b.domain))
    .map((component) => `${component.domain.replaceAll(" ", "-").toLowerCase()}:${BAND_ORDER.indexOf(component.band)}`)
    .join("|");
  let hash = 2166136261;
  for (const character of componentKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const fingerprintCode = Math.abs(hash >>> 0).toString(36).toUpperCase().padStart(7, "0");
  return {
    title,
    fingerprintCode,
    territory: canonical.canonicalDisplayName,
    confidence: canonical.confidence,
    componentKey,
  };
}

export function buildResonanceNarrative(
  domains: UserResultDomain[],
  canonical: CanonicalPatternResult,
  completeness?: ScanCompleteness,
): ResonanceNarrative {
  const components = domains.map(componentFor);
  const relationships = buildRelationships(components);
  const rankedResources = components.filter((component) => component.orientation === "resource").sort((a, b) => b.score - a.score);
  const rankedDemands = components.filter((component) => component.orientation === "demand").sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));
  const lead = rankedResources[0] ?? components[0];
  const second = rankedResources[1] ?? components.find((component) => component.domain !== lead.domain) ?? lead;
  const primaryRelationship = relationships[0];
  const introduction = primaryRelationship
    ? `Today's scan suggests ${primaryRelationship.statement.charAt(0).toLowerCase()}${primaryRelationship.statement.slice(1)} ${lead.observation}`
    : `Today's scan is led by ${DOMAIN_LANGUAGE[lead.domain].subject}, with ${DOMAIN_LANGUAGE[second.domain].subject} adding important context. ${lead.observation}`;
  const beneathTheSurface = primaryRelationship?.statement
    ?? `${lead.observation} ${second.observation}`;
  const positiveFeelings = rankedResources.flatMap((component) => component.oftenFeelsLike).slice(0, 5);
  const balancedFeelings = components.filter((component) => component.orientation === "balanced").flatMap((component) => component.oftenFeelsLike).slice(0, 2);
  const howThisOftenFeels = [...positiveFeelings, ...balancedFeelings].slice(0, 6);
  const whatOthersMayNotice = rankedResources.slice(0, 3).map((component) => DOMAIN_LANGUAGE[component.domain].others);
  const worthNoticing = rankedDemands[0]?.tradeoff
    ?? rankedResources.find((component) => component.tradeoff)?.tradeoff
    ?? "Even a capable system benefits from noticing where effort is being spent automatically rather than intentionally.";
  const strengthToday = `${lead.strength} ${second.strength}`;
  const reflectionQuestion = rankedDemands[0]
    ? `What would help ${DOMAIN_LANGUAGE[rankedDemands[0].domain].subject} feel more supported today?`
    : `Where is your strongest capacity serving what matters most to you today?`;
  const limitations = [
    "Narrative statements describe this scan only and are not permanent traits.",
    "Every statement is assembled from scored domains and preserved signal references.",
  ];
  if (completeness?.qualityLevel === "limited") {
    limitations.push("The scan contained limited clear voice data, so the narrative remains intentionally broad.");
  } else if (completeness?.status === "partial") {
    limitations.push("The narrative uses only the recordings that were captured clearly.");
  }

  return {
    engineVersion: RESONANCE_NARRATIVE_ENGINE_VERSION,
    generatedPattern: generatedPattern(components, canonical),
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
