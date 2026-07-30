import type { CanonicalDimensionRecord } from "./canonicalDimensionEngine";
import type { CanonicalSoulScopeResult } from "./canonicalResult";
import type { PhaseCIntelligence } from "./phaseCInsightEngine";

export const TODAYS_STORY_ENGINE_VERSION = "todays-story-v0.1";

export type TodaysStory = {
  title: string;
  essence: string;
  reflection: string;
  howThisMayShowUp: string[];
  worthNoticing: string;
  gentleNextStep: string;
  trace: {
    dimensions: string[];
    meanings: string[];
    interactions: string[];
    evidence: string[];
    decisionId: string;
    ruleVersion: string;
  };
};

const BLOCKED_VISIBLE_TERMS = /\bscan(?:s|ned|ning)?\b|candidate|neighboring pattern|similarly supported|boundary|geometry|decision|ledger|canonical|correlat/gi;

function scoreDimension(dimension: CanonicalDimensionRecord) {
  return Math.abs(dimension.value - 0.5) * dimension.confidence * Math.max(0.2, dimension.evidenceCoverage);
}

function strongestDimensions(result: CanonicalSoulScopeResult) {
  return [...result.phaseBDimensions.records]
    .filter((dimension) => dimension.evidenceCoverage > 0)
    .sort((left, right) => scoreDimension(right) - scoreDimension(left))
    .slice(0, 4);
}

function dimensionName(id: string) {
  const names: Record<string, string> = {
    "COG-P1": "organization",
    "COG-P2": "flexibility",
    "COG-P3": "focus",
    "COG-P4": "mental effort",
    "REG-P1": "activation",
    "REG-P2": "steadiness",
    "REG-P3": "adaptability",
    "REG-P4": "recovery",
    "CAP-P1": "engagement",
    "CAP-P2": "reserve",
    "CAP-P3": "effort",
    "CAP-P4": "sustainability",
    "EXP-P1": "range",
    "EXP-P2": "openness",
    "EXP-P3": "restraint",
    "EXP-P4": "responsiveness",
  };
  return names[id] ?? "presence";
}

function adjectiveFor(dimension: CanonicalDimensionRecord) {
  const value = dimension.value;
  const high = value >= 0.56;
  const names: Record<string, [string, string]> = {
    "COG-P1": ["clear", "loose"],
    "COG-P2": ["adaptive", "direct"],
    "COG-P3": ["focused", "open"],
    "COG-P4": ["careful", "easy"],
    "REG-P1": ["energized", "quiet"],
    "REG-P2": ["steady", "sensitive"],
    "REG-P3": ["flexible", "contained"],
    "REG-P4": ["restorative", "held"],
    "CAP-P1": ["engaged", "conserving"],
    "CAP-P2": ["resourced", "careful"],
    "CAP-P3": ["effortful", "unforced"],
    "CAP-P4": ["sustainable", "tender"],
    "EXP-P1": ["expressive", "subtle"],
    "EXP-P2": ["open", "selective"],
    "EXP-P3": ["contained", "unguarded"],
    "EXP-P4": ["responsive", "inward"],
  };
  const pair = names[dimension.dimensionId] ?? ["present", "quiet"];
  return high ? pair[0] : pair[1];
}

function nounFor(dimensions: CanonicalDimensionRecord[]) {
  const ids = dimensions.map((dimension) => dimension.dimensionId);
  if (ids.some((id) => id.startsWith("REG")) && ids.some((id) => id.startsWith("CAP"))) return "Recovery";
  if (ids.some((id) => id.startsWith("COG")) && ids.some((id) => id.startsWith("REG"))) return "Integration";
  if (ids.some((id) => id.startsWith("COG")) && ids.some((id) => id.startsWith("EXP"))) return "Communication";
  if (ids.some((id) => id.startsWith("EXP")) && ids.some((id) => id.startsWith("CAP"))) return "Presence";
  if (ids.some((id) => id.startsWith("COG"))) return "Clarity";
  if (ids.some((id) => id.startsWith("REG"))) return "Restoration";
  if (ids.some((id) => id.startsWith("CAP"))) return "Capacity";
  if (ids.some((id) => id.startsWith("EXP"))) return "Expression";
  return "Presence";
}

function composeTitle(dimensions: CanonicalDimensionRecord[]) {
  const lead = dimensions[0];
  const second = dimensions.find((dimension) => adjectiveFor(dimension) !== adjectiveFor(lead));
  const adjective = [lead, second].filter((item): item is CanonicalDimensionRecord => Boolean(item)).map(adjectiveFor)[0] ?? "Quiet";
  const noun = nounFor(dimensions.slice(0, 3));
  return `${adjective.charAt(0).toUpperCase()}${adjective.slice(1)} ${noun}`;
}

function qualityPhrase(dimensions: CanonicalDimensionRecord[]) {
  return dimensions.slice(0, 3).map((dimension) => dimensionName(dimension.dimensionId));
}

function cleanVisible(value: string) {
  return value
    .replace(BLOCKED_VISIBLE_TERMS, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackStory(result: CanonicalSoulScopeResult): TodaysStory {
  return {
    title: "Quiet Presence",
    essence: "Today your voice reflected a quieter, still-forming pattern.",
    reflection: "Today your voice offered enough to notice the moment gently, but not enough to turn it into a fixed story. The clearest observation is that some parts of you were present while others stayed less defined.",
    howThisMayShowUp: [
      "You may feel more aware of small shifts than sweeping conclusions.",
      "You might notice yourself needing a little more time before naming what is true.",
      "Simple conversations may feel easier than trying to explain the whole day at once.",
    ],
    worthNoticing: "Not every meaningful day arrives with a single clear theme.",
    gentleNextStep: "Choose one quiet moment today and ask what feels present without needing to explain it yet.",
    trace: {
      dimensions: [],
      meanings: result.meaningObjects.records.map((meaning) => meaning.meaning_id),
      interactions: result.phaseBInteractions.records.map((interaction) => interaction.interactionId),
      evidence: result.evidenceLedger.records.filter((record) => !record.missingEvidence).map((record) => record.evidenceId),
      decisionId: result.decisionLedger.record.decisionId,
      ruleVersion: TODAYS_STORY_ENGINE_VERSION,
    },
  };
}

export function buildTodaysStory(result: CanonicalSoulScopeResult, phaseC?: PhaseCIntelligence): TodaysStory {
  const dimensions = strongestDimensions(result);
  if (!dimensions.length) return fallbackStory(result);

  const title = composeTitle(dimensions);
  const qualities = qualityPhrase(dimensions);
  const lead = qualities[0] ?? "presence";
  const second = qualities[1] ?? "care";
  const third = qualities[2] ?? "steadiness";
  const synthesized = phaseC?.insightSynthesis.headline;
  const synthesisLine = synthesized
    ? `A larger thread also appears: ${synthesized.summary.charAt(0).toLowerCase()}${synthesized.summary.slice(1)}`
    : "";

  const story: TodaysStory = {
    title,
    essence: `Today your voice reflected ${lead} with ${second} close behind it.`,
    reflection: [
      `Today you sounded like someone carrying ${lead} while also making room for ${second}.`,
      `The strongest impression was not a single label, but the way ${lead}, ${second}, and ${third} worked together in this moment.`,
      synthesisLine,
    ].filter(Boolean).join(" "),
    howThisMayShowUp: [
      `You may find yourself responding from ${lead} rather than reacting quickly.`,
      second === "restraint" || second === "reserve" || second === "sustainability"
        ? "Conversations may feel better when they leave you enough room to choose your words carefully."
        : "Conversations may feel easier when you can stay with one thread long enough to understand it.",
      third === "mental effort" || third === "effort"
        ? "You might finish important things carefully instead of rushing to start the next thing."
        : "You might notice yourself doing best when the day gives you a little space to stay steady.",
    ],
    worthNoticing: `The useful thing to notice is how ${lead} and ${second} coexist today. One may be helping the other, rather than competing with it.`,
    gentleNextStep: second === "restraint" || second === "reserve"
      ? "If you have a quiet moment later today, ask whether you are protecting your energy or simply choosing your words more carefully. You do not need to change it; just notice which one feels true."
      : "Pay attention to one conversation today. Notice whether you naturally listen a little longer before responding. You do not need to change anything; just observe whether that tendency appears.",
    trace: {
      dimensions: dimensions.map((dimension) => dimension.dimensionId),
      meanings: result.meaningObjects.records.map((meaning) => meaning.meaning_id),
      interactions: result.phaseBInteractions.records.map((interaction) => interaction.interactionId),
      evidence: Array.from(new Set([
        ...dimensions.flatMap((dimension) => dimension.supportingEvidence),
        ...(synthesized?.supportingEvidence ?? []),
      ])).sort(),
      decisionId: result.decisionLedger.record.decisionId,
      ruleVersion: TODAYS_STORY_ENGINE_VERSION,
    },
  };

  return {
    ...story,
    title: cleanVisible(story.title) || "Quiet Presence",
    essence: cleanVisible(story.essence),
    reflection: cleanVisible(story.reflection),
    howThisMayShowUp: story.howThisMayShowUp.map(cleanVisible),
    worthNoticing: cleanVisible(story.worthNoticing),
    gentleNextStep: cleanVisible(story.gentleNextStep),
  };
}
