import { getResonanceSystem } from "./resonanceLanguage";
import {
  buildSystemDimensions,
  buildUserResultDomains,
  type SystemDimension,
  type UserResultDomain,
  type UserResultStoryCandidate,
} from "./systemDimensions";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "./voiceSpectrum";

export type PatternId =
  | "overextended-achiever"
  | "deep-processor"
  | "guarded-but-responsive"
  | "recovering-adapter"
  | "quietly-overloaded"
  | "balanced-regulator";

export type PatternDefinition = {
  id: PatternId;
  name: string;
  theme: string;
  explanation: string;
  whatThisMayFeelLike: string[];
  supportiveFactors: string[];
  whatIsWorkingHardest: string[];
  whatNeedsAttention: string;
  match: (scan: VoiceAnalysisResult, dimensions: SystemDimension[]) => number;
};

export type PatternMatch = {
  id: PatternId;
  name: string;
  theme: string;
  explanation: string;
  whatThisMayFeelLike: string[];
  supportiveFactors: string[];
  whatIsWorkingHardest: string[];
  whatNeedsAttention: string;
  confidence: number;
};

export type SoulScopeReport = {
  primaryPattern: PatternMatch;
  supportingPattern?: PatternMatch;
  emergingPattern?: PatternMatch;
  domainResults: UserResultDomain[];
  storyCandidates: UserResultStoryCandidate[];
  evidence: {
    noteEnergies: NoteEnergyResult[];
    topNotes: Array<{
      note: string;
      score: number;
      status: NoteEnergyResult["status"];
      system: string;
    }>;
    dimensions: SystemDimension[];
    hasCamera: boolean;
    pauseCount: number;
    captureQuality?: NonNullable<VoiceAnalysisResult["voiceDynamics"]>["captureQuality"];
  };
};

function getDimension(
  dimensions: SystemDimension[],
  name: SystemDimension["name"],
): SystemDimension | undefined {
  return dimensions.find((dimension) => dimension.name === name);
}

function topSignals(scan: VoiceAnalysisResult) {
  return (scan.noteEnergies ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.score - 30) - Math.abs(a.score - 30))
    .slice(0, 4)
    .map((entry) => ({
      note: entry.note,
      score: entry.score,
      status: entry.status,
      system: getResonanceSystem(entry.note).name,
    }));
}

function hasOveractive(scan: VoiceAnalysisResult, notes: string[]) {
  return (scan.noteEnergies ?? []).some(
    (entry) => notes.includes(entry.note) && entry.status === "overactive",
  );
}

function hasUnderactive(scan: VoiceAnalysisResult, notes: string[]) {
  return (scan.noteEnergies ?? []).some(
    (entry) => notes.includes(entry.note) && entry.status === "underactive",
  );
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

const PATTERN_LIBRARY: PatternDefinition[] = [
  {
    id: "overextended-achiever",
    name: "The Overextended Achiever",
    theme:
      "Forward movement appears strong, but recovery may not be keeping pace.",
    explanation:
      "Your current scan suggests a system that is still capable, engaged, and trying to move things forward, while carrying more demand than it is fully restoring.",
    whatThisMayFeelLike: [
      "Getting through what needs to be done without fully feeling restored afterward",
      "Staying productive while quietly feeling the cost of that effort",
      "Having a mind that keeps moving even when the body needs more recovery",
    ],
    supportiveFactors: [
      "Strong motivation",
      "Forward orientation",
      "Available adaptability",
    ],
    whatIsWorkingHardest: [
      "Recovery",
      "Mental processing",
      "Pressure management",
    ],
    whatNeedsAttention:
      "Restoration needs to catch up with output before strain becomes the dominant story.",
    match: (scan, dimensions) => {
      const recovery = getDimension(dimensions, "Recovery");
      const cognitiveLoad = getDimension(dimensions, "Cognitive Load");
      const adaptability = getDimension(dimensions, "Adaptability");
      let score = 0;
      if (recovery?.level === "Low") score += 0.35;
      if (cognitiveLoad?.level === "High") score += 0.25;
      if (adaptability?.level === "High" || adaptability?.level === "Medium") score += 0.15;
      if (hasOveractive(scan, ["D", "A", "B", "A#"])) score += 0.15;
      if (hasUnderactive(scan, ["C", "G#"])) score += 0.1;
      return clampScore(score);
    },
  },
  {
    id: "deep-processor",
    name: "The Deep Processor",
    theme:
      "Your system appears to spend considerable effort processing, organizing, and making meaning.",
    explanation:
      "This scan reflects a mind that stays active beneath the surface. The pattern is less about shutdown and more about sustained internal processing.",
    whatThisMayFeelLike: [
      "Replaying conversations after they happen",
      "Needing more time before responding clearly",
      "Thinking deeply even when trying to rest",
    ],
    supportiveFactors: [
      "Insight",
      "Pattern recognition",
      "Reflective capacity",
    ],
    whatIsWorkingHardest: [
      "Cognitive organization",
      "Mental closure",
    ],
    whatNeedsAttention:
      "Reducing open loops may help the system feel less mentally crowded.",
    match: (scan, dimensions) => {
      const cognitiveLoad = getDimension(dimensions, "Cognitive Load");
      let score = 0;
      if (cognitiveLoad?.level === "High") score += 0.4;
      if (hasOveractive(scan, ["A#", "B"])) score += 0.25;
      if ((scan.voiceDynamics?.pauseCount ?? 0) >= 3) score += 0.15;
      if ((scan.voiceDynamics?.voicedFrameRatio ?? 0) < 0.35) score += 0.1;
      return clampScore(score);
    },
  },
  {
    id: "guarded-but-responsive",
    name: "The Guarded but Responsive Pattern",
    theme:
      "Your system appears engaged, but it narrows when the material becomes more personal.",
    explanation:
      "This pattern suggests you do not shut down completely under load, but the body begins protecting itself as emotional intensity increases.",
    whatThisMayFeelLike: [
      "Staying present while still feeling some internal bracing",
      "Being able to respond, but with less softness or openness under pressure",
      "Feeling expressive on the surface while tightening underneath",
    ],
    supportiveFactors: [
      "Responsiveness",
      "Emotional contact is still present",
    ],
    whatIsWorkingHardest: [
      "Emotional safety",
      "Facial and vocal regulation under deeper prompts",
    ],
    whatNeedsAttention:
      "Safety and pacing matter more here than pushing for more exposure.",
    match: (scan, _dimensions) => {
      const camera = scan.protocolNotes?.camera;
      let score = 0;
      if (camera) {
        if (camera.facialTension >= 0.62) score += 0.25;
        if (camera.eyeOpenness <= 0.38) score += 0.2;
        if (camera.blinkRatePerMin >= 24) score += 0.15;
      }
      if (hasUnderactive(scan, ["G"])) score += 0.1;
      if (hasOveractive(scan, ["F#", "C#"])) score += 0.15;
      return clampScore(score);
    },
  },
  {
    id: "recovering-adapter",
    name: "The Recovering Adapter",
    theme:
      "Your system appears to be rebuilding capacity while staying responsive to current demands.",
    explanation:
      "This pattern reflects recovery that is becoming more available, even if the system is not fully back at ease yet.",
    whatThisMayFeelLike: [
      "More capacity than before, but not complete steadiness",
      "Periods of genuine progress mixed with lingering sensitivity",
      "A sense that things are moving in the right direction",
    ],
    supportiveFactors: [
      "Resilience",
      "Adaptability",
      "Recovering regulation",
    ],
    whatIsWorkingHardest: [
      "Stabilizing gains",
      "Protecting recovery momentum",
    ],
    whatNeedsAttention:
      "Consistency matters more than intensity right now.",
    match: (_scan, dimensions) => {
      const recovery = getDimension(dimensions, "Recovery");
      const regulation = getDimension(dimensions, "Regulation");
      let score = 0;
      if (recovery?.level === "Medium" || recovery?.level === "High") score += 0.25;
      if (regulation?.level === "Medium" || regulation?.level === "High") score += 0.25;
      if (recovery?.state === "balanced") score += 0.15;
      if (regulation?.state === "balanced") score += 0.15;
      return clampScore(score);
    },
  },
  {
    id: "quietly-overloaded",
    name: "The Quietly Overloaded Pattern",
    theme:
      "The surface may look functional, but the system appears to be carrying more than it is showing.",
    explanation:
      "This pattern often appears when there is no single dramatic spike, but cumulative strain is still present across multiple systems.",
    whatThisMayFeelLike: [
      "Saying you are fine while feeling more stretched than that sounds",
      "Functioning outwardly while privately feeling compressed",
      "Low-grade strain that is easy to normalize",
    ],
    supportiveFactors: [
      "Functional capacity",
      "Consistency",
    ],
    whatIsWorkingHardest: [
      "Load containment",
      "Holding multiple demands at once",
    ],
    whatNeedsAttention:
      "The first need here is honest acknowledgment of cumulative strain.",
    match: (scan, dimensions) => {
      let score = 0;
      const mediumOrLow = dimensions.filter(
        (dimension) =>
          dimension.level === "Medium" || dimension.level === "Low",
      ).length;
      if (mediumOrLow >= 3) score += 0.3;
      if ((scan.voiceDynamics?.pauseCount ?? 0) >= 2) score += 0.1;
      if (hasUnderactive(scan, ["C", "G#", "G"])) score += 0.2;
      if (hasOveractive(scan, ["B", "D", "F#"])) score += 0.2;
      return clampScore(score);
    },
  },
  {
    id: "balanced-regulator",
    name: "The Balanced Regulator",
    theme:
      "Your system currently appears relatively steady, responsive, and available.",
    explanation:
      "This pattern reflects usable regulation and enough support across the scan to stay adaptive without obvious overload dominating the picture.",
    whatThisMayFeelLike: [
      "A clearer sense of steadiness",
      "More room to respond instead of only react",
      "Available energy without obvious internal crowding",
    ],
    supportiveFactors: [
      "Regulation",
      "Recovery",
      "Adaptability",
    ],
    whatIsWorkingHardest: [
      "No single system appears to be carrying the entire load",
    ],
    whatNeedsAttention:
      "Protect what is already working before unnecessary strain accumulates.",
    match: (_scan, dimensions) => {
      const balancedCount = dimensions.filter(
        (dimension) => dimension.band === "Balanced",
      ).length;
      return clampScore(balancedCount / 6);
    },
  },
];

function rankPatterns(scan: VoiceAnalysisResult) {
  const dimensions = buildSystemDimensions(scan);
  return PATTERN_LIBRARY.map((pattern) => ({
    ...pattern,
    confidence: pattern.match(scan, dimensions),
  }))
    .sort((a, b) => b.confidence - a.confidence);
}

function buildStoryCandidates(primary: PatternMatch): UserResultStoryCandidate[] {
  return [
    {
      style: "Direct",
      title: primary.name,
      summary: primary.explanation,
      strongestResources: primary.supportiveFactors,
      areasWorkingHard: primary.whatIsWorkingHardest,
      areasAskingForSupport: [primary.whatNeedsAttention],
    },
    {
      style: "Supportive",
      title: `${primary.name} — Supportive Framing`,
      summary: `${primary.theme} This pattern often appears when a system is still trying to function well while asking for a different kind of support.`,
      strongestResources: primary.supportiveFactors,
      areasWorkingHard: primary.whatIsWorkingHardest,
      areasAskingForSupport: [primary.whatNeedsAttention],
    },
    {
      style: "Insight",
      title: `${primary.name} — Reflective Framing`,
      summary: `Your current scan most closely resembles ${primary.name}. The deeper story here is not simply about strong or weak scores, but about how effort, recovery, and responsiveness are interacting right now.`,
      strongestResources: primary.supportiveFactors,
      areasWorkingHard: primary.whatIsWorkingHardest,
      areasAskingForSupport: [primary.whatNeedsAttention],
    },
  ];
}

export function buildSoulScopeReport(scan: VoiceAnalysisResult): SoulScopeReport {
  const dimensions = buildSystemDimensions(scan);
  const domainResults = buildUserResultDomains(scan);
  const ranked = rankPatterns(scan);

  const primaryPattern: PatternMatch = {
    id: ranked[0].id,
    name: ranked[0].name,
    theme: ranked[0].theme,
    explanation: ranked[0].explanation,
    whatThisMayFeelLike: ranked[0].whatThisMayFeelLike,
    supportiveFactors: ranked[0].supportiveFactors,
    whatIsWorkingHardest: ranked[0].whatIsWorkingHardest,
    whatNeedsAttention: ranked[0].whatNeedsAttention,
    confidence: ranked[0].confidence,
  };

  const supporting = ranked[1]?.confidence > 0.2
    ? {
        id: ranked[1].id,
        name: ranked[1].name,
        theme: ranked[1].theme,
        explanation: ranked[1].explanation,
        whatThisMayFeelLike: ranked[1].whatThisMayFeelLike,
        supportiveFactors: ranked[1].supportiveFactors,
        whatIsWorkingHardest: ranked[1].whatIsWorkingHardest,
        whatNeedsAttention: ranked[1].whatNeedsAttention,
        confidence: ranked[1].confidence,
      }
    : undefined;

  const emerging = ranked[2]?.confidence > 0.15
    ? {
        id: ranked[2].id,
        name: ranked[2].name,
        theme: ranked[2].theme,
        explanation: ranked[2].explanation,
        whatThisMayFeelLike: ranked[2].whatThisMayFeelLike,
        supportiveFactors: ranked[2].supportiveFactors,
        whatIsWorkingHardest: ranked[2].whatIsWorkingHardest,
        whatNeedsAttention: ranked[2].whatNeedsAttention,
        confidence: ranked[2].confidence,
      }
    : undefined;

  return {
    primaryPattern,
    supportingPattern: supporting,
    emergingPattern: emerging,
    domainResults,
    storyCandidates: buildStoryCandidates(primaryPattern),
    evidence: {
      noteEnergies: scan.noteEnergies ?? [],
      topNotes: topSignals(scan),
      dimensions,
      hasCamera: Boolean(scan.protocolNotes?.camera),
      pauseCount: scan.voiceDynamics?.pauseCount ?? 0,
      captureQuality: scan.voiceDynamics?.captureQuality,
    },
  };
}
