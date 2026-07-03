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

type PatternContext = {
  dimensions: SystemDimension[];
  domainResults: UserResultDomain[];
  noteEnergies: NoteEnergyResult[];
  voiceDynamics?: VoiceAnalysisResult["voiceDynamics"];
  hasCamera: boolean;
};

export type PatternDefinition = {
  id: PatternId;
  name: string;
  theme: string;
  explanation: string;
  whatThisMayFeelLike: string[];
  supportiveFactors: string[];
  whatIsWorkingHardest: string[];
  whatNeedsAttention: string;
  match: (scan: VoiceAnalysisResult, context: PatternContext) => number;
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

type CameraSignal = NonNullable<NonNullable<VoiceAnalysisResult["protocolNotes"]>["camera"]>;

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
    camera?: CameraSignal;
    cameraBaseline?: CameraSignal;
    promptCameras?: Array<{
      id: string;
      title: string;
      camera: CameraSignal;
    }>;
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

function getDomain(domainResults: UserResultDomain[], title: UserResultDomain["title"]) {
  return domainResults.find((domain) => domain.title === title);
}

function topSignals(scan: VoiceAnalysisResult) {
  return (scan.noteEnergies ?? [])
    .slice()
    .sort((a, b) => b.score - a.score)
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

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function summarizeDomainRoles(domainResults: UserResultDomain[]) {
  const resources = domainResults
    .filter((domain) => domain.functionalState === "Highly Engaged" || domain.functionalState === "Readily Available")
    .sort((a, b) => b.score - a.score);
  const workingHard = domainResults
    .filter((domain) => domain.functionalState === "Working Hard" || domain.functionalState === "Under Pressure")
    .sort((a, b) => b.score - a.score);
  const askingSupport = domainResults
    .filter((domain) => domain.functionalState === "Asking for Support" || domain.functionalState === "Recovering" || domain.functionalState === "Less Accessible")
    .sort((a, b) => a.score - b.score);

  const scores = domainResults.map((domain) => domain.score);
  const balancedCount = domainResults.filter((domain) => domain.functionalState === "Readily Available").length;
  const peakLoad = workingHard[0] ?? askingSupport[0];
  const secondLoad = (workingHard[1] ?? askingSupport[1]) ?? undefined;
  const dominantResource = resources[0];
  const secondResource = resources[1];

  return {
    resources,
    workingHard,
    askingSupport,
    dominantResource,
    dominantLoad: peakLoad,
    secondLoad,
    secondResource,
    balancedCount,
    scoreMean: mean(scores),
    scoreSpread: standardDeviation(scores),
    resourceCount: resources.length,
    loadCount: workingHard.length + askingSupport.length,
  };
}

function noteIntensity(noteEnergies: NoteEnergyResult[], notes: string[]) {
  const relevant = noteEnergies.filter((entry) => notes.includes(entry.note));
  if (!relevant.length) return 0;
  return mean(relevant.map((entry) => entry.score));
}

function noteBalance(noteEnergies: NoteEnergyResult[], notes: string[]) {
  const relevant = noteEnergies.filter((entry) => notes.includes(entry.note));
  if (!relevant.length) return 0;
  const overactive = relevant.filter((entry) => entry.status === "overactive").length;
  const underactive = relevant.filter((entry) => entry.status === "underactive").length;
  return (overactive - underactive) / relevant.length;
}

function tonalSpread(noteEnergies: NoteEnergyResult[]) {
  const values = noteEnergies.map((entry) => entry.score);
  return standardDeviation(values);
}

const PATTERN_LIBRARY: PatternDefinition[] = [
  {
    id: "overextended-achiever",
    name: "The Overextended Achiever",
    theme: "Forward movement appears strong, but recovery may not be keeping pace.",
    explanation:
      "Your scan suggests a system that is still capable, engaged, and trying to move things forward while carrying more demand than it is fully restoring.",
    whatThisMayFeelLike: [
      "Getting through what needs to be done without fully feeling restored afterward",
      "Staying productive while quietly feeling the cost of that effort",
      "Having a mind that keeps moving even when the body needs more recovery",
    ],
    supportiveFactors: ["Strong motivation", "Forward orientation", "Available adaptability"],
    whatIsWorkingHardest: ["Recovery", "Mental processing", "Pressure management"],
    whatNeedsAttention:
      "Restoration needs to catch up with output before strain becomes the dominant story.",
    match: (scan, context) => {
      const { dimensions, domainResults, noteEnergies, voiceDynamics } = context;
      const roles = summarizeDomainRoles(domainResults);
      const recovery = getDimension(dimensions, "Recovery");
      const cognitiveLoad = getDimension(dimensions, "Cognitive Load");
      const adaptability = getDimension(dimensions, "Adaptability");
      const energy = getDomain(domainResults, "Energy & Vitality");
      const direction = getDomain(domainResults, "Direction & Adaptability");
      const loadNoteBalance = noteBalance(noteEnergies, ["A#", "B", "D", "A"]);
      const recoveryNoteBalance = noteBalance(noteEnergies, ["G#", "C"]);
      const voicedFrameRatio = voiceDynamics?.voicedFrameRatio ?? 0;
      const pauseCount = voiceDynamics?.pauseCount ?? 0;
      let score = 0;
      if (recovery?.level === "Low") score += 0.22;
      if (recovery?.level === "Medium") score += 0.09;
      if (cognitiveLoad?.level === "High") score += 0.2;
      if (cognitiveLoad?.level === "Medium") score += 0.08;
      if (adaptability?.level === "High") score += 0.1;
      if (adaptability?.level === "Medium") score += 0.05;
      if (energy?.functionalState === "Working Hard") score += 0.1;
      if (energy?.functionalState === "Highly Engaged") score += 0.05;
      if (direction?.functionalState === "Working Hard") score += 0.07;
      if (roles.resourceCount >= 2) score += 0.05;
      if (roles.loadCount >= 2) score += 0.08;
      if (roles.scoreSpread >= 13) score += 0.05;
      if (pauseCount >= 3) score += 0.05;
      if (voicedFrameRatio < 0.42) score += 0.04;
      if (loadNoteBalance > 0.15) score += 0.08;
      if (recoveryNoteBalance < -0.12) score += 0.06;
      if (hasOveractive(scan, ["D", "A", "B", "A#"])) score += 0.1;
      if (hasUnderactive(scan, ["C", "G#"])) score += 0.05;
      return clampScore(score);
    },
  },
  {
    id: "deep-processor",
    name: "The Deep Processor",
    theme: "Your system appears to spend considerable effort processing, organizing, and making meaning.",
    explanation:
      "This scan reflects a mind that stays active beneath the surface. The pattern is less about shutdown and more about sustained internal processing.",
    whatThisMayFeelLike: [
      "Replaying conversations after they happen",
      "Needing more time before responding clearly",
      "Thinking deeply even when trying to rest",
    ],
    supportiveFactors: ["Insight", "Pattern recognition", "Reflective capacity"],
    whatIsWorkingHardest: ["Cognitive organization", "Mental closure"],
    whatNeedsAttention: "Reducing open loops may help the system feel less mentally crowded.",
    match: (scan, context) => {
      const { dimensions, domainResults, noteEnergies, voiceDynamics } = context;
      const roles = summarizeDomainRoles(domainResults);
      const cognitiveLoad = getDimension(dimensions, "Cognitive Load");
      const communication = getDomain(domainResults, "Communication & Clarity");
      const focus = getDomain(domainResults, "Focus & Mental Load");
      const direction = getDomain(domainResults, "Direction & Adaptability");
      const cognitiveNotes = noteIntensity(noteEnergies, ["A#", "B"]);
      const loadNoteBalance = noteBalance(noteEnergies, ["A#", "B"]);
      const pauseCount = voiceDynamics?.pauseCount ?? 0;
      const voicedFrameRatio = voiceDynamics?.voicedFrameRatio ?? 0;
      let score = 0;
      if (cognitiveLoad?.level === "High") score += 0.2;
      if (cognitiveLoad?.level === "Medium") score += 0.08;
      if (focus?.functionalState === "Working Hard" || focus?.functionalState === "Under Pressure") score += 0.14;
      if (direction?.functionalState === "Working Hard" || direction?.functionalState === "Under Pressure") score += 0.1;
      if (communication?.functionalState === "Working Hard" || communication?.functionalState === "Under Pressure") score += 0.1;
      if (pauseCount >= 4) score += 0.15;
      else if (pauseCount >= 2) score += 0.08;
      if (voicedFrameRatio < 0.4) score += 0.08;
      if (cognitiveNotes >= 34) score += 0.08;
      if (loadNoteBalance > 0.1) score += 0.06;
      if (roles.dominantLoad?.title === "Focus & Mental Load") score += 0.1;
      if (roles.secondLoad?.title === "Focus & Mental Load") score += 0.04;
      if (roles.loadCount >= 3) score += 0.06;
      if (roles.scoreSpread >= 10) score += 0.04;
      return clampScore(score);
    },
  },
  {
    id: "guarded-but-responsive",
    name: "The Guarded but Responsive Pattern",
    theme: "Your system appears engaged, but it narrows when the material becomes more personal.",
    explanation:
      "This pattern suggests you do not shut down completely under load, but the body begins protecting itself as emotional intensity increases.",
    whatThisMayFeelLike: [
      "Staying present while still feeling some internal bracing",
      "Being able to respond, but with less softness or openness under pressure",
      "Feeling expressive on the surface while tightening underneath",
    ],
    supportiveFactors: ["Responsiveness", "Emotional contact is still present"],
    whatIsWorkingHardest: ["Emotional safety", "Facial and vocal regulation under deeper prompts"],
    whatNeedsAttention: "Safety and pacing matter more here than pushing for more exposure.",
    match: (scan, context) => {
      const camera = scan.protocolNotes?.camera;
      const { domainResults } = context;
      const expression = getDomain(domainResults, "Emotional Expression");
      const connection = getDomain(domainResults, "Connection & Support");
      const communication = getDomain(domainResults, "Communication & Clarity");
      const emotionalNotes = noteIntensity(context.noteEnergies, ["C#", "F", "G"]);
      let score = 0;
      if (camera) {
        if (camera.facialTension >= 0.62) score += 0.22;
        if (camera.eyeOpenness <= 0.38) score += 0.18;
        if (camera.blinkRatePerMin >= 24) score += 0.12;
      }
      if (expression?.functionalState === "Working Hard" || expression?.functionalState === "Under Pressure") score += 0.08;
      if (connection?.functionalState === "Asking for Support" || connection?.functionalState === "Less Accessible") score += 0.06;
      if (communication?.functionalState === "Working Hard" || communication?.functionalState === "Under Pressure") score += 0.05;
      if (hasUnderactive(scan, ["G"])) score += 0.08;
      if (hasOveractive(scan, ["F#", "C#"])) score += 0.12;
      if (emotionalNotes >= 30) score += 0.08;
      if (context.hasCamera) score += 0.04;
      return clampScore(score);
    },
  },
  {
    id: "recovering-adapter",
    name: "The Recovering Adapter",
    theme: "Your system appears to be rebuilding capacity while staying responsive to current demands.",
    explanation:
      "This pattern reflects recovery that is becoming more available, even if the system is not fully back at ease yet.",
    whatThisMayFeelLike: [
      "More capacity than before, but not complete steadiness",
      "Periods of genuine progress mixed with lingering sensitivity",
      "A sense that things are moving in the right direction",
    ],
    supportiveFactors: ["Resilience", "Adaptability", "Recovering regulation"],
    whatIsWorkingHardest: ["Stabilizing gains", "Protecting recovery momentum"],
    whatNeedsAttention: "Consistency matters more than intensity right now.",
    match: (_scan, context) => {
      const { dimensions, domainResults, noteEnergies } = context;
      const recovery = getDimension(dimensions, "Recovery");
      const regulation = getDimension(dimensions, "Regulation");
      const adaptability = getDomain(domainResults, "Direction & Adaptability");
      const energy = getDomain(domainResults, "Energy & Vitality");
      const cognitive = getDomain(domainResults, "Focus & Mental Load");
      const roles = summarizeDomainRoles(domainResults);
      const recoveryNotes = noteIntensity(noteEnergies, ["G#", "C"]);
      let score = 0;
      if (recovery?.level === "High") score += 0.18;
      if (recovery?.level === "Medium") score += 0.1;
      if (regulation?.level === "High") score += 0.18;
      if (regulation?.level === "Medium") score += 0.1;
      if (adaptability?.functionalState === "Highly Engaged" || adaptability?.functionalState === "Readily Available") score += 0.08;
      if (energy?.functionalState === "Highly Engaged" || energy?.functionalState === "Readily Available") score += 0.08;
      if (cognitive?.functionalState === "Readily Available" || cognitive?.functionalState === "Working Hard") score += 0.04;
      if (recovery?.state === "balanced") score += 0.06;
      if (regulation?.state === "balanced") score += 0.06;
      if (roles.loadCount <= 1) score += 0.08;
      if (roles.askingSupport.length <= 1) score += 0.06;
      if (roles.scoreSpread <= 14) score += 0.05;
      if (recoveryNotes >= 32) score += 0.06;
      return clampScore(score);
    },
  },
  {
    id: "quietly-overloaded",
    name: "The Quietly Overloaded Pattern",
    theme: "The surface may look functional, but the system appears to be carrying more than it is showing.",
    explanation:
      "This pattern often appears when there is no single dramatic spike, but cumulative strain is still present across multiple systems.",
    whatThisMayFeelLike: [
      "Saying you are fine while feeling more stretched than that sounds",
      "Functioning outwardly while privately feeling compressed",
      "Low-grade strain that is easy to normalize",
    ],
    supportiveFactors: ["Functional capacity", "Consistency"],
    whatIsWorkingHardest: ["Load containment", "Holding multiple demands at once"],
    whatNeedsAttention: "The first need here is honest acknowledgment of cumulative strain.",
    match: (scan, context) => {
      const { dimensions, domainResults, noteEnergies, voiceDynamics } = context;
      const roles = summarizeDomainRoles(domainResults);
      const midRange = dimensions.filter((dimension) => dimension.band === "Balanced" || dimension.band === "High" || dimension.band === "Low");
      const pauseCount = voiceDynamics?.pauseCount ?? 0;
      const loadDominance = roles.dominantLoad ? roles.dominantLoad.score : 0;
      const resourceDominance = roles.dominantResource ? roles.dominantResource.score : 0;
      const variedNotes = tonalSpread(noteEnergies);
      let score = 0;
      if (roles.loadCount >= 4) score += 0.2;
      if (roles.loadCount >= 5) score += 0.08;
      if (roles.scoreSpread <= 11) score += 0.18;
      if (roles.scoreSpread <= 8) score += 0.06;
      if (midRange.length >= 4) score += 0.08;
      if (pauseCount >= 2) score += 0.08;
      if (hasUnderactive(scan, ["C", "G#", "G"])) score += 0.12;
      if (hasOveractive(scan, ["B", "D", "F#"])) score += 0.12;
      if (noteIntensity(noteEnergies, ["B", "D", "F#"]) >= 30 && noteIntensity(noteEnergies, ["C", "G#", "G"]) >= 28) score += 0.08;
      if ((scan.voiceDynamics?.voicedFrameRatio ?? 0) < 0.45) score += 0.06;
      if (loadDominance - resourceDominance >= 8) score += 0.06;
      if (variedNotes <= 16) score += 0.04;
      return clampScore(score);
    },
  },
  {
    id: "balanced-regulator",
    name: "The Balanced Regulator",
    theme: "Your system currently appears relatively steady, responsive, and available.",
    explanation:
      "This pattern reflects usable regulation and enough support across the scan to stay adaptive without obvious overload dominating the picture.",
    whatThisMayFeelLike: [
      "A clearer sense of steadiness",
      "More room to respond instead of only react",
      "Available energy without obvious internal crowding",
    ],
    supportiveFactors: ["Regulation", "Recovery", "Adaptability"],
    whatIsWorkingHardest: ["No single system appears to be carrying the entire load"],
    whatNeedsAttention: "Protect what is already working before unnecessary strain accumulates.",
    match: (_scan, context) => {
      const { dimensions, domainResults } = context;
      const roles = summarizeDomainRoles(domainResults);
      const balancedCount = dimensions.filter((dimension) => dimension.band === "Balanced").length;
      const loadCount = roles.loadCount;
      const loadSpread = roles.scoreSpread;
      let score = 0;
      if (balancedCount >= 4) score += 0.18;
      if (loadCount <= 1) score += 0.18;
      if (roles.resources.length >= 3) score += 0.16;
      if ((roles.dominantResource?.score ?? 0) >= 72) score += 0.1;
      if ((getDimension(dimensions, "Recovery")?.level === "High" || getDimension(dimensions, "Recovery")?.level === "Medium")) score += 0.1;
      if ((getDimension(dimensions, "Regulation")?.level === "High" || getDimension(dimensions, "Regulation")?.level === "Medium")) score += 0.1;
      if (loadSpread <= 10) score += 0.08;
      if (roles.workingHard.length === 0 && roles.askingSupport.length <= 1) score += 0.08;
      return clampScore(score);
    },
  },
];

function rankPatterns(scan: VoiceAnalysisResult) {
  const dimensions = buildSystemDimensions(scan);
  const domainResults = buildUserResultDomains(scan);
  const context: PatternContext = {
    dimensions,
    domainResults,
    noteEnergies: scan.noteEnergies ?? [],
    voiceDynamics: scan.voiceDynamics,
    hasCamera: Boolean(scan.protocolNotes?.camera),
  };

  return PATTERN_LIBRARY.map((pattern) => ({
    ...pattern,
    confidence: pattern.match(scan, context),
  }))
    .sort((a, b) => {
      const confidenceDelta = b.confidence - a.confidence;
      if (Math.abs(confidenceDelta) > 0.001) return confidenceDelta;
      return a.id.localeCompare(b.id);
    });
}

function buildStoryCandidates(report: {
  primaryPattern: PatternMatch;
  supportingPattern?: PatternMatch;
  emergingPattern?: PatternMatch;
  domainResults: UserResultDomain[];
}): UserResultStoryCandidate[] {
  const roles = summarizeDomainRoles(report.domainResults);
  const loadTitle = roles.dominantLoad?.title ?? report.primaryPattern.name;
  const resourceTitle = roles.dominantResource?.title;
  const loadPhrase =
    loadTitle === "Recovery & Restoration"
      ? "recovery"
      : loadTitle === "Communication & Clarity"
      ? "expression"
      : loadTitle === "Focus & Mental Load"
      ? "mental space"
      : loadTitle === "Connection & Support"
      ? "support"
      : loadTitle === "Energy & Vitality"
      ? "energy"
      : "one part of your system";
  const resourcePhrase =
    resourceTitle === "Direction & Adaptability"
      ? "adaptability"
      : resourceTitle === "Communication & Clarity"
      ? "expression"
      : resourceTitle === "Connection & Support"
      ? "connection"
      : resourceTitle === "Recovery & Restoration"
      ? "restoration"
      : "capacity";

  return [
    {
      style: "Direct",
      title:
        loadTitle === "Recovery & Restoration"
          ? "Recovery may not be keeping pace with demand."
        : loadTitle === "Communication & Clarity"
          ? "Communication appears active but under strain."
        : loadTitle === "Focus & Mental Load"
          ? "Mental load is asking for more space."
          : "Something appears to be working harder than usual.",
      summary: `${report.primaryPattern.explanation} ${roles.dominantLoad ? `The clearest friction seems connected to ${loadPhrase}, not a lack of ability.` : "The scan suggests the main pattern is still centered on how effort and recovery are interacting."}`,
      strongestResources: roles.resources.slice(0, 2).map((domain) => domain.title),
      areasWorkingHard: roles.workingHard.slice(0, 2).map((domain) => domain.title),
      areasAskingForSupport: roles.askingSupport.slice(0, 2).map((domain) => domain.title),
    },
    {
      style: "Supportive",
      title:
        resourceTitle === "Connection & Support"
          ? "Your system is carrying more than it shows."
          : resourceTitle === "Direction & Adaptability"
          ? "You are moving forward while carrying tension."
          : resourceTitle === "Communication & Clarity"
          ? "There is capacity here, but it is being used."
          : "Strength is present, but so is strain.",
      summary:
        report.supportingPattern?.theme ??
        `You are still showing up, and ${resourcePhrase} remains available. ${roles.dominantLoad ? `The heavier part of the pattern seems connected to ${loadPhrase}` : "Some parts of the system still need more space"} while your stronger capacities continue to help keep you moving.`,
      strongestResources: roles.resources.slice(0, 2).map((domain) => domain.title),
      areasWorkingHard: roles.workingHard.slice(0, 2).map((domain) => domain.title),
      areasAskingForSupport: roles.askingSupport.slice(0, 2).map((domain) => domain.title),
    },
    {
      style: "Insight",
      title:
        roles.dominantLoad?.title === "Recovery & Restoration" || roles.dominantLoad?.title === "Focus & Mental Load"
          ? "Capability and restoration are currently out of balance."
          : roles.dominantLoad?.title === "Communication & Clarity"
          ? "Communication is active, but effortful."
          : resourceTitle === "Direction & Adaptability" && roles.dominantLoad?.title === "Connection & Support"
          ? "Support and momentum are out of sync."
          : "The challenge is load, not lack of ability.",
      summary:
        report.emergingPattern?.explanation ??
        `The dominant pattern is imbalance between output and restoration: your stronger capacities remain usable, while ${roles.workingHard.length ? "the effort layer" : "several other areas"} is spending more energy than usual.`,
      strongestResources: roles.resources.slice(0, 2).map((domain) => domain.title),
      areasWorkingHard: roles.workingHard.slice(0, 2).map((domain) => domain.title),
      areasAskingForSupport: roles.askingSupport.slice(0, 2).map((domain) => domain.title),
    },
  ];
}

export function buildSoulScopeReport(scan: VoiceAnalysisResult): SoulScopeReport {
  const dimensions = buildSystemDimensions(scan);
  const domainResults = buildUserResultDomains(scan);
  const ranked = rankPatterns(scan);
  const primaryRank = ranked[0];
  const supportingRank = ranked[1];
  const emergingRank = ranked[2];

  const primaryPattern: PatternMatch = {
    id: primaryRank.id,
    name: primaryRank.name,
    theme: primaryRank.theme,
    explanation: primaryRank.explanation,
    whatThisMayFeelLike: primaryRank.whatThisMayFeelLike,
    supportiveFactors: primaryRank.supportiveFactors,
    whatIsWorkingHardest: primaryRank.whatIsWorkingHardest,
    whatNeedsAttention: primaryRank.whatNeedsAttention,
    confidence: primaryRank.confidence,
  };

  const supporting = supportingRank?.confidence > 0.2
    ? {
        id: supportingRank.id,
        name: supportingRank.name,
        theme: supportingRank.theme,
        explanation: supportingRank.explanation,
        whatThisMayFeelLike: supportingRank.whatThisMayFeelLike,
        supportiveFactors: supportingRank.supportiveFactors,
        whatIsWorkingHardest: supportingRank.whatIsWorkingHardest,
        whatNeedsAttention: supportingRank.whatNeedsAttention,
        confidence: supportingRank.confidence,
      }
    : undefined;

  const emerging = emergingRank?.confidence > 0.15
    ? {
        id: emergingRank.id,
        name: emergingRank.name,
        theme: emergingRank.theme,
        explanation: emergingRank.explanation,
        whatThisMayFeelLike: emergingRank.whatThisMayFeelLike,
        supportiveFactors: emergingRank.supportiveFactors,
        whatIsWorkingHardest: emergingRank.whatIsWorkingHardest,
        whatNeedsAttention: emergingRank.whatNeedsAttention,
        confidence: emergingRank.confidence,
      }
    : undefined;

  return {
    primaryPattern,
    supportingPattern: supporting,
    emergingPattern: emerging,
    domainResults,
    storyCandidates: buildStoryCandidates({
      primaryPattern,
      supportingPattern: supporting,
      emergingPattern: emerging,
      domainResults,
    }),
    evidence: {
      noteEnergies: scan.noteEnergies ?? [],
      topNotes: topSignals(scan),
      dimensions,
      hasCamera: Boolean(scan.protocolNotes?.camera),
      camera: scan.protocolNotes?.camera,
      cameraBaseline: scan.protocolNotes?.cameraBaseline,
      promptCameras: scan.protocolNotes?.prompts
        ?.filter((prompt): prompt is typeof prompt & { camera: CameraSignal } => Boolean(prompt.camera))
        .map((prompt) => ({
          id: prompt.id,
          title: prompt.title,
          camera: prompt.camera,
        })),
      pauseCount: scan.voiceDynamics?.pauseCount ?? 0,
      captureQuality: scan.voiceDynamics?.captureQuality,
    },
  };
}
