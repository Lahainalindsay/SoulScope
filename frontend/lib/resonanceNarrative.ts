import { getResonanceSystem, getResonanceSystemLabel } from "./resonanceLanguage";
import { buildSystemDimensions, buildSystemSignatures } from "./systemDimensions";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "./voiceSpectrum";

type ScanLike = VoiceAnalysisResult;

type RankedSignal = {
  note: string;
  label: string;
  system: ReturnType<typeof getResonanceSystem>;
  score: number;
  status: NoteEnergyResult["status"];
  distanceFromBalanced: number;
};

export type ResonanceNarrative = {
  summary: string;
  strongSignals: string[];
  loadAreas: string[];
  feltSense: string;
  rebalancing: string[];
  evidence: string[];
};

function formatList(items: string[]) {
  const unique = Array.from(new Set(items.filter(Boolean)));
  if (!unique.length) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function buildStrengthPhrase(strong: RankedSignal[], primary: ReturnType<typeof getResonanceSystem>) {
  const source = strong.length ? strong : [{
    note: primary.note,
    label: getResonanceSystemLabel(primary.note),
    system: primary,
    score: 0,
    status: "balanced" as NoteEnergyResult["status"],
    distanceFromBalanced: 0,
  }];
  const notes = new Set(source.map((signal) => signal.system.note));

  if (notes.has("F#") && notes.has("A")) {
    return "a strong awareness of both your present experience and where you're trying to go next";
  }

  return `strong capacity for ${formatList(source.map((signal) => lowerFirst(signal.system.strength)))}`;
}

function buildPremiumSummary(
  strong: RankedSignal[],
  primary: ReturnType<typeof getResonanceSystem>,
  load: RankedSignal[],
  dimensions: ReturnType<typeof buildSystemDimensions>
) {
  const strengthNotes = new Set(strong.map((signal) => signal.system.note));
  const strengthPhrase =
    strengthNotes.has("F#") && strengthNotes.has("A") && strengthNotes.has("D#")
      ? "strong self-awareness, adaptability, and future-focused thinking"
      : formatList(
          (strong.length ? strong : [{ system: primary } as RankedSignal]).map((signal) =>
            lowerFirst(signal.system.strength)
          )
        );
  const cognitiveLoad = dimensions.find((dimension) => dimension.name === "Cognitive Load");
  const recovery = dimensions.find((dimension) => dimension.name === "Recovery");
  const demandPhrase =
    cognitiveLoad?.level === "High" || cognitiveLoad?.level === "Medium"
      ? "ongoing mental demand"
      : "some ongoing mental demand";
  const recoveryPhrase =
    recovery?.level === "Low"
      ? "reduced recovery"
      : recovery?.level === "Medium"
      ? "recovery that may not be fully keeping pace"
      : "available recovery resources";
  const forwardPhrase =
    strengthNotes.has("A") || strengthNotes.has("D#") || strengthNotes.has("F#")
      ? "engaged and forward-moving"
      : "engaged and actively adapting";
  const pressureResolutionPhrase =
    recovery?.level === "Low" || cognitiveLoad?.level === "High"
      ? "though it may be carrying more pressure than it is currently resolving"
      : "with enough available support to keep moving toward balance";

  return `Your voice patterns suggest ${strengthPhrase}. At the same time, signs of ${demandPhrase} and ${recoveryPhrase} are present. Overall, the scan reflects a system that remains ${forwardPhrase}, ${pressureResolutionPhrase}.`;
}

function rankedSignals(scan: ScanLike): RankedSignal[] {
  return (scan.noteEnergies ?? [])
    .map((entry) => {
      const system = getResonanceSystem(entry.note);
      return {
        note: entry.note,
        label: getResonanceSystemLabel(entry.note),
        system,
        score: entry.score,
        status: entry.status,
        distanceFromBalanced: Math.abs(entry.score - 30),
      };
    })
    .sort((a, b) => {
      if (b.distanceFromBalanced !== a.distanceFromBalanced) {
        return b.distanceFromBalanced - a.distanceFromBalanced;
      }
      return b.score - a.score;
    });
}

function strongestBalancedSignals(signals: RankedSignal[]) {
  return signals
    .filter((signal) => signal.status === "balanced")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function loadSignals(signals: RankedSignal[]) {
  return signals.filter((signal) => signal.status !== "balanced").slice(0, 4);
}

function buildPromptEvidence(scan: ScanLike) {
  const prompts = scan.protocolNotes?.prompts ?? [];
  if (!prompts.length) return null;

  const promptTop = prompts
    .map((prompt) => {
      const topScore = prompt.noteScores?.slice().sort((a, b) => b.score - a.score)[0];
      if (!topScore) return null;
      return {
        title: prompt.title,
        rangeLabel: prompt.rangeLabel,
        note: topScore.note,
        system: getResonanceSystem(topScore.note),
        score: topScore.score,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.score - a.score);

  const strongestPrompt = promptTop[0];
  if (!strongestPrompt) return null;

  return `${strongestPrompt.system.name} was strongest during ${strongestPrompt.rangeLabel ?? strongestPrompt.title}.`;
}

function describeVoiceDynamics(scan: ScanLike) {
  const dynamics = scan.voiceDynamics;
  if (!dynamics) return null;

  const details: string[] = [];

  if (dynamics.captureQuality === "poor") {
    details.push("capture quality was limited");
  } else if (dynamics.captureQuality === "good") {
    details.push("capture quality was strong");
  }

  if (dynamics.pauseCount >= 3) {
    details.push("several reflection pauses appeared");
  } else if (dynamics.pauseCount === 0) {
    details.push("speech flow was relatively continuous");
  }

  if (dynamics.voicedFrameRatio < 0.22) {
    details.push("voiced expression was relatively sparse");
  } else if (dynamics.voicedFrameRatio > 0.55) {
    details.push("voiced expression stayed active");
  }

  if (dynamics.pitchStability > 0.72) {
    details.push("pitch movement stayed comparatively steady");
  } else if (dynamics.pitchStability > 0 && dynamics.pitchStability < 0.45) {
    details.push("pitch movement was more variable");
  }

  return details.length ? details.join(", ") : null;
}

function describeCamera(scan: ScanLike) {
  const camera = scan.protocolNotes?.camera;
  if (!camera) return null;

  const details: string[] = [];
  if (camera.facialTension >= 0.62) details.push("higher facial tension");
  if (camera.eyeOpenness <= 0.38) details.push("reduced eye openness");
  if (camera.blinkRatePerMin >= 24) details.push("faster blink pattern");
  if (camera.trackingConfidence < 0.45) details.push("limited camera confidence");

  return details.length ? details.join(", ") : null;
}

function buildFeltSense(signals: RankedSignal[], scan: ScanLike) {
  const items = new Set<string>();
  const dynamics = scan.voiceDynamics;

  signals.forEach((signal) => {
    if (signal.system.note === "B" && signal.status === "overactive") {
      items.add("Finding it difficult to fully disengage from ongoing responsibilities or thoughts");
    }
    if (signal.system.note === "D" && signal.status === "overactive") {
      items.add("Carrying a great deal successfully, while quietly feeling the weight of it");
    }
    if (signal.system.note === "G" && signal.status === "underactive") {
      items.add("Feeling there is more to say than current conditions allow");
    }
    if ((signal.system.note === "C" || signal.system.note === "G#") && signal.status === "underactive") {
      items.add("Recognizing a need for deeper restoration than current routines consistently provide");
    }
    if (signal.system.note === "A" && signal.status !== "underactive") {
      items.add("Feeling oriented toward what comes next, even while managing what is present");
    }
    if (signal.system.note === "A#" && signal.status !== "underactive") {
      items.add("Alternating between meaningful insight and periods of cognitive exhaustion");
    }
  });

  if (dynamics?.pauseCount && dynamics.pauseCount >= 3) {
    items.add("Needing more time to process before responding");
  }
  if (dynamics?.voicedFrameRatio && dynamics.voicedFrameRatio > 0.55) {
    items.add("Continuing to show up and participate despite ongoing internal demands");
  }

  return Array.from(items).slice(0, 5);
}

function buildRebalancingRecommendations(signals: RankedSignal[]) {
  const recommendations = new Map<string, string>();

  signals.forEach((signal) => {
    if (signal.system.note === "B" || signal.system.note === "A#") {
      recommendations.set(
        "Reduce Open Mental Loops",
        "Unfinished decisions and ongoing responsibilities may be consuming more attention than they appear to on the surface."
      );
    }
    if (signal.system.note === "C" || signal.system.note === "G#") {
      recommendations.set(
        "Create More Recovery Than You Think You Need",
        "Current patterns suggest your energy output may be exceeding your restoration capacity."
      );
      recommendations.set(
        "Prioritize Restoration Before Output",
        "Movement, sleep quality, and protected downtime may help reduce accumulated strain."
      );
    }
    if (signal.system.note === "D") {
      recommendations.set(
        "Lower the Immediate Pressure",
        "Break larger demands into smaller next actions so your system has less to hold at once."
      );
    }
    if (signal.system.note === "G") {
      recommendations.set(
        "Make the Unspoken Easier to Say",
        "Name one clear feeling or need before entering a demanding conversation."
      );
    }
    if (signal.system.note === "A" || signal.system.note === "F#") {
      recommendations.set(
        "Protect Reflective Time",
        "Your strongest signals suggest insight and self-awareness are already available. Creating space for reflection may help convert awareness into action."
      );
    }
  });

  return Array.from(recommendations.entries())
    .map(([title, text]) => `${title}: ${text}`)
    .slice(0, 4);
}

export function buildResonanceNarrative(scan: ScanLike): ResonanceNarrative {
  const signals = rankedSignals(scan);
  const primary = getResonanceSystem(scan.noteInterpretation?.primaryNote ?? scan.dominantBandLabel);
  const strong = strongestBalancedSignals(signals);
  const load = loadSignals(signals);
  const dimensions = buildSystemDimensions(scan);
  const cognitiveLoad = dimensions.find((dimension) => dimension.name === "Cognitive Load");
  const recovery = dimensions.find((dimension) => dimension.name === "Recovery");

  const strongNames = strong.length
    ? strong.map((signal) => signal.system.strength)
    : [primary.strength];
  const loadNames = load.length
    ? load.map((signal) =>
        signal.status === "overactive" ? signal.system.load : signal.system.underexpressed
      )
    : [];

  const feltSignals = load.length ? load : strong;
  const feltItems = buildFeltSense(feltSignals, scan);
  const feltSense =
      feltItems.length > 0
      ? feltItems.join(". ")
      : primary.feltSense;
  const signatures = buildSystemSignatures(scan);

  const evidence = [
    ...(cognitiveLoad?.level === "High"
      ? ["Elevated processing demand"]
      : []),
    ...(recovery?.level === "Low"
      ? ["Reduced recovery indicators"]
      : []),
    ...(load.length ? ["Sustained engagement patterns"] : []),
    ...(strong.some((signal) => signal.system.note === "A") ? ["Strong future focus"] : []),
    ...(strong.some((signal) => signal.system.note === "A#" || signal.system.note === "F#") ? ["Active self-reflection"] : []),
  ];

  const rebalancingSources = load.length ? load : strong.slice(0, 2);
  const rebalancing = buildRebalancingRecommendations(rebalancingSources);

  return {
    summary: buildPremiumSummary(strong, primary, load, dimensions),
    strongSignals: strongNames.slice(0, 5),
    loadAreas: loadNames.slice(0, 5),
    feltSense,
    rebalancing,
    evidence,
  };
}
