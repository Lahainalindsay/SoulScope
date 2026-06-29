import { type VoiceAnalysisResult } from "./voiceSpectrum";
import { type UserResultDomain, type SystemDimension } from "./systemDimensions";

/**
 * PATTERN SYNTHESIS ENGINE
 * 
 * Purpose: Transform discrete data points (domain scores, notes, dimensions)
 * into a coherent, relatable human pattern that describes what is actually
 * happening in the person's system right now.
 * 
 * Philosophy:
 * - High activity ≠ strength. It may indicate effort, strain, or compensation.
 * - Low activity ≠ weakness. It may indicate absence of demand, intentional conservation,
 *   or capacity that is not currently being called upon.
 * - Patterns are about relationships between domains, not absolute scores.
 * - Language is specific, human, non-diagnostic, and recognizable.
 */

export type PatternSynthesis = {
  // Human-readable current-state pattern name
  primaryPattern: {
    id: string;
    name: string;
    theme: string;
    explanation: string;
  };
  
  // Secondary pattern if confidence supports it
  secondaryPattern?: {
    id: string;
    name: string;
    theme: string;
  };
  
  // Emerging pattern if just becoming visible
  emergingPattern?: {
    id: string;
    name: string;
    theme: string;
  };

  optionalEmergingPattern?: {
    id: string;
    name: string;
    theme: string;
  };

  mainTitle: string;
  integratedSummary: string;
  
  // The dominant drivers of this pattern right now
  primaryDrivers: string[];
  
  // What this pattern might actually feel like day-to-day
  likelyExperiences: string[];
  
  // What is still protecting the system
  protectiveFactors: string[];
  
  // Where to start if the user wants to shift this
  suggestedFocus: string;
  
  // Confidence in primary pattern 0-1
  confidence: number;
  
  // Was this synthesized successfully or did it fall back to generic?
  isAccurate: boolean;
};

export type DomainRelationship = {
  domain1: string;
  domain2: string;
  relationship: "complementary" | "conflicting" | "reinforcing" | "neutral";
  description: string;
};

/**
 * Pattern Library (Comprehensive)
 * These are current-state patterns, not fixed types.
 * Users can move between patterns as their system state changes.
 */
const CORE_PATTERNS = {
  "overextended-achiever": {
    name: "The Overextended Achiever",
    theme: "Forward movement appears strong, but recovery may not be keeping pace.",
    signals: {
      high: ["Direction & Adaptability", "Focus & Mental Load", "Energy & Vitality"],
      low: ["Recovery & Restoration"],
      stressed: ["Recovery & Restoration", "Focus & Mental Load"],
    },
    experiences: [
      "Getting through what needs to be done without fully feeling restored afterward",
      "Staying productive while quietly feeling the cost of that effort",
      "Having a mind that keeps moving even when the body needs more recovery",
      "Pushing through fatigue with momentum that feels productive",
    ],
    protective: [
      "Strong forward orientation",
      "Available adaptability and responsiveness",
      "Clear direction and agency",
    ],
    focus: "Begin protecting recovery before strain becomes the dominant story. Small consistent rest may matter more than you think.",
  },

  "deep-processor": {
    name: "The Deep Processor",
    theme: "Your system appears to spend considerable effort processing, organizing, and making meaning.",
    signals: {
      high: ["Focus & Mental Load", "Communication & Clarity"],
      stressed: ["Focus & Mental Load", "Recovery & Restoration"],
      low: ["Energy & Vitality"],
    },

    "mental-multitasker": {
      name: "The Mental Multitasker",
      theme: "Many mental channels appear active at the same time.",
      signals: {
        high: ["Focus & Mental Load", "Communication & Clarity"],
        low: ["Recovery & Restoration"],
        stressed: ["Focus & Mental Load"],
      },
      experiences: [
        "Tracking several thoughts at once",
        "Starting one thought before finishing another",
        "Difficulty finding quiet mental space",
        "Feeling mentally switched on for long stretches",
      ],
      protective: ["Strong processing speed", "Communication access", "High cognitive availability"],
      focus: "Simplifying inputs and reducing simultaneous demands may help this system settle without losing clarity.",
    },

    "thinking-faster-than-speaking": {
      name: "The Thinking Faster Than Speaking Pattern",
      theme: "Thought speed appears to be outpacing verbal organization right now.",
      signals: {
        high: ["Communication & Clarity", "Focus & Mental Load"],
        stressed: ["Communication & Clarity"],
        low: ["Recovery & Restoration"],
      },
      experiences: [
        "Losing your train of thought while explaining",
        "Overexplaining to find the right words",
        "Needing more time to structure what you already know",
        "Feeling clear internally but effortful externally",
      ],
      protective: ["Active communication", "Strong internal processing", "Continued engagement"],
      focus: "Giving yourself more pacing in expression may improve clarity with less effort.",
    },
    experiences: [
      "Replaying conversations after they happen",
      "Needing more time before responding clearly",
      "Thinking deeply even when trying to rest",
      "Multiple loops running simultaneously in the mind",
    ],
    protective: [
      "Strong insight and pattern recognition",
      "Reflective capacity and self-awareness",
      "Depth of processing",
    ],
    focus: "Creating closure on mental loops may help the system feel less crowded. Completion practices may be more supportive than you expect.",
  },

  "guarded-but-responsive": {
    name: "The Guarded but Responsive Pattern",
    theme: "Your system appears engaged, but it narrows when the material becomes more personal.",
    signals: {
      high: ["Communication & Clarity"],
      moderate: ["Emotional Expression"],
      stressed: ["Connection & Support", "Emotional Expression"],
      low: ["Emotional Expression"],
    },
    experiences: [
      "Staying present while still feeling some internal bracing",
      "Being able to respond, but with less softness or openness under pressure",
      "Feeling expressive on the surface while tightening underneath",
      "Maintaining function while protecting inner space",
    ],
    protective: [
      "Responsiveness and engagement are still present",
      "Emotional contact is maintained even under protection",
      "Consistent functional capacity",
    ],
    focus: "Safety and pacing matter more here than pushing for more exposure. Building trust—including self-trust—is the entrance point.",
  },

  "quietly-overloaded": {
    name: "The Quietly Overloaded Pattern",
    theme: "The surface may look functional, but the system appears to be carrying more than it is showing.",
    signals: {
      moderate: ["all"],
      no_extremes: true,
      high_cumulative_strain: true,
    },
    experiences: [
      "Saying you are fine while feeling more stretched than that sounds",
      "Functioning outwardly while privately feeling compressed",
      "Low-grade strain that is easy to normalize",
      "Steady on the outside, more effort on the inside than is obvious",
    ],
    protective: [
      "Functional capacity is still present",
      "Consistency across domains",
      "System is not collapsed",
    ],
    focus: "The first need here is honest acknowledgment of cumulative strain. What you are carrying is real even if it does not show.",
  },

  "balanced-regulator": {
    name: "The Balanced Regulator",
    theme: "Your system currently appears relatively steady, responsive, and available.",
    signals: {
      balanced: true,
      low_load_count: true,
      multiple_resources: true,
    },
    experiences: [
      "A clearer sense of steadiness",
      "More room to respond instead of only react",
      "Available energy without obvious internal crowding",
      "Better access to choice in how to spend attention",
    ],
    protective: [
      "Regulation and adaptability are working",
      "Recovery has adequate support",
      "Multiple systems are functioning",
    ],
    focus: "Protect what is already working before unnecessary strain accumulates. Maintain what feels good.",
  },

  "recovering-adapter": {
    name: "The Recovering Adapter",
    theme: "Your system appears to be rebuilding capacity while staying responsive to current demands.",
    signals: {
      improving: ["Recovery & Restoration", "Direction & Adaptability"],
      responsive: true,
      low_extremes: true,
    },
    experiences: [
      "More capacity than before, but not complete steadiness",
      "Periods of genuine progress mixed with lingering sensitivity",
      "A sense that things are moving in the right direction",
      "Days that are better, days that are still cautious",
    ],
    protective: [
      "Resilience and adaptability",
      "Recovery capacity is growing",
      "System is not stuck",
    ],
    focus: "Consistency matters more than intensity right now. Small regular practices may matter more than big efforts.",
  },

  "tired-but-capable": {
    name: "The Capable but Tired Pattern",
    theme: "The system can keep going, but restoration is not keeping pace with what is being asked of it.",
    signals: {
      moderate_to_high: ["Direction & Adaptability", "Energy & Vitality"],
      low: ["Recovery & Restoration"],
      stressed: ["Energy & Vitality"],
    },

    "recovery-seeker": {
      name: "The Recovery Seeker",
      theme: "The system appears to be asking for more quiet, replenishment, and recovery bandwidth.",
      signals: {
        low: ["Recovery & Restoration", "Energy & Vitality"],
        stressed: ["Focus & Mental Load"],
      },
      experiences: [
        "Needing more quiet than usual",
        "Feeling like rest is less restorative than expected",
        "Reaching capacity earlier in the day",
        "Wanting space before taking on more demand",
      ],
      protective: ["Clear recovery signal", "System is communicating needs", "Potential for restoration with pacing"],
      focus: "Prioritizing true recovery windows may help this system rebuild faster than pushing through.",
    },
    experiences: [
      "Feeling productive but not restored",
      "Capable but running on fumes",
      "Moving forward while quietly depleted",
      "The system keeps performing even when it is asking for something different",
    ],
    protective: [
      "Direction is still available",
      "Adaptability is intact",
      "System has not shut down",
    ],
    focus: "Recovery is not a luxury here; it is a requirement for sustained functioning. What would restoration actually feel like to you?",
  },

  "empathic-giver": {
    name: "The Empathic Giver",
    theme: "Relational availability is high, but replenishment may be lagging.",
    signals: {
      high: ["Connection & Support", "Emotional Expression"],
      low: ["Recovery & Restoration", "Energy & Vitality"],
    },

    "emotionally-saturated-communicator": {
      name: "The Emotionally Saturated Communicator",
      theme: "Communication is active while emotion appears closer to the surface.",
      signals: {
        high: ["Emotional Expression", "Communication & Clarity"],
        stressed: ["Communication & Clarity"],
        low: ["Recovery & Restoration"],
      },
      experiences: [
        "Feeling a lot while trying to communicate clearly",
        "Words carrying emotional weight",
        "Sensitivity increasing under relational pressure",
        "Needing extra regulation after conversations",
      ],
      protective: ["Emotional access is present", "Communication remains active", "Relational availability"],
      focus: "Supportive pacing and regulation before difficult conversations may reduce strain without suppressing expression.",
    },

    "giving-more-than-receiving": {
      name: "The Giving More Than Receiving Pattern",
      theme: "Relational output appears high while restoration support appears comparatively lower.",
      signals: {
        high: ["Connection & Support"],
        low: ["Recovery & Restoration", "Energy & Vitality"],
        stressed: ["Connection & Support"],
      },
      experiences: [
        "Showing up for others while privately needing support",
        "Feeling relationally available but personally under-restored",
        "Sustaining care output longer than recovery allows",
        "Wanting connection and space at the same time",
      ],
      protective: ["Relational strength", "Empathy", "Consistent caring capacity"],
      focus: "Receiving support is part of long-term sustainability, not a detour from it.",
    },
    experiences: [
      "Available to others while needing more support yourself",
      "Attuned to what others need while less clear on your own needs",
      "Giving more than you are restoring",
      "Capacity for connection that may exceed capacity for self-support",
    ],
    protective: [
      "Relational awareness and capacity",
      "Ability to connect and support",
      "Emotional availability",
    ],
    focus: "Receiving is a skill that can be practiced. What would it feel like to let someone support you the way you support others?",
  },

  "restless-planner": {
    name: "The Restless Planner",
    theme: "Future focus is active, but present-moment restoration may be low.",
    signals: {
      high: ["Direction & Adaptability", "Focus & Mental Load"],
      low: ["Recovery & Restoration"],
      overactive_notes: ["A", "B"],
    },

    "adaptive-performer": {
      name: "The Adaptive Performer",
      theme: "The system appears capable, responsive, and comparatively well-supported under current demands.",
      signals: {
        high: ["Direction & Adaptability", "Energy & Vitality"],
        balanced: true,
        stressed: ["Focus & Mental Load"],
      },
      experiences: [
        "Handling changing demands with less disruption",
        "Staying engaged without obvious overload",
        "Maintaining momentum while adjusting in real time",
        "Feeling capable and responsive",
      ],
      protective: ["Adaptability", "Available energy", "Operational steadiness"],
      focus: "Maintain recovery support to preserve this level of adaptability.",
    },
    experiences: [
      "Always thinking about what is next",
      "Difficulty being present without already planning ahead",
      "Mental momentum that does not stop easily",
      "Restoration feeling like lost time rather than necessary refueling",
    ],
    protective: [
      "Clear forward orientation",
      "Planning and direction capacity",
      "Organizational clarity",
    ],
    focus: "Presence practices may feel counterintuitive but could be more restorative than you expect. What would it take to be here without planning ahead?",
  },

  "system-conservator": {
    name: "The Resource Conservator",
    theme: "The system may be conserving energy rather than pushing forward.",
    signals: {
      low: ["Energy & Vitality", "Direction & Adaptability"],
      stable: ["Recovery & Restoration", "Connection & Support"],
    },

    "internal-communicator": {
      name: "The Internal Communicator",
      theme: "Processing appears highly active internally, with less outward expression than expected.",
      signals: {
        high: ["Focus & Mental Load"],
        low: ["Communication & Clarity"],
        stressed: ["Focus & Mental Load"],
      },
      experiences: [
        "Thinking more than speaking",
        "Holding responses internally before sharing",
        "Having clear internal narratives that are slower to verbalize",
        "Needing more time to translate insight into words",
      ],
      protective: ["Strong internal reflection", "Deliberate processing", "Insight depth"],
      focus: "Small structured moments of outward expression may reduce internal crowding.",
    },
    experiences: [
      "Energy feels like something to protect rather than deploy",
      "Slower pace that may or may not feel chosen",
      "Pulling back rather than pushing forward",
      "Protecting resources rather than spending them",
    ],
    protective: [
      "Regulation is stable",
      "System is not in crisis",
      "Intentional conservation is possible",
    ],
    focus: "This may be protective wisdom rather than a problem. What is the system protecting you from? What would feel safe to move forward with?",
  },

  "expression-under-pressure": {
    name: "The Expression Under Pressure Pattern",
    theme: "Communication or emotional output is active, but it is requiring extra effort.",
    signals: {
      high: ["Communication & Clarity", "Emotional Expression"],
      stressed: ["Communication & Clarity", "Emotional Expression"],
      reduced_clarity: true,
    },
    experiences: [
      "Words are there, but they require extra effort to access",
      "Feeling like you are overexplaining",
      "Expression being active while clarity is strained",
      "Needing to work harder to say what is true",
    ],
    protective: [
      "Communication is still happening",
      "Effort and availability are present",
      "System is attempting connection",
    ],
    focus: "Slowing down might feel risky, but it may actually make expression easier. What would happen if you took more time?",
  },

  "tired-but-wired": {
    name: "The Tired but Wired Pattern",
    theme: "Mental activation appears elevated while physical energy and restoration remain under pressure.",
    signals: {
      high: ["Focus & Mental Load"],
      low: ["Energy & Vitality", "Recovery & Restoration"],
      stressed: ["Focus & Mental Load"],
    },
    experiences: [
      "Feeling tired physically but mentally active",
      "Difficulty downshifting at the end of the day",
      "Fatigue without full cognitive quiet",
      "Rest feeling available but hard to enter",
    ],
    protective: ["Mental drive remains available", "Cognitive responsiveness", "Continued engagement"],
    focus: "Transition rituals that downshift mental activation may improve restoration quality.",
  },

  "rebuilding-momentum": {
    name: "The Rebuilding Momentum Pattern",
    theme: "Capacity appears to be returning with signs of forward movement and improving restoration.",
    signals: {
      high: ["Direction & Adaptability"],
      balanced: true,
      low: ["Recovery & Restoration"],
    },
    experiences: [
      "Feeling movement return after a slower period",
      "More usable energy with occasional dips",
      "Increasing ability to re-engage with priorities",
      "Growing momentum that still benefits from pacing",
    ],
    protective: ["Improving direction", "Recovering capacity", "Adaptive responsiveness"],
    focus: "Steady pacing may help convert progress into sustainable momentum.",
  },

  "scattered-capacity": {
    name: "The Scattered Capacity Pattern",
    theme: "Energy appears available but spread across too many channels, reducing coherence.",
    signals: {
      high: ["Focus & Mental Load", "Direction & Adaptability", "Communication & Clarity"],
      stressed: ["Focus & Mental Load", "Communication & Clarity"],
      low: ["Recovery & Restoration"],
      high_cumulative_strain: true,
    },
    experiences: [
      "Being active in many directions without feeling settled",
      "Frequent context switching",
      "Starting more threads than can be comfortably closed",
      "Feeling busy without feeling integrated",
    ],
    protective: ["Available capacity", "Motivation", "Engagement across domains"],
    focus: "Narrowing active channels may create more coherence with less strain.",
  },
};

/**
 * Analyze domain relationships to detect reinforcing patterns
 */
function analyzeDomainRelationships(
  domains: UserResultDomain[],
  dimensions: SystemDimension[] = [],
): DomainRelationship[] {
  const relationships: DomainRelationship[] = [];

  // High Mental Load + Low Recovery = reinforcing strain
  const mentalLoad = domains.find((d) => d.title === "Focus & Mental Load");
  const recovery = domains.find((d) => d.title === "Recovery & Restoration");
  if (mentalLoad?.score && recovery?.score && mentalLoad.score > 65 && recovery.score < 45) {
    relationships.push({
      domain1: "Focus & Mental Load",
      domain2: "Recovery & Restoration",
      relationship: "conflicting",
      description: "Your mind may be carrying more than your system is restoring.",
    });
  }

  // High Communication + High Mental Load = potentially effortful expression
  const communication = domains.find((d) => d.title === "Communication & Clarity");
  if (communication?.score && mentalLoad?.score && communication.score > 60 && mentalLoad.score > 60) {
    relationships.push({
      domain1: "Communication & Clarity",
      domain2: "Focus & Mental Load",
      relationship: "reinforcing",
      description: "Your thoughts may be moving faster than your words.",
    });
  }

  // High Direction + Low Recovery = forward/restoration imbalance
  const direction = domains.find((d) => d.title === "Direction & Adaptability");
  if (direction?.score && recovery?.score && direction.score > 65 && recovery.score < 45) {
    relationships.push({
      domain1: "Direction & Adaptability",
      domain2: "Recovery & Restoration",
      relationship: "conflicting",
      description: "Forward movement may be outpacing restoration.",
    });
  }

  // High Connection + Low Recovery = relational depletion pattern
  const connection = domains.find((d) => d.title === "Connection & Support");
  if (connection?.score && recovery?.score && connection.score > 65 && recovery.score < 45) {
    relationships.push({
      domain1: "Connection & Support",
      domain2: "Recovery & Restoration",
      relationship: "conflicting",
      description: "You may be giving more than you are restoring.",
    });
  }

  // High Emotional Expression + low inferred regulation = surface reactivity
  const emotional = domains.find((d) => d.title === "Emotional Expression");
  const inferredRegulationInputs = [recovery?.score, direction?.score, connection?.score].filter(
    (score): score is number => typeof score === "number",
  );
  const inferredRegulationScore = inferredRegulationInputs.length
    ? inferredRegulationInputs.reduce((sum, score) => sum + score, 0) / inferredRegulationInputs.length
    : 50;
  const inferredRegulationDomain =
    (recovery?.score ?? 50) <= (direction?.score ?? 50) ? "Recovery & Restoration" : "Direction & Adaptability";
  if (
    emotional?.score &&
    inferredRegulationScore < 45 &&
    emotional.score > 60
  ) {
    relationships.push({
      domain1: "Emotional Expression",
      domain2: inferredRegulationDomain,
      relationship: "conflicting",
      description: "Emotions may be closer to the surface right now.",
    });
  }

  // Low Energy + High Mental Load = tired but wired
  const energy = domains.find((d) => d.title === "Energy & Vitality");
  if (energy?.score && mentalLoad?.score && energy.score < 45 && mentalLoad.score > 65) {
    relationships.push({
      domain1: "Energy & Vitality",
      domain2: "Focus & Mental Load",
      relationship: "conflicting",
      description: "Your mind may be active while your body is asking for rest.",
    });
  }

  if (direction?.score && energy?.score && direction.score > 65 && energy.score < 45) {
    relationships.push({
      domain1: "Direction & Adaptability",
      domain2: "Energy & Vitality",
      relationship: "conflicting",
      description: "You may be oriented toward what is next more than what is here.",
    });
  }

  const cumulativeModerateStrain = domains.filter(
    (d) => (d.functionalState === "Working Hard" || d.functionalState === "Under Pressure") && d.score >= 50 && d.score <= 75,
  ).length;
  if (cumulativeModerateStrain >= 4) {
    relationships.push({
      domain1: "Cross-domain",
      domain2: "Cross-domain",
      relationship: "conflicting",
      description: "You may appear steady while carrying more internally than is obvious.",
    });
  }

  return relationships;
}

/**
 * Match domains to pattern signals
 */
function scorePatternMatch(
  domains: UserResultDomain[],
  dimensions: SystemDimension[],
  relationships: DomainRelationship[],
  patternId: string,
): number {
  const pattern = CORE_PATTERNS[patternId as keyof typeof CORE_PATTERNS];
  if (!pattern) return 0;

  const signals = pattern.signals as Record<string, any>;
  let score = 0;
  let matchedDomainCount = 0;
  let matchedStrainCount = 0;

  // Score based on high domains
  if (signals.high) {
    const highMatches = domains.filter((d) =>
      signals.high.includes(d.title) && (d.functionalState === "Highly Engaged" || d.functionalState === "Working Hard"),
    );
    score += (highMatches.length / signals.high.length) * 0.2;
    matchedDomainCount += highMatches.length;
  }

  // Score based on low domains
  if (signals.low) {
    const lowMatches = domains.filter((d) =>
      signals.low.includes(d.title) && (d.functionalState === "Asking for Support" || d.functionalState === "Less Accessible"),
    );
    score += (lowMatches.length / signals.low.length) * 0.2;
    matchedDomainCount += lowMatches.length;
  }

  // Score based on stressed domains
  if (signals.stressed) {
    const stressedMatches = domains.filter((d) =>
      signals.stressed.includes(d.title) && d.functionalState === "Under Pressure",
    );
    score += (stressedMatches.length / signals.stressed.length) * 0.2;
    matchedStrainCount += stressedMatches.length;
  }

  // Score based on no extremes (moderate across board)
  if (signals.no_extremes) {
    const allModerate = domains.every((d) => d.score >= 40 && d.score <= 70);
    score += allModerate ? 0.35 : 0;
  }

  // Score based on balanced state
  if (signals.balanced) {
    const balancedCount = domains.filter((d) => d.functionalState === "Readily Available").length;
    score += (balancedCount / domains.length) * 0.3;
  }

  // Score based on cumulative strain
  if (signals.high_cumulative_strain) {
    const strainedDomains = domains.filter((d) =>
      d.functionalState === "Working Hard" || d.functionalState === "Under Pressure",
    );
    score += strainedDomains.length >= 3 ? 0.25 : 0;
  }

  const strainIntensity = domains.filter(
    (d) => d.functionalState === "Working Hard" || d.functionalState === "Under Pressure",
  ).length / Math.max(domains.length, 1);
  const recovery = domains.find((d) => d.title === "Recovery & Restoration")?.score ?? 50;
  const depletionRecoveryGap = Math.max(0, 70 - recovery) / 70;
  const baselineDeviation = dimensions.filter(
    (d) => d.band === "Extremely High" || d.band === "Extremely Low",
  ).length / Math.max(dimensions.length, 1);
  const signalCoherence = Math.min(1, matchedDomainCount / Math.max((signals.high?.length ?? 0) + (signals.low?.length ?? 0), 1));
  const relationshipBonus = Math.min(0.1, relationships.length * 0.03);

  score += signalCoherence * 0.15;
  score += strainIntensity * 0.07;
  score += depletionRecoveryGap * 0.05;
  score += baselineDeviation * 0.04;
  score += matchedStrainCount > 0 ? 0.05 : 0;
  score += relationshipBonus;

  return Math.min(1, score);
}

/**
 * Build pattern synthesis from scan data
 */
export function buildPatternSynthesis(
  domains: UserResultDomain[],
  dimensions: SystemDimension[],
): PatternSynthesis {
  const relationships = analyzeDomainRelationships(domains, dimensions);

  // Score all patterns
  const patternScores = Object.keys(CORE_PATTERNS).map((patternId) => ({
    id: patternId,
    score: scorePatternMatch(domains, dimensions, relationships, patternId),
  }));

  patternScores.sort((a, b) => b.score - a.score);

  const primary = patternScores[0];
  const secondary = patternScores[1];
  const tertiary = patternScores[2];

  const primaryPatternDef = CORE_PATTERNS[primary.id as keyof typeof CORE_PATTERNS];
  const secondaryPatternDef = secondary.score > 0.15 ? CORE_PATTERNS[secondary.id as keyof typeof CORE_PATTERNS] : null;
  const tertiaryPatternDef = tertiary.score > 0.1 ? CORE_PATTERNS[tertiary.id as keyof typeof CORE_PATTERNS] : null;

  // Detect domain relationships (used for explanation refinement)
  // Build primary drivers (what is actually causing this pattern)
  const primaryDrivers = getPrimaryDrivers(domains, relationships);

  // Get protective factors
  const protectiveFactors = primaryPatternDef.protective;

  // Get suggested focus
  const suggestedFocus = primaryPatternDef.focus;

  const integratedSummary = buildPatternExplanation(domains, primaryPatternDef, relationships);

  return {
    primaryPattern: {
      id: primary.id,
      name: primaryPatternDef.name,
      theme: primaryPatternDef.theme,
      explanation: buildPatternExplanation(domains, primaryPatternDef, relationships),
    },
    secondaryPattern: secondaryPatternDef
      ? {
          id: secondary.id,
          name: secondaryPatternDef.name,
          theme: secondaryPatternDef.theme,
        }
      : undefined,
    emergingPattern: tertiaryPatternDef
      ? {
          id: tertiary.id,
          name: tertiaryPatternDef.name,
          theme: tertiaryPatternDef.theme,
        }
      : undefined,
    optionalEmergingPattern: tertiaryPatternDef
      ? {
          id: tertiary.id,
          name: tertiaryPatternDef.name,
          theme: tertiaryPatternDef.theme,
        }
      : undefined,
    mainTitle: primaryPatternDef.name,
    integratedSummary,
    primaryDrivers,
    likelyExperiences: primaryPatternDef.experiences,
    protectiveFactors,
    suggestedFocus,
    confidence: primary.score,
    isAccurate: primary.score > 0.25,
  };
}

/**
 * Identify what is actually driving this pattern
 */
function getPrimaryDrivers(domains: UserResultDomain[], relationships: DomainRelationship[]): string[] {
  const drivers: string[] = [];

  // Add domains that are "Working Hard" or "Under Pressure"
  const strained = domains.filter((d) => d.functionalState === "Working Hard" || d.functionalState === "Under Pressure");
  drivers.push(...strained.map((d) => d.title));

  // Add domains that are "Asking for Support"
  const depleted = domains.filter((d) => d.functionalState === "Asking for Support");
  drivers.push(...depleted.map((d) => d.title).slice(0, 2));

  // Add relationship tensions
  relationships.forEach((rel) => {
    if (rel.relationship === "conflicting") {
      drivers.push(rel.description);
    }
  });

  return drivers.slice(0, 3);
}

/**
 * Build human-readable pattern explanation
 */
function buildPatternExplanation(
  domains: UserResultDomain[],
  pattern: (typeof CORE_PATTERNS)[keyof typeof CORE_PATTERNS],
  relationships: DomainRelationship[],
): string {
  const strained = domains.filter((d) => d.functionalState === "Working Hard" || d.functionalState === "Under Pressure");
  const resourceful = domains.filter((d) => d.functionalState === "Highly Engaged" || d.functionalState === "Readily Available");

  let explanation = `Your voice pattern suggests ${pattern.theme.charAt(0).toLowerCase()}${pattern.theme.slice(1)}`;

  if (relationships.length > 0) {
    explanation += ` ${relationships[0].description}`;
  }

  if (resourceful.length > 0) {
    const resources = resourceful.map((d) => d.title).slice(0, 2).join(" and ");
    explanation += ` This may express itself as effort and capacity showing up together. ${resources} remain available.`;
  }

  return explanation;
}
