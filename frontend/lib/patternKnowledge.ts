import type { PatternId, PatternMatch } from "./resonancePatterns";
import type { BaselineComparison } from "./patternPersonalization";
import type { UserResultDomain } from "./systemDimensions";

export type LongitudinalMessageKind =
  | "firstObservation"
  | "emerging"
  | "recurring"
  | "consistent"
  | "noticeablyDifferent";

export type PatternKnowledgeEntry = {
  summary: string;
  explanation: [string, string];
  defaultObservationBullets: [string, string, string];
  dailyLife: [string, string, string, string];
  reflectionQuestions: [string, string, string, string];
  longitudinal: Record<LongitudinalMessageKind, string[]>;
};

export type PatternPresentation = {
  summary: string;
  explanation: [string, string];
  observedBullets: [string, string, string];
  dailyLife: [string, string, string, string];
  reflectionQuestion: string;
  longitudinalMessage: string;
};

const sharedFirst = [
  "This is the first time this pattern has appeared in your saved scans. Future scans will show whether it was specific to today or begins to repeat.",
  "One scan captures a moment. More history will show whether this pattern returns or changes with time.",
];

const PATTERN_KNOWLEDGE: Record<PatternId, PatternKnowledgeEntry> = {
  "overextended-achiever": {
    summary: "You may still be moving forward effectively while recovery struggles to keep pace with everything you are asking of yourself.",
    explanation: [
      "This pattern often appears when capability remains available, but the effort required to maintain momentum has become more noticeable.",
      "You may still have direction, motivation, and the ability to respond. The quieter question is whether restoration is keeping up with output.",
    ],
    defaultObservationBullets: [
      "Forward momentum remained available.",
      "Recovery may be asking for more attention.",
      "Mental effort carried more of the load in this scan.",
    ],
    dailyLife: [
      "Completing what needs to be done, then realizing how much energy it required.",
      "Finding it easier to keep going than to fully pause.",
      "Staying focused on progress while recovery gets postponed.",
      "Appearing capable to others while privately needing more room to reset.",
    ],
    reflectionQuestions: [
      "Where might a little more recovery make the biggest difference?",
      "What are you still pushing forward that could move at a gentler pace?",
      "Where has effort become automatic, even when it is no longer necessary?",
      "What would change if restoration mattered as much as progress today?",
    ],
    longitudinal: {
      firstObservation: sharedFirst,
      emerging: ["This pattern is beginning to appear in your recent scans. A few more scans will show whether it is temporary or becoming familiar."],
      recurring: ["This pattern has returned in several recent scans. The relationship between output and recovery may be worth noticing over time."],
      consistent: ["This pattern has appeared consistently. The steady gap between effort and restoration may be worth paying attention to."],
      noticeablyDifferent: ["Today differs from your recent pattern. Future scans will show whether this is a temporary change in pace or the beginning of a new rhythm."],
    },
  },
  "deep-processor": {
    summary: "You may be taking in more than you are ready to resolve, giving your mind extra work before clarity can fully settle.",
    explanation: [
      "This pattern often appears when reflection is active and several thoughts, decisions, or emotional threads remain open at once.",
      "The processing itself may be useful. It can also make rest, communication, or forward movement feel slower until the pieces begin to organize.",
    ],
    defaultObservationBullets: [
      "Reflection pauses were more present.",
      "Mental demand carried more of the effort.",
      "Expression may need a little more time before it feels clear.",
    ],
    dailyLife: [
      "Replaying conversations or possibilities after the moment has passed.",
      "Needing extra time before knowing what you really think or want to say.",
      "Holding several unfinished thoughts in the background at once.",
      "Feeling clearer after quiet reflection than during immediate pressure.",
    ],
    reflectionQuestions: [
      "What may become clearer if you stop asking yourself to resolve it immediately?",
      "Which unfinished thought has been taking up the most space?",
      "What would help one open loop feel complete enough for today?",
      "Where could you give yourself more time before deciding?",
    ],
    longitudinal: {
      firstObservation: sharedFirst,
      emerging: ["This reflective pattern is beginning to appear. More scans will show whether it is connected to this moment or becoming more familiar."],
      recurring: ["A similar processing pattern has returned across recent scans. It may be worth noticing what tends to remain unresolved during those periods."],
      consistent: ["This pattern has remained consistent across your recent scans. Extended reflection appears to be a familiar part of your current rhythm."],
      noticeablyDifferent: ["Today's scan shows a different processing rhythm from your recent pattern. Future scans will help clarify whether the shift continues."],
    },
  },
  "guarded-but-responsive": {
    summary: "You may still be present and responsive while holding part of your expression carefully in reserve.",
    explanation: [
      "This pattern often appears when openness is available, but some part of you is still checking the conditions before fully relaxing or expressing what is underneath.",
      "That caution does not mean you are disconnected. It may reflect a current need for more time, trust, privacy, or emotional safety before expression feels effortless.",
    ],
    defaultObservationBullets: [
      "Responsiveness remained available.",
      "Expression appeared more carefully held.",
      "Steadiness was present alongside some protective restraint.",
    ],
    dailyLife: [
      "Being engaged in a conversation while choosing your words more carefully than usual.",
      "Wanting connection, but needing to feel safe before becoming fully open.",
      "Sharing what is manageable while keeping more vulnerable feelings private.",
      "Appearing calm while quietly monitoring how the situation is unfolding.",
    ],
    reflectionQuestions: [
      "Where do you feel ready to open, but not quite ready to soften?",
      "What would make honest expression feel a little safer today?",
      "What have you been protecting that may need gentler conditions rather than more pressure?",
      "Where might you need more trust before offering more of yourself?",
    ],
    longitudinal: {
      firstObservation: sharedFirst,
      emerging: ["This more careful style of expression is beginning to appear. Future scans will show whether it is specific to the present circumstances."],
      recurring: ["This pattern has returned in several scans. It may be worth noticing when openness feels available and when it begins to narrow."],
      consistent: ["This pattern has appeared consistently. Careful expression seems to be a familiar part of your recent rhythm."],
      noticeablyDifferent: ["Today's expression differs from your recent pattern. More scans will show whether this change is brief or continues."],
    },
  },
  "recovering-adapter": {
    summary: "You may be regaining capacity while still adjusting to demands that have not completely passed.",
    explanation: [
      "This pattern often appears when some areas are beginning to feel more available, even though the broader process of recovery or adjustment is still underway.",
      "The movement may be uneven. You can have more energy, clarity, or steadiness in one area while another still needs patience and support.",
    ],
    defaultObservationBullets: [
      "Some capacity appears to be returning.",
      "Adaptability remained available.",
      "Recovery is still unfolding rather than fully complete.",
    ],
    dailyLife: [
      "Having more energy than before, but not yet wanting to spend it all at once.",
      "Feeling capable in some moments and more easily depleted in others.",
      "Returning to familiar routines while still needing flexibility.",
      "Noticing small signs of steadiness before the whole picture feels settled.",
    ],
    reflectionQuestions: [
      "What feels more available now than it did before?",
      "Where would consistency help more than intensity?",
      "What part of your recovery deserves patience rather than pressure?",
      "What small sign of returning capacity have you nearly overlooked?",
    ],
    longitudinal: {
      firstObservation: sharedFirst,
      emerging: ["This pattern is beginning to appear. Future scans will show whether the returning capacity continues to become more established."],
      recurring: ["This pattern has returned across recent scans. Capacity may be rebuilding in stages rather than all at once."],
      consistent: ["This pattern has appeared consistently. Gradual adaptation and returning capacity have become a recognizable part of your recent scans."],
      noticeablyDifferent: ["Today's scan differs from your recent recovery pattern. Future scans will show whether this is a temporary variation or a new phase."],
    },
  },
  "quietly-overloaded": {
    summary: "You may be steadily maintaining while quietly carrying more than your system has fully recovered from.",
    explanation: [
      "This pattern often appears when there is no single dramatic point of strain, but effort is spread across several areas at once.",
      "You may still look functional and composed. Underneath that steadiness, recovery, attention, or emotional space may be receiving less room than they need.",
    ],
    defaultObservationBullets: [
      "Recovery may be asking for more attention.",
      "Your responses remained steady throughout the scan.",
      "Effort appeared distributed across several areas.",
    ],
    dailyLife: [
      "Continuing to get things done while feeling more drained than expected.",
      "Needing more quiet time before feeling fully restored.",
      "Focusing on responsibilities before your own recovery.",
      "Others may see you as coping well, even when it feels more demanding internally.",
    ],
    reflectionQuestions: [
      "What has become so familiar that you have stopped noticing it?",
      "Where might a little more recovery make the biggest difference?",
      "What has quietly been asking for more of your attention?",
      "What have you been carrying that no longer feels temporary?",
    ],
    longitudinal: {
      firstObservation: sharedFirst,
      emerging: ["This pattern is beginning to appear in your scans. More history will show whether the current load is temporary or becoming familiar."],
      recurring: ["This pattern has appeared in several recent scans. The consistency may be worth paying attention to over time."],
      consistent: ["This pattern has remained consistent. Quiet, distributed effort appears to be a recurring part of your recent experience."],
      noticeablyDifferent: ["Today's observations differ from your recent pattern. Future scans will help determine whether this is temporary or the beginning of a new trend."],
    },
  },
  "balanced-regulator": {
    summary: "You may have enough steadiness, flexibility, and available recovery to respond without one area carrying most of the strain.",
    explanation: [
      "This pattern often appears when effort and recovery are relatively well distributed, allowing expression, attention, and adaptability to remain accessible.",
      "Balance does not mean everything is effortless. It means the current demands are not clearly overwhelming the resources available to meet them.",
    ],
    defaultObservationBullets: [
      "Steadiness remained available.",
      "Expression and adaptability were relatively accessible.",
      "No single area carried most of the strain.",
    ],
    dailyLife: [
      "Moving between responsibilities without feeling pulled too far in one direction.",
      "Recovering more easily after effort or emotional demand.",
      "Finding words and decisions with less internal friction.",
      "Feeling able to respond without needing to force the response.",
    ],
    reflectionQuestions: [
      "What is helping this steadiness feel possible right now?",
      "Which part of your current rhythm is most worth protecting?",
      "What have you been doing differently that may be supporting this balance?",
      "Where could you let enough be enough today?",
    ],
    longitudinal: {
      firstObservation: sharedFirst,
      emerging: ["This steadier pattern is beginning to appear. More scans will show whether it remains available across different circumstances."],
      recurring: ["This pattern has returned across recent scans. The conditions supporting this steadiness may be worth noticing."],
      consistent: ["This pattern has appeared consistently. Steadiness and available capacity have become familiar features of your recent scans."],
      noticeablyDifferent: ["Today's balance differs from your recent pattern. Future scans will show whether the shift continues or reflects this particular moment."],
    },
  },
};

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) result = (result * 31 + value.charCodeAt(index)) >>> 0;
  return result;
}

function choose<T>(items: T[], seed: string): T {
  return items[hash(seed) % items.length];
}

function domainSubject(title: string): string {
  if (title.includes("Recovery")) return "Recovery";
  if (title.includes("Mental") || title.includes("Focus")) return "Mental demand";
  if (title.includes("Communication") || title.includes("Expression")) return "Expression";
  if (title.includes("Regulation")) return "Steadiness";
  if (title.includes("Energy")) return "Energy";
  if (title.includes("Adaptability") || title.includes("Direction")) return "Adaptability";
  if (title.includes("Emotional")) return "Emotional flexibility";
  return title;
}

function observedDomainLine(domain: UserResultDomain): string {
  const subject = domainSubject(domain.title);
  if (["Asking for Support", "Recovering", "Less Accessible"].includes(domain.functionalState)) return `${subject} may be asking for more attention.`;
  if (["Working Hard", "Under Pressure"].includes(domain.functionalState)) return `${subject} carried more of the effort in this scan.`;
  return `${subject} remained available throughout the scan.`;
}

export function getPatternKnowledge(patternId: PatternId): PatternKnowledgeEntry {
  return PATTERN_KNOWLEDGE[patternId];
}

export function buildObservedBullets(
  patternId: PatternId,
  domains: UserResultDomain[],
  baseline: BaselineComparison,
): [string, string, string] {
  const knowledge = getPatternKnowledge(patternId);
  const lines: string[] = [];
  const changed = baseline.available
    ? baseline.changes.find((change) => change.direction !== "stable") ?? baseline.changes[0]
    : undefined;
  if (changed?.userFacingSummary) lines.push(changed.userFacingSummary);

  const support = [...domains]
    .filter((domain) => ["Asking for Support", "Recovering", "Less Accessible"].includes(domain.functionalState))
    .sort((a, b) => a.score - b.score)[0];
  const hard = [...domains]
    .filter((domain) => ["Working Hard", "Under Pressure"].includes(domain.functionalState))
    .sort((a, b) => b.score - a.score)[0];
  const available = [...domains]
    .filter((domain) => ["Readily Available", "Highly Engaged", "Available", "Balanced"].includes(domain.functionalState))
    .sort((a, b) => b.score - a.score)[0] ?? [...domains].sort((a, b) => b.score - a.score)[0];

  [support, hard, available].forEach((domain) => {
    if (!domain) return;
    const line = observedDomainLine(domain);
    if (!lines.includes(line)) lines.push(line);
  });
  knowledge.defaultObservationBullets.forEach((line) => {
    if (!lines.includes(line)) lines.push(line);
  });
  return lines.slice(0, 3) as [string, string, string];
}

export function buildPatternPresentation(
  pattern: PatternMatch,
  domains: UserResultDomain[],
  baseline: BaselineComparison,
  seed: string,
): PatternPresentation {
  const knowledge = getPatternKnowledge(pattern.id);
  return {
    summary: knowledge.summary,
    explanation: knowledge.explanation,
    observedBullets: buildObservedBullets(pattern.id, domains, baseline),
    dailyLife: knowledge.dailyLife,
    reflectionQuestion: choose(knowledge.reflectionQuestions, `${seed}:${pattern.id}:question`),
    longitudinalMessage: choose(knowledge.longitudinal.firstObservation, `${seed}:${pattern.id}:first`),
  };
}

export function selectLongitudinalMessage(patternId: PatternId, kind: LongitudinalMessageKind, seed: string): string {
  const messages = getPatternKnowledge(patternId).longitudinal[kind];
  return choose(messages, `${seed}:${patternId}:${kind}`);
}
