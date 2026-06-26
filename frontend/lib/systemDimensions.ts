import { type VoiceAnalysisResult } from "./voiceSpectrum";

export type SystemDimensionName =
  | "Regulation"
  | "Vitality"
  | "Recovery"
  | "Adaptability"
  | "Expression"
  | "Cognitive Load";

export type SystemDimension = {
  name: SystemDimensionName;
  score: number;
  level: "High" | "Medium" | "Low";
  band: "Extremely Low" | "Low" | "Balanced" | "High" | "Extremely High";
  state: "available" | "balanced" | "requesting attention";
  derivedFrom: string;
  interpretation: string;
  attention?: string;
};

export type SystemSignature = {
  name: "Stress Load" | "Fatigue Load" | "Burnout Pattern" | "Anxious Activation" | "Low Activation";
  strength: number;
  interpretation: string;
  likelySystems: string[];
};

export type SpectralMeasurement = {
  label: string;
  level: "High" | "Moderate" | "Low" | "Informational";
  evidence: string;
  meaning: string;
};

export type VoiceFrequencyBand = {
  rangeHz: string;
  voiceCharacteristic: string;
  potentialInterpretation: string;
};

export type StressSpectralEffect = {
  spectralChange: string;
  commonEffect: string;
};

export type ResearchFinding = {
  finding: string;
  evidenceLevel: "Strong" | "Moderate" | "Weak/insufficient" | "No evidence";
};

export type VoiceWellnessDimension = {
  dimension: "Vitality" | "Regulation" | "Adaptability" | "Recovery" | "Expression" | "Cognitive Load";
  spectralIndicators: string;
  narrativeMeaning: string;
};

export type UserResultDimensionName =
  | "Grounding & Stability"
  | "Energy & Vitality"
  | "Communication Clarity"
  | "Emotional Expression"
  | "Presence & Engagement"
  | "Awareness & Sensitivity"
  | "Recovery"
  | "Cognitive Load"
  | "Adaptability"
  | "Future Focus"
  | "Reflection & Insight"
  | "Connection";

export type DimensionOrientation = "support" | "demand";
export type ScoreBand = "Extremely Low" | "Low" | "Balanced" | "High" | "Extremely High";

export type UserResultDimension = {
  name: UserResultDimensionName;
  score: number;
  band: ScoreBand;
  orientation: DimensionOrientation;
  stateLabel: string;
  interpretation: string;
  whatThisOftenLooksLike: string;
  signalReference: string;
};

export type UserResultDomainName =
  | "Energy & Vitality"
  | "Recovery & Restoration"
  | "Communication & Clarity"
  | "Emotional Expression"
  | "Connection & Support"
  | "Focus & Mental Load"
  | "Direction & Adaptability";

export type UserResultDomainActivity = "Low" | "Moderate" | "High";

export type UserResultFunctionalState =
  | "Highly Engaged"
  | "Working Hard"
  | "Readily Available"
  | "Asking for Support"
  | "Under Pressure"
  | "Less Accessible"
  | "Recovering";

export type UserResultDomain = {
  title: UserResultDomainName;
  activityLevel: UserResultDomainActivity;
  functionalState: UserResultFunctionalState;
  currentPattern: string;
  thisCouldExpressAs: string[];
  itCanAlsoShowUpAs: string[];
  supportiveReframe: string;
  signalSources: string[];
  score: number;
};

export type UserResultStory = {
  headline: string;
  whatsGoingWell: string;
  whatsCreatingFriction: string;
  whatThisOftenFeelsLike: string[];
  biggestOpportunity: string;
};

export type UserResultStoryCandidate = {
  style: "Direct" | "Supportive" | "Insight";
  title: string;
  summary: string;
  strongestResources: string[];
  areasWorkingHard: string[];
  areasAskingForSupport: string[];
};

export type UserResultPattern = {
  title: string;
  description: string;
};

export const VOICE_FREQUENCY_BANDS: VoiceFrequencyBand[] = [
  {
    rangeHz: "80–250 Hz",
    voiceCharacteristic: "Fundamental voice energy",
    potentialInterpretation: "Physical grounding, respiratory support",
  },
  {
    rangeHz: "250–500 Hz",
    voiceCharacteristic: "Vocal body",
    potentialInterpretation: "Physical vitality",
  },
  {
    rangeHz: "500–1000 Hz",
    voiceCharacteristic: "Speech intelligibility",
    potentialInterpretation: "Communication clarity",
  },
  {
    rangeHz: "1000–2500 Hz",
    voiceCharacteristic: "Emotional coloration",
    potentialInterpretation: "Expressiveness",
  },
  {
    rangeHz: "2500–4000 Hz",
    voiceCharacteristic: "Presence and projection",
    potentialInterpretation: "Alertness, engagement",
  },
  {
    rangeHz: "4000–8000 Hz",
    voiceCharacteristic: "Fine harmonics",
    potentialInterpretation: "Sensory acuity, vocal brightness",
  },
];

export const STRESS_SPECTRAL_EFFECTS: StressSpectralEffect[] = [
  { spectralChange: "Reduced harmonic complexity", commonEffect: "Less vocal richness" },
  { spectralChange: "Narrower pitch range", commonEffect: "Less emotional flexibility" },
  { spectralChange: "Increased vocal tension", commonEffect: "Higher frequency dominance" },
  { spectralChange: "Reduced resonance", commonEffect: "Less vocal depth" },
  { spectralChange: "Increased noise", commonEffect: "Vocal instability" },
];

export const VOICE_RESEARCH_FINDINGS: ResearchFinding[] = [
  { finding: "Hearing influences vocal production", evidenceLevel: "Strong" },
  { finding: "Auditory training changes voice quality", evidenceLevel: "Strong" },
  { finding: "Frequency discrimination affects vocal accuracy", evidenceLevel: "Strong" },
  { finding: "Listening habits affect vocal expression", evidenceLevel: "Moderate" },
  { finding: "Emotional state alters spectral structure", evidenceLevel: "Strong" },
  { finding: "Trauma creates specific frequency deficits", evidenceLevel: "Weak/insufficient" },
  { finding: "Organs emit diagnostic voice frequencies", evidenceLevel: "No evidence" },
];

export const VOICE_WELLNESS_DIMENSIONS: VoiceWellnessDimension[] = [
  {
    dimension: "Vitality",
    spectralIndicators: "Harmonic richness, resonance",
    narrativeMeaning: "Available energy",
  },
  {
    dimension: "Regulation",
    spectralIndicators: "Jitter, stability",
    narrativeMeaning: "Nervous system balance",
  },
  {
    dimension: "Adaptability",
    spectralIndicators: "Pitch variability",
    narrativeMeaning: "Emotional flexibility",
  },
  {
    dimension: "Recovery",
    spectralIndicators: "Spectral coherence",
    narrativeMeaning: "Restoration capacity",
  },
  {
    dimension: "Expression",
    spectralIndicators: "Mid/high harmonic engagement",
    narrativeMeaning: "Communication openness",
  },
  {
    dimension: "Cognitive Load",
    spectralIndicators: "Speech timing, pauses",
    narrativeMeaning: "Mental processing demand",
  },
];

const USER_RESULT_DIMENSION_DEFINITIONS: Array<{
  name: UserResultDimensionName;
  signalReference: string;
  orientation: DimensionOrientation;
  scoreFrom: (scan: VoiceAnalysisResult) => number;
  whatThisOftenLooksLike: string;
}> = [
  {
    name: "Grounding & Stability",
    signalReference: "C",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["C"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Regulation")?.score ?? 50,
    whatThisOftenLooksLike: "Restlessness, difficulty relaxing, feeling mentally \"on\" even during downtime.",
  },
  {
    name: "Energy & Vitality",
    signalReference: "E",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["E", "G#"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Vitality")?.score ?? 50,
    whatThisOftenLooksLike: "Feeling tired despite rest, pushing through fatigue, low motivation, inconsistent energy.",
  },
  {
    name: "Communication Clarity",
    signalReference: "F",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["F", "B"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Expression")?.score ?? 50,
    whatThisOftenLooksLike: "Losing your train of thought, difficulty articulating ideas, needing extra time to explain yourself.",
  },
  {
    name: "Emotional Expression",
    signalReference: "G",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["G", "C#"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Expression")?.score ?? 50,
    whatThisOftenLooksLike: "Keeping things to yourself, feeling misunderstood, struggling to express needs or emotions.",
  },
  {
    name: "Presence & Engagement",
    signalReference: "F",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["F", "A"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Vitality")?.score ?? 50,
    whatThisOftenLooksLike: "Withdrawal, reduced enthusiasm, feeling disconnected from people or activities.",
  },
  {
    name: "Awareness & Sensitivity",
    signalReference: "C#",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["C#", "B"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Regulation")?.score ?? 50,
    whatThisOftenLooksLike: "Missing details, operating on autopilot, focusing only on what's directly in front of you.",
  },
  {
    name: "Recovery",
    signalReference: "G#",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["G#", "C"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Recovery")?.score ?? 50,
    whatThisOftenLooksLike: "Waking up tired, breaks not feeling restorative, lingering fatigue, prolonged tension.",
  },
  {
    name: "Cognitive Load",
    signalReference: "B",
    orientation: "demand",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["B", "A#"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Cognitive Load")?.score ?? 50,
    whatThisOftenLooksLike: "Overthinking, difficulty switching off, constant planning, decision fatigue, mental exhaustion.",
  },
  {
    name: "Adaptability",
    signalReference: "D#",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["D#", "D"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Adaptability")?.score ?? 50,
    whatThisOftenLooksLike: "Resistance to change, feeling overwhelmed by new demands, difficulty pivoting.",
  },
  {
    name: "Future Focus",
    signalReference: "A",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["A", "E"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Cognitive Load")?.score ?? 50,
    whatThisOftenLooksLike: "Feeling stuck, uncertainty about direction, difficulty setting priorities.",
  },
  {
    name: "Reflection & Insight",
    signalReference: "A#",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["A#", "B"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Cognitive Load")?.score ?? 50,
    whatThisOftenLooksLike: "Feeling reactive, difficulty making sense of experiences, repeating patterns.",
  },
  {
    name: "Connection",
    signalReference: "F",
    orientation: "support",
    scoreFrom: (scan) => buildScoreFromNotes(scan, ["F", "C#"]) ?? buildSystemDimensions(scan).find((dimension) => dimension.name === "Expression")?.score ?? 50,
    whatThisOftenLooksLike: "Isolation, emotional distance, reluctance to ask for help, feeling unsupported.",
  },
];

function buildScoreFromNotes(scan: VoiceAnalysisResult, notes: string[]) {
  const energies = scan.noteEnergies ?? [];
  const values = notes
    .map((note) => energies.find((entry) => entry.note === note))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (!values.length) return null;

  const average = values.reduce((sum, entry) => sum + entry.score, 0) / values.length;
  return score(average / 60);
}

function scoreToBand(scoreValue: number): ScoreBand {
  if (scoreValue <= 20) return "Extremely Low";
  if (scoreValue <= 40) return "Low";
  if (scoreValue <= 60) return "Balanced";
  if (scoreValue <= 80) return "High";
  return "Extremely High";
}

function supportStateLabel(band: ScoreBand) {
  switch (band) {
    case "Extremely Low":
      return "Recovering";
    case "Low":
      return "Asking for Support";
    case "Balanced":
      return "Readily Available";
    case "High":
      return "Highly Engaged";
    case "Extremely High":
      return "Highly Engaged";
  }
}

function demandStateLabel(band: ScoreBand) {
  switch (band) {
    case "Extremely Low":
      return "Readily Available";
    case "Low":
      return "Readily Available";
    case "Balanced":
      return "Working Hard";
    case "High":
      return "Under Pressure";
    case "Extremely High":
      return "Under Pressure";
  }
}

function supportInterpretation(band: ScoreBand, highText: string, lowText: string) {
  switch (band) {
    case "Extremely Low":
      return `This area appears significantly depleted. ${lowText}`;
    case "Low":
      return `This area may need attention. ${lowText}`;
    case "Balanced":
      return "This area appears available and stable. The pattern suggests a steady resource without major strain.";
    case "High":
      return highText;
    case "Extremely High":
      return `This appears to be one of your strongest current resources. ${highText}`;
  }
}

function demandInterpretation(band: ScoreBand, highText: string, lowText: string) {
  switch (band) {
    case "Extremely Low":
      return `This area currently appears minimally demanding. ${highText}`;
    case "Low":
      return `This area appears lightly demanding and probably manageable. ${highText}`;
    case "Balanced":
      return "This area reflects a healthy level of challenge. The scan suggests your system is meeting demand without major strain.";
    case "High":
      return `This area appears to be carrying sustained demand. ${lowText}`;
    case "Extremely High":
      return `This area may be approaching overload. ${lowText}`;
  }
}

export function buildUserResultDimensions(scan: VoiceAnalysisResult): UserResultDimension[] {
  return USER_RESULT_DIMENSION_DEFINITIONS.map((dimension) => {
    const scoreValue = dimension.scoreFrom(scan);
    const band = scoreToBand(scoreValue);
    const stateLabel = dimension.orientation === "demand" ? demandStateLabel(band) : supportStateLabel(band);
    const interpretation = dimension.orientation === "demand"
      ? demandInterpretation(band, "This area may be carrying more than your current resources comfortably absorb.", "This area may be asking for more of your attention than usual.")
      : supportInterpretation(band, "This area appears to be one of your current strengths.", "This area may be asking for more support or restoration.");

    return {
      name: dimension.name,
      score: scoreValue,
      band,
      orientation: dimension.orientation,
      stateLabel,
      interpretation,
      signalReference: dimension.signalReference,
      whatThisOftenLooksLike: dimension.whatThisOftenLooksLike,
    };
  });
}

export function buildUserResultSummary(scan: VoiceAnalysisResult) {
  const dimensions = buildUserResultDimensions(scan);
  const supportStrengths = dimensions
    .filter((dimension) => dimension.orientation === "support" && (dimension.band === "High" || dimension.band === "Extremely High"))
    .slice(0, 2);
  const supportLoads = dimensions
    .filter((dimension) => dimension.orientation === "support" && (dimension.band === "Low" || dimension.band === "Extremely Low"))
    .slice(0, 2);
  const demandLoads = dimensions
    .filter((dimension) => dimension.orientation === "demand" && (dimension.band === "High" || dimension.band === "Extremely High"))
    .slice(0, 2);

  const supportText = supportStrengths.length
    ? supportStrengths.map((dimension) => dimension.interpretation).join(" ")
    : "Several areas appear steady and available.";

  const lowText = [...supportLoads, ...demandLoads].length
    ? [...supportLoads, ...demandLoads].map((dimension) => dimension.interpretation).join(" ")
    : "No single area is showing a major load signal.";

  return `${supportText} ${lowText}`.trim();
}

function dimensionByName(dimensions: UserResultDimension[], name: UserResultDimensionName) {
  return dimensions.find((dimension) => dimension.name === name);
}

type DomainDefinition = {
  title: UserResultDomainName;
  notes: string[];
  mode: "support" | "demand" | "mixed";
};

const USER_RESULT_DOMAIN_DEFINITIONS: DomainDefinition[] = [
  { title: "Energy & Vitality", notes: ["C", "D", "E"], mode: "support" },
  { title: "Recovery & Restoration", notes: ["G#", "C"], mode: "support" },
  { title: "Communication & Clarity", notes: ["G", "B"], mode: "mixed" },
  { title: "Emotional Expression", notes: ["C#", "F", "G"], mode: "support" },
  { title: "Connection & Support", notes: ["F", "C#"], mode: "support" },
  { title: "Focus & Mental Load", notes: ["A#", "B"], mode: "demand" },
  { title: "Direction & Adaptability", notes: ["A", "D#", "F#"], mode: "support" },
];

function buildUserResultDomainScore(scan: VoiceAnalysisResult, notes: string[]) {
  return buildScoreFromNotes(scan, notes) ?? 50;
}

function getDomainSignalStats(scan: VoiceAnalysisResult, notes: string[]) {
  const energies = scan.noteEnergies ?? [];
  const matches = notes
    .map((note) => energies.find((entry) => entry.note === note))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return {
    matches,
    overactive: matches.filter((entry) => entry.status === "overactive").length,
    underactive: matches.filter((entry) => entry.status === "underactive").length,
    balanced: matches.filter((entry) => entry.status === "balanced").length,
  };
}

function scoreToActivityLevel(scoreValue: number): UserResultDomainActivity {
  if (scoreValue <= 40) return "Low";
  if (scoreValue <= 70) return "Moderate";
  return "High";
}

function activityStateLabel(scoreValue: number, mode: DomainDefinition["mode"], stats: ReturnType<typeof getDomainSignalStats>) {
  if (mode === "demand") {
    if (scoreValue <= 40) return "Readily Available";
    if (scoreValue <= 60) return "Working Hard";
    if (scoreValue <= 80) return stats.overactive > stats.underactive ? "Under Pressure" : "Working Hard";
    return "Under Pressure";
  }

  if (scoreValue <= 20) return "Recovering";
  if (scoreValue <= 40) return "Asking for Support";
  if (scoreValue <= 60) return "Readily Available";

  if (mode === "mixed") {
    return stats.overactive > stats.underactive ? "Working Hard" : "Highly Engaged";
  }

  return stats.overactive > stats.underactive ? "Working Hard" : "Highly Engaged";
}

function toneFromState(state: UserResultFunctionalState) {
  switch (state) {
    case "Highly Engaged":
      return "engaged";
    case "Working Hard":
      return "workingHard";
    case "Readily Available":
      return "stable";
    case "Asking for Support":
      return "askingSupport";
    case "Under Pressure":
      return "underPressure";
    case "Less Accessible":
      return "lessAccessible";
    case "Recovering":
      return "recovering";
  }
}

function buildDomainCopy(title: UserResultDomainName, tone: ReturnType<typeof toneFromState>) {
  switch (title) {
    case "Energy & Vitality":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears energetic and active. Your voice suggests there is capacity available for follow-through and engagement.",
            thisCouldExpressAs: [
              "getting through a lot without losing momentum",
              "showing up with drive and responsiveness",
              "having energy available for action",
            ],
            itCanAlsoShowUpAs: [
              "feeling ready to move when needed",
              "being able to take on multiple tasks",
            ],
            supportiveReframe: "Your voice suggests energy is present and accessible, which can be a useful resource when it is paced well.",
          };
        case "workingHard":
          return {
            currentPattern: "This area appears highly engaged and may be using significant output energy right now.",
            thisCouldExpressAs: [
              "keeping going even when you are tired",
              "pushing through responsibilities",
              "having strong drive, but not much spare capacity",
            ],
            itCanAlsoShowUpAs: [
              "feeling productive while running close to empty",
              "needing more recovery than your schedule allows",
            ],
            supportiveReframe: "Your voice suggests this area is active, not absent; it may simply be working harder than usual.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may be asking for more support than it is currently getting.",
            thisCouldExpressAs: [
              "running out of steam before the day ends",
              "needing more rest to feel recharged",
              "finding it harder to sustain effort",
            ],
            itCanAlsoShowUpAs: [
              "low motivation after a stretch of demand",
              "feeling like energy is coming back more slowly than expected",
            ],
            supportiveReframe: "A lower signal here does not mean nothing is present; it suggests this area may need more restoration before it can carry more.",
          };
        case "underPressure":
          return {
            currentPattern: "This area appears highly active and may be under sustained load.",
            thisCouldExpressAs: [
              "working at a pace that is difficult to maintain",
              "feeling driven, but also stretched",
              "showing strong output with limited spare energy",
            ],
            itCanAlsoShowUpAs: [
              "pushing hard to stay on top of everything",
              "feeling determined, but close to overload",
            ],
            supportiveReframe: "The signal is active, but the story is about load management rather than simple strength.",
          };
        case "lessAccessible":
        case "recovering":
          return {
            currentPattern: "This area currently appears less accessible and may be rebuilding capacity.",
            thisCouldExpressAs: [
              "moving through the day with less energy than usual",
              "needing rest to feel more resourced",
              "finding effort harder to sustain",
            ],
            itCanAlsoShowUpAs: [
              "slow starts",
              "low physical reserve",
            ],
            supportiveReframe: "Your voice suggests this area is still present; it may just need time, rest, and pacing to come back online.",
          };
      }
    case "Recovery & Restoration":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears well supported and able to replenish after demand.",
            thisCouldExpressAs: [
              "recovering more quickly after effort",
              "feeling restored by rest",
              "having room to reset between demands",
            ],
            itCanAlsoShowUpAs: [
              "sleep and downtime helping in a meaningful way",
              "feeling more even after a pause",
            ],
            supportiveReframe: "Restoration looks available here, which can help the rest of the system stay steadier.",
          };
        case "workingHard":
        case "underPressure":
          return {
            currentPattern: "This area appears to be carrying more demand than it can fully clear right now.",
            thisCouldExpressAs: [
              "waking up tired",
              "needing downtime that does not fully restore you",
              "carrying tension longer than expected",
            ],
            itCanAlsoShowUpAs: [
              "breaks not feeling restorative",
              "recovery feeling slower than the pace of demand",
            ],
            supportiveReframe: "Recovery is still present in the system, but it may need more protected space to catch up.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may need more deliberate restoration to keep pace with what you are carrying.",
            thisCouldExpressAs: [
              "feeling rested only briefly before strain returns",
              "noticing fatigue sooner than you want to",
              "wanting more recovery than your routine offers",
            ],
            itCanAlsoShowUpAs: [
              "being physically present, but not fully reset",
              "feeling worn down by repeated demand",
            ],
            supportiveReframe: "The signal is asking for support, not collapse; small recovery changes may matter more than pushing harder.",
          };
        case "lessAccessible":
        case "recovering":
          return {
            currentPattern: "This area appears to be in a recovery phase and may not yet be fully replenished.",
            thisCouldExpressAs: [
              "low reserves",
              "rest feeling necessary rather than optional",
              "taking time to rebound after output",
            ],
            itCanAlsoShowAs: [
              "fatigue that lingers after busy periods",
              "a need to slow down before taking on more",
            ],
            supportiveReframe: "The current story is not absence; it is recovery in progress.",
          };
      }
    case "Communication & Clarity":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears clear and accessible, with ideas likely moving through smoothly.",
            thisCouldExpressAs: [
              "finding words fairly easily",
              "keeping track of what you want to say",
              "organizing thoughts without much friction",
            ],
            itCanAlsoShowUpAs: [
              "feeling mentally organized in conversation",
              "communicating with less effort than usual",
            ],
            supportiveReframe: "Clarity appears available here and can support the rest of the scan.",
          };
        case "workingHard":
        case "underPressure":
          return {
            currentPattern: "This area appears highly engaged and may be using significant processing energy right now.",
            thisCouldExpressAs: [
              "losing your train of thought",
              "difficulty articulating complex ideas",
              "needing extra time to explain yourself",
              "feeling mentally crowded during conversations",
            ],
            itCanAlsoShowUpAs: [
              "having to repeat yourself",
              "feeling fluent on the inside but slower coming out",
            ],
            supportiveReframe: "Your voice suggests this area is active, not absent; it may simply be working harder than usual.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may be asking for more space so ideas can organize and move outward more easily.",
            thisCouldExpressAs: [
              "pausing to find the right words",
              "feeling less fluent than usual",
              "needing more time to explain yourself",
            ],
            itCanAlsoShowUpAs: [
              "thoughts arriving faster than speech can organize them",
              "feeling mentally full when trying to communicate",
            ],
            supportiveReframe: "The signal suggests access is reduced, not lost; clearer conditions may help ideas return more easily.",
          };
        default:
          return {
            currentPattern: "This area appears less accessible right now and may be needing recovery from sustained demand.",
            thisCouldExpressAs: [
              "difficulty organizing your thoughts while speaking",
              "mental crowding in conversations",
              "slower access to the right words",
            ],
            itCanAlsoShowUpAs: [
              "feeling unsure how much to say",
              "wanting more quiet before responding",
            ],
            supportiveReframe: "This area is still present; it may simply need a slower pace and less pressure to come forward.",
          };
      }
    case "Emotional Expression":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears open and accessible, with emotion likely able to move outward rather than stay stuck.",
            thisCouldExpressAs: [
              "sharing feelings with relative ease",
              "letting others see what is happening inside",
              "responding emotionally without much blockage",
            ],
            itCanAlsoShowUpAs: [
              "feeling emotionally present in conversation",
              "allowing yourself to be seen more fully",
            ],
            supportiveReframe: "Open expression here can make it easier for the rest of the system to stay in flow.",
          };
        case "workingHard":
        case "underPressure":
          return {
            currentPattern: "This area appears active, but the expression itself may be carrying strain or containment.",
            thisCouldExpressAs: [
              "keeping things to yourself",
              "feeling a lot internally without fully saying it",
              "holding back what needs to be expressed",
            ],
            itCanAlsoShowUpAs: [
              "needing more privacy around strong feelings",
              "carrying emotional weight quietly",
            ],
            supportiveReframe: "The signal suggests emotion is present; it may just need safer conditions to move outward.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may be asking for support so emotional material can move more freely.",
            thisCouldExpressAs: [
              "struggling to put feelings into words",
              "feeling misunderstood",
              "having more inside than is coming out",
            ],
            itCanAlsoShowUpAs: [
              "holding back around people you trust",
              "feeling guarded when you would rather be open",
            ],
            supportiveReframe: "Expression can return when the system feels safer and less pressured.",
          };
        default:
          return {
            currentPattern: "This area appears less accessible right now and may be asking for recovery before expression feels natural again.",
            thisCouldExpressAs: [
              "emotions staying contained",
              "less ease in sharing what you feel",
              "feeling quieter than you normally do",
            ],
            itCanAlsoShowUpAs: [
              "wanting to speak, but not fully reaching the words",
              "protecting yourself by keeping more inside",
            ],
            supportiveReframe: "This is not a lack of feeling; it is a signal that expression may need gentler conditions.",
          };
      }
    case "Connection & Support":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears open and available, with support and connection still close at hand.",
            thisCouldExpressAs: [
              "reaching out more naturally",
              "feeling relationally present",
              "letting support in without much friction",
            ],
            itCanAlsoShowUpAs: [
              "trust feeling accessible",
              "connection feeling like a live resource",
            ],
            supportiveReframe: "Connection appears available here, which can help buffer strain elsewhere.",
          };
        case "workingHard":
        case "underPressure":
          return {
            currentPattern: "This area appears engaged, but it may be carrying a noticeable amount of relational responsibility.",
            thisCouldExpressAs: [
              "feeling responsible for other people’s emotional state",
              "showing up for others even when you are tired",
              "carrying a lot of care without much room for yourself",
            ],
            itCanAlsoShowUpAs: [
              "being dependable while privately stretched",
              "feeling connected, but overextended",
            ],
            supportiveReframe: "Connection is still active here; the work is about balancing care with enough room to restore yourself.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may be asking for more support and less self-reliance.",
            thisCouldExpressAs: [
              "handling more alone than you need to",
              "hesitating to ask for help",
              "feeling a little farther from people than usual",
            ],
            itCanAlsoShowUpAs: [
              "pulling inward when things get heavy",
              "wanting support, but not reaching for it yet",
            ],
            supportiveReframe: "Support can still be built here; the signal suggests the connection is quieter, not gone.",
          };
        default:
          return {
            currentPattern: "This area appears less accessible right now and may be in a rebuilding phase.",
            thisCouldExpressAs: [
              "feeling more alone with responsibilities",
              "having less appetite for contact",
              "keeping others at a distance while you regroup",
            ],
            itCanAlsoShowUpAs: [
              "trust taking more effort",
              "connection feeling tiring rather than restoring",
            ],
            supportiveReframe: "This area can come back into view with time, safety, and small acts of support.",
          };
      }
    case "Focus & Mental Load":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears mentally open and not especially crowded right now.",
            thisCouldExpressAs: [
              "having room to think clearly",
              "moving between tasks without much overload",
              "feeling able to focus without overholding everything",
            ],
            itCanAlsoShowUpAs: [
              "more space for reflection",
              "less mental noise than usual",
            ],
            supportiveReframe: "When mental load is lighter, other strengths often have more room to work.",
          };
        case "workingHard":
        case "underPressure":
          return {
            currentPattern: "This area appears highly engaged and may be holding several open loops at once.",
            thisCouldExpressAs: [
              "overthinking",
              "difficulty switching off",
              "constant planning or decision fatigue",
              "feeling mentally crowded",
            ],
            itCanAlsoShowUpAs: [
              "trouble settling after tasks are done",
              "a sense that your mind is still running in the background",
            ],
            supportiveReframe: "This looks like high mental activity under load, not a lack of capability.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may be asking for more structure so the mind can settle and organize.",
            thisCouldExpressAs: [
              "feeling pulled in too many directions",
              "losing track of priorities",
              "needing more space to think before acting",
            ],
            itCanAlsoShowUpAs: [
              "difficulty making a decision and moving on",
              "feeling mentally full before the day is done",
            ],
            supportiveReframe: "The signal suggests mental bandwidth is limited, so simplifying the load may help quickly.",
          };
        default:
          return {
            currentPattern: "This area appears less accessible and may be in a recovery cycle after sustained demand.",
            thisCouldExpressAs: [
              "mental fog",
              "slower access to decisions",
              "wanting quiet before you can think clearly",
            ],
            itCanAlsoShowUpAs: [
              "feeling drained by too much input",
              "needing more decompression than you currently get",
            ],
            supportiveReframe: "Less access here does not mean failure; it often means the system needs room to reset.",
          };
      }
    case "Direction & Adaptability":
      switch (tone) {
        case "engaged":
          return {
            currentPattern: "This area appears responsive and able to adjust without losing direction.",
            thisCouldExpressAs: [
              "adapting to change without getting stuck",
              "keeping direction while moving through uncertainty",
              "finding it easier to pivot when needed",
            ],
            itCanAlsoShowUpAs: [
              "staying oriented toward what comes next",
              "moving between plans without too much friction",
            ],
            supportiveReframe: "Adaptability appears available here, which helps the system stay flexible under change.",
          };
        case "workingHard":
        case "underPressure":
          return {
            currentPattern: "This area appears to be working hard to stay organized while change or direction-setting places more demand on it.",
            thisCouldExpressAs: [
              "second-guessing your next step",
              "feeling the weight of what comes next",
              "needing more effort to adapt than usual",
            ],
            itCanAlsoShowUpAs: [
              "future thinking that turns into strain",
              "trying to stay flexible while carrying too much",
            ],
            supportiveReframe: "The signal shows movement and effort; the task is to reduce friction so adaptation costs less energy.",
          };
        case "askingSupport":
          return {
            currentPattern: "This area may be asking for more support while you sort out priorities and next steps.",
            thisCouldExpressAs: [
              "feeling unsure about direction",
              "wanting structure before you pivot",
              "needing more time to adapt to a change",
            ],
            itCanAlsoShowUpAs: [
              "resisting shifts that would normally be manageable",
              "feeling more effort behind each transition",
            ],
            supportiveReframe: "Slowing down the transition may help this area become more usable again.",
          };
        default:
          return {
            currentPattern: "This area appears less accessible and may be recovering from repeated adjustment demands.",
            thisCouldExpressAs: [
              "change feeling more expensive than usual",
              "needing more time to regroup before moving",
              "feeling uncertain while trying to keep up",
            ],
            itCanAlsoShowUpAs: [
              "fatigue around change",
              "less tolerance for pivots and interruptions",
            ],
            supportiveReframe: "This is a sign that the system needs less friction, not less capability.",
          };
      }
  }
}

function normalizeDomainCopy(copy: {
  currentPattern: string;
  thisCouldExpressAs?: string[];
  itCanAlsoShowUpAs?: string[];
  supportiveReframe?: string;
}) {
  return {
    currentPattern: copy.currentPattern,
    thisCouldExpressAs: Array.isArray(copy.thisCouldExpressAs) ? copy.thisCouldExpressAs.filter(Boolean) : [],
    itCanAlsoShowUpAs: Array.isArray(copy.itCanAlsoShowUpAs) ? copy.itCanAlsoShowUpAs.filter(Boolean) : [],
    supportiveReframe: typeof copy.supportiveReframe === "string" ? copy.supportiveReframe : "",
  };
}

function buildDomainNarrative(scan: VoiceAnalysisResult, definition: DomainDefinition): UserResultDomain {
  const scoreValue = buildUserResultDomainScore(scan, definition.notes);
  const stats = getDomainSignalStats(scan, definition.notes);
  const activityLevel = classifyActivity(scoreValue);
  const functionalState = classifyResourceState(scoreValue, {
    overloadCount: stats.overactive,
    supportCount: stats.underactive + stats.balanced,
    dominantMode: definition.mode,
  });
  const copy = normalizeDomainCopy(buildDomainCopy(definition.title, toneFromState(functionalState)));

  return {
    title: definition.title,
    activityLevel,
    functionalState,
    currentPattern: copy.currentPattern,
    thisCouldExpressAs: copy.thisCouldExpressAs,
    itCanAlsoShowUpAs: copy.itCanAlsoShowUpAs,
    supportiveReframe: copy.supportiveReframe,
    signalSources: definition.notes,
    score: scoreValue,
  };
}

export function buildUserResultDomains(scan: VoiceAnalysisResult): UserResultDomain[] {
  return USER_RESULT_DOMAIN_DEFINITIONS.map((definition) => buildDomainNarrative(scan, definition));
}

type SummaryStyle = "Direct" | "Supportive" | "Insight";

type SummaryContext = {
  resources: UserResultDomain[];
  workingHard: UserResultDomain[];
  askingSupport: UserResultDomain[];
  dominantResource?: UserResultDomain;
  dominantLoad?: UserResultDomain;
};

export function classifyActivity(score: number): UserResultDomainActivity {
  return scoreToActivityLevel(score);
}

export function classifyResourceState(score: number, strainMetrics: { overloadCount: number; supportCount: number; dominantMode?: DomainDefinition["mode"] }): UserResultFunctionalState {
  if (score <= 20) {
    return strainMetrics.dominantMode === "demand" ? "Recovering" : "Less Accessible";
  }
  if (score <= 40) {
    return strainMetrics.dominantMode === "demand" ? "Readily Available" : "Asking for Support";
  }
  if (score <= 60) {
    return strainMetrics.dominantMode === "demand" ? "Working Hard" : "Readily Available";
  }
  if (score <= 80) {
    return strainMetrics.overloadCount > strainMetrics.supportCount ? "Working Hard" : "Highly Engaged";
  }
  return strainMetrics.dominantMode === "demand" ? "Under Pressure" : "Highly Engaged";
}

export function aggregateNotesIntoDomains(scan: VoiceAnalysisResult) {
  return buildUserResultDomains(scan);
}

export function getNarrativeForDomain(domain: UserResultDomain, activity: UserResultDomainActivity, resourceState: UserResultFunctionalState) {
  if (activity === "High" && (resourceState === "Working Hard" || resourceState === "Under Pressure")) {
    return `${domain.title} appears highly active and may be using significant energy right now.`;
  }
  if (activity === "High" && resourceState === "Highly Engaged") {
    return `${domain.title} appears highly available and active without obvious strain.`;
  }
  if (activity === "Moderate" && resourceState === "Readily Available") {
    return `${domain.title} appears accessible and generally steady.`;
  }
  if (resourceState === "Asking for Support") {
    return `${domain.title} appears to be asking for more support than it is currently getting.`;
  }
  if (resourceState === "Recovering" || resourceState === "Less Accessible") {
    return `${domain.title} appears less accessible and may need recovery before it can carry more.`;
  }
  return domain.currentPattern;
}

export function buildSummaryTitle(domainResults: UserResultDomain[], style: SummaryStyle) {
  const resources = domainResults.filter((domain) => domain.functionalState === "Highly Engaged" || domain.functionalState === "Readily Available");
  const workingHard = domainResults.filter((domain) => domain.functionalState === "Working Hard" || domain.functionalState === "Under Pressure");
  const askingSupport = domainResults.filter((domain) =>
    domain.functionalState === "Asking for Support" || domain.functionalState === "Recovering" || domain.functionalState === "Less Accessible"
  );

  const dominantLoad = workingHard[0] ?? askingSupport[0];
  const dominantResource = resources[0];

  const titleForLoad = (domain?: UserResultDomain) => {
    switch (domain?.title) {
      case "Recovery & Restoration":
        return "Recovery may not be keeping pace with demand.";
      case "Communication & Clarity":
        return "Communication appears active but under strain.";
      case "Focus & Mental Load":
        return "Mental load is asking for more space.";
      case "Emotional Expression":
        return "Emotional expression is active, but contained.";
      case "Connection & Support":
        return "Connection is present, but carrying weight.";
      case "Direction & Adaptability":
        return "Direction is active, but effortful.";
      case "Energy & Vitality":
      default:
        return "Energy is present, but it is being spent.";
    }
  };

  const titleForResource = (domain?: UserResultDomain) => {
    switch (domain?.title) {
      case "Connection & Support":
        return "Your system is carrying more than it shows.";
      case "Direction & Adaptability":
        return "You are moving forward while carrying tension.";
      case "Energy & Vitality":
        return "There is capacity here, but it is being used.";
      case "Communication & Clarity":
        return "The challenge is processing load, not ability.";
      case "Recovery & Restoration":
        return "Capability and restoration are currently out of balance.";
      default:
        return "Strength is present, but so is strain.";
    }
  };

  const titleForInsight = (load?: UserResultDomain, resource?: UserResultDomain) => {
    const loadTitle = load?.title;
    const resourceTitle = resource?.title;
    if (loadTitle === "Recovery & Restoration" || loadTitle === "Focus & Mental Load") {
      return "Capability and restoration are currently out of balance.";
    }
    if (loadTitle === "Communication & Clarity") {
      return "Communication is active, but effortful.";
    }
    if (resourceTitle === "Direction & Adaptability" && loadTitle === "Connection & Support") {
      return "Support and momentum are out of sync.";
    }
    return "The challenge is load, not lack of ability.";
  };

  switch (style) {
    case "Direct":
      return titleForLoad(dominantLoad) ?? titleForResource(dominantResource);
    case "Supportive":
      return titleForResource(dominantResource) ?? titleForLoad(dominantLoad);
    case "Insight":
      return titleForInsight(dominantLoad, dominantResource);
  }
}

export function buildTopSummaries(domainResults: UserResultDomain[]): UserResultStoryCandidate[] {
  const resources = domainResults
    .filter((domain) => domain.functionalState === "Highly Engaged" || domain.functionalState === "Readily Available")
    .sort((a, b) => b.score - a.score);
  const workingHard = domainResults
    .filter((domain) => domain.functionalState === "Working Hard" || domain.functionalState === "Under Pressure")
    .sort((a, b) => b.score - a.score);
  const askingSupport = domainResults
    .filter((domain) => domain.functionalState === "Asking for Support" || domain.functionalState === "Recovering" || domain.functionalState === "Less Accessible")
    .sort((a, b) => a.score - b.score);

  const dominantResource = resources[0];
  const dominantLoad = workingHard[0] ?? askingSupport[0];
  const communication = domainResults.find((domain) => domain.title === "Communication & Clarity");
  const recovery = domainResults.find((domain) => domain.title === "Recovery & Restoration");
  const focus = domainResults.find((domain) => domain.title === "Focus & Mental Load");

  const resourceNames = resources.slice(0, 2).map((domain) => domain.title);
  const workingHardNames = (workingHard.length ? workingHard : askingSupport).slice(0, 2).map((domain) => domain.title);
  const askingSupportNames = askingSupport.slice(0, 2).map((domain) => domain.title);

  const styles: SummaryStyle[] = ["Direct", "Supportive", "Insight"];

  const context: SummaryContext = {
    resources: resources.slice(0, 2),
    workingHard: (workingHard.length ? workingHard : askingSupport).slice(0, 2),
    askingSupport: askingSupport.slice(0, 2),
    dominantResource,
    dominantLoad,
  };

  const narrativeByStyle: Record<SummaryStyle, string> = {
    Direct:
      dominantLoad?.title === "Communication & Clarity"
        ? "Communication appears highly engaged but may be requiring more effort than usual."
        : dominantLoad?.title === "Recovery & Restoration"
        ? "Recovery may not be keeping pace with demand."
        : dominantLoad?.title === "Focus & Mental Load"
        ? "Mental load appears active and may be using extra bandwidth."
        : `Your scan suggests ${dominantResource ? `${dominantResource.title} remains available` : "several resources remain available"} while ${dominantLoad ? `${dominantLoad.title} is working harder than usual` : "some areas continue to ask for more support"}.`,
    Supportive:
      `You are still showing up, and several areas remain available. ${dominantLoad ? `${dominantLoad.title} appears to be carrying more than usual` : "Some parts of the system still need more space"} while the stronger domains continue to help keep you moving.`,
    Insight:
      `The dominant pattern is imbalance between output and restoration: ${resourceNames.length ? resourceNames.join(" and ") : "your stronger domains"} remain usable, while ${workingHardNames.length ? workingHardNames.join(" and ") : "several other areas"} are spending more energy than usual. ${askingSupportNames.length ? `${askingSupportNames.join(" and ")} are asking for more support.` : "Recovery remains an important lever."}`,
  };

  return styles.map((style) => {
    const title = buildSummaryTitle(domainResults, style);
    const summary = narrativeByStyle[style];
    return {
      style,
      title,
      summary,
      strongestResources: resourceNames,
      areasWorkingHard: workingHardNames,
      areasAskingForSupport: askingSupportNames,
    };
  });
}

export function buildUserResultStory(scan: VoiceAnalysisResult): UserResultStory {
  const domains = aggregateNotesIntoDomains(scan);
  const resources = domains
    .filter((domain) => domain.functionalState === "Highly Engaged" || domain.functionalState === "Readily Available")
    .sort((a, b) => b.score - a.score);
  const loads = domains
    .filter((domain) => domain.functionalState === "Working Hard" || domain.functionalState === "Under Pressure")
    .sort((a, b) => b.score - a.score);
  const supportNeeds = domains
    .filter((domain) => domain.functionalState === "Asking for Support" || domain.functionalState === "Recovering" || domain.functionalState === "Less Accessible")
    .sort((a, b) => a.score - b.score);

  const dominantResource = resources[0];
  const dominantLoad = loads[0] ?? supportNeeds[0];
  const balancedCount = resources.length;
  const workingCount = loads.length;

  const headline =
    dominantLoad && dominantResource
      ? `${dominantResource.title} remains available while ${dominantLoad.title} works harder than usual.`
      : dominantLoad
      ? `${dominantLoad.title} appears to be carrying the strongest share of attention.`
      : "The scan suggests a steady system with several usable resources.";

  const whatsGoingWell =
    dominantResource
      ? `${dominantResource.title} appears to be one of the most accessible resources right now, which may help stabilize the rest of the system.`
      : "Several resources still appear available, even if some parts are carrying more demand.";

  const whatsCreatingFriction =
    dominantLoad
      ? `${dominantLoad.title} appears to be working harder than it can comfortably sustain, which may be drawing attention away from other areas.`
      : "No single area is dominating the friction picture, though some support may still be useful.";

  const whatThisOftenFeelsLike = dominantLoad
    ? [
        `Feeling ${dominantLoad.title.toLowerCase()} underneath normal functioning.`,
        "Getting through the day, but noticing more effort than usual.",
        "Wanting recovery to catch up with how much is being carried.",
      ]
    : [
        "Feeling mostly steady while still moving through demands.",
        "Having enough room to keep the day organized.",
        "Noticing where rest would still help, even if nothing feels broken.",
      ];

  const biggestOpportunity =
    dominantLoad
      ? workingCount > balancedCount
        ? "The strongest opportunity right now may be to reduce load and give recovery more room to catch up."
        : "The strongest opportunity may be to protect the resources that are already carrying the scan."
      : "The strongest opportunity may be to keep protecting the resources that are already working.";

  return {
    headline,
    whatsGoingWell,
    whatsCreatingFriction,
    whatThisOftenFeelsLike,
    biggestOpportunity,
  };
}

export function buildUserResultStoryCandidates(scan: VoiceAnalysisResult): UserResultStoryCandidate[] {
  return buildTopSummaries(aggregateNotesIntoDomains(scan));
}

export function buildPatternList(scan: VoiceAnalysisResult): UserResultPattern[] {
  const domains = aggregateNotesIntoDomains(scan);
  const resources = domains
    .filter((domain) => domain.functionalState === "Highly Engaged" || domain.functionalState === "Readily Available")
    .sort((a, b) => b.score - a.score);
  const loads = domains
    .filter((domain) => domain.functionalState === "Working Hard" || domain.functionalState === "Under Pressure")
    .sort((a, b) => b.score - a.score);
  const supportNeeds = domains
    .filter((domain) => domain.functionalState === "Asking for Support" || domain.functionalState === "Recovering" || domain.functionalState === "Less Accessible")
    .sort((a, b) => a.score - b.score);

  const dominantLoad = loads[0] ?? supportNeeds[0];
  const dominantResource = resources[0];
  const secondaryLoad = loads[1] ?? supportNeeds[1];

  const patterns: UserResultPattern[] = [];

  if (dominantLoad && dominantResource) {
    patterns.push({
      title: `${dominantLoad.title} is carrying more weight`,
      description: `${dominantLoad.title} appears to be working harder than the rest of the system, while ${dominantResource.title} remains available and can help stabilize the picture.`,
    });
  } else if (dominantLoad) {
    patterns.push({
      title: `${dominantLoad.title} is asking for more space`,
      description: `${dominantLoad.title} appears to be the clearest area of strain in this scan, and it may need more recovery or support than it is currently getting.`,
    });
  } else {
    patterns.push({
      title: "The system still has usable resources",
      description: "Several domains remain available, even though the scan may still benefit from more recovery and pacing in a few places.",
    });
  }

  if (resources.length) {
    patterns.push({
      title: `${resources[0].title} remains a reliable resource`,
      description: `${resources[0].title} looks like one of the clearest supporting areas in this scan and may be helping the system stay organized under pressure.`,
    });
  }

  if (secondaryLoad) {
    patterns.push({
      title: `${secondaryLoad.title} is also working hard`,
      description: `${secondaryLoad.title} adds to the overall load picture, which can make the scan feel mentally or emotionally busier than it first appears.`,
    });
  } else if (supportNeeds[0]) {
    patterns.push({
      title: `${supportNeeds[0].title} needs more support`,
      description: `${supportNeeds[0].title} appears less accessible or still recovering, so it may not be returning as much energy as it is taking in.`,
    });
  }

  return patterns.slice(0, 3);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function scoreToState(score: number): SystemDimension["state"] {
  if (score >= 72) return "available";
  if (score >= 46) return "balanced";
  return "requesting attention";
}

function scoreToLevel(score: number): SystemDimension["level"] {
  if (score >= 72) return "High";
  if (score >= 46) return "Medium";
  return "Low";
}

function score(value: number) {
  return Math.round(clamp01(value) * 100);
}

function dimensionMeaning(name: SystemDimensionName, scoreValue: number) {
  const level = scoreToLevel(scoreValue);

  const copy: Record<SystemDimensionName, Record<SystemDimension["level"], string>> = {
    Regulation: {
      High:
        "Your system appears generally steady and responsive. While some signs of effort are present, overall patterns suggest an ability to maintain balance even under pressure.",
      Medium:
        "Your system appears functional but may be investing extra energy into maintaining stability. Periods of stress or demand may require more recovery to prevent strain from accumulating.",
      Low:
        "Patterns suggest your system may be working harder than usual to maintain equilibrium. This often appears when stress, fatigue, or competing demands begin to exceed available resources.",
    },
    Vitality: {
      High:
        "Your voice reflects strong engagement and available energy. Current patterns suggest access to motivation, responsiveness, and forward movement.",
      Medium:
        "Energy appears available but should be used intentionally. You may be functioning well while still benefiting from pacing and recovery.",
      Low:
        "Patterns suggest reduced energetic reserves. This can feel like moving through responsibilities effectively while carrying underlying fatigue.",
    },
    Recovery: {
      High:
        "Your system appears to have access to restorative capacity. Current patterns suggest resources are being replenished at a healthy rate.",
      Medium:
        "Recovery appears present but may not be fully keeping pace with current demands. Small restorative practices may have an outsized benefit.",
      Low:
        "Your system may be signaling a need for deeper restoration. This often appears when recovery demands have quietly accumulated over time.",
    },
    Adaptability: {
      High:
        "Patterns suggest flexibility and responsiveness. Your system appears capable of adjusting to changing circumstances without becoming overly destabilized.",
      Medium:
        "Adaptability appears available, though certain stressors may require more effort to navigate than usual.",
      Low:
        "Patterns suggest change may currently require more energy than normal. This can feel like needing additional time or support when responding to new demands.",
    },
    Expression: {
      High:
        "Your voice reflects open and accessible expression. Thoughts, emotions, and internal experiences may be moving outward with relative ease.",
      Medium:
        "Expression appears available but selective. Certain thoughts or feelings may be easier to communicate than others.",
      Low:
        "Patterns suggest expression may be constrained or held back. This can feel like knowing what you want to say while struggling to fully communicate it.",
    },
    "Cognitive Load": {
      High:
        "Your mind appears actively engaged with multiple streams of processing. While this can support insight and problem-solving, it may also increase the need for recovery and mental space.",
      Medium:
        "Mental demand appears manageable, though periods of sustained focus may require deliberate decompression.",
      Low:
        "Current patterns suggest cognitive demands are relatively contained. This often allows more capacity for reflection, creativity, and restorative thinking.",
    },
  };

  return copy[name][level];
}

function pauseDensity(scan: VoiceAnalysisResult) {
  const dynamics = scan.voiceDynamics;
  if (typeof dynamics?.pauseDensityPerMin === "number") return dynamics.pauseDensityPerMin;
  if (!dynamics?.analyzedDurationMs) return 0;
  const minutes = dynamics.analyzedDurationMs / 60000;
  return minutes > 0 ? dynamics.pauseCount / minutes : 0;
}

function spectralBalance(scan: VoiceAnalysisResult) {
  const centroid = scan.spectralCentroidHz ?? 0;
  if (!centroid) return 0.5;
  if (centroid < 700) return 0.36;
  if (centroid > 2200) return 0.34;
  if (centroid > 1700) return 0.54;
  if (centroid < 950) return 0.58;
  return 0.78;
}

function pitchFlexibility(scan: VoiceAnalysisResult) {
  const range = scan.voiceDynamics?.pitchRangeSemitones ?? 0;
  if (!range) return 0.42;
  if (range < 2.5) return 0.34;
  if (range > 11) return 0.48;
  if (range >= 4 && range <= 8) return 0.82;
  return 0.64;
}

function respiratorySupport(scan: VoiceAnalysisResult) {
  const dynamics = scan.voiceDynamics;
  if (!dynamics) return 0.5;
  const voiced = dynamics.voicedFrameRatio;
  const clarity = dynamics.pitchClarity || 0.45;
  const hnrScore = clamp01(((dynamics.harmonicToNoiseRatioDb ?? 8) + 5) / 25);
  const resonance = scan.resonanceScore ?? 0.5;
  const flatness = dynamics.spectralFlatness ?? 0.22;
  return clamp01(voiced * 0.2 + clarity * 0.18 + hnrScore * 0.24 + resonance * 0.24 + (1 - flatness) * 0.14);
}

export function buildSystemDimensions(scan: VoiceAnalysisResult): SystemDimension[] {
  const dynamics = scan.voiceDynamics;
  const stability = dynamics?.pitchStability ?? 0.45;
  const clarity = dynamics?.pitchClarity ?? 0.45;
  const flatness = dynamics?.spectralFlatness ?? 0.22;
  const zcr = dynamics?.zeroCrossingRate ?? 0.08;
  const jitterScore = clamp01(1 - Math.min((dynamics?.jitterLocalPct ?? 1.2) / 4, 1));
  const shimmerScore = clamp01(1 - Math.min((dynamics?.shimmerLocalPct ?? 8) / 24, 1));
  const harmonicRichness = dynamics?.harmonicRichness ?? clamp01(1 - flatness);
  const formantStability = dynamics?.formantStability ?? 0.5;
  const voiced = dynamics?.voicedFrameRatio ?? 0.45;
  const pausesPerMinute = pauseDensity(scan);
  const pauseScore = pausesPerMinute <= 2 ? 0.74 : pausesPerMinute <= 5 ? 0.58 : 0.36;
  const capturePenalty = dynamics?.captureQuality === "poor" ? 0.82 : dynamics?.captureQuality === "fair" ? 0.94 : 1;

  const dimensions: Array<Omit<SystemDimension, "level" | "band">> = [
    {
      name: "Regulation",
      score: score((stability * 0.32 + jitterScore * 0.28 + spectralBalance(scan) * 0.24 + (1 - Math.min(zcr / 0.16, 1)) * 0.16) * capturePenalty),
      state: "balanced",
      derivedFrom: "pitch stability, jitter, spectral balance, and vocal noise patterns",
      interpretation:
        "Patterns may indicate how steadily your nervous system is organizing voice, tension, and responsiveness in this scan.",
      attention: "Lower regulation can appear as scattered pitch control, brighter tension, or less stable vocal tone.",
    },
    {
      name: "Vitality",
      score: score(((scan.resonanceScore ?? 0.5) * 0.34 + voiced * 0.22 + harmonicRichness * 0.44) * capturePenalty),
      state: "balanced",
      derivedFrom: "resonance strength, voiced energy, and harmonic richness",
      interpretation:
        "Patterns may reflect available energy, engagement, and how fully the voice is carrying overtone structure.",
      attention: "Lower vitality can be associated with depletion, reduced activation, or less available energy.",
    },
    {
      name: "Recovery",
      score: score((respiratorySupport(scan) * 0.48 + shimmerScore * 0.24 + (1 - Math.min((dynamics?.clippingFrameRatio ?? 0) * 6, 1)) * 0.1 + pauseScore * 0.18) * capturePenalty),
      state: "balanced",
      derivedFrom: "resonance support, shimmer, harmonic-to-noise estimate, pauses, and capture stability",
      interpretation:
        "Patterns may indicate whether your system sounds resourced, restored, and supported by steady breath.",
      attention: "Lower recovery can be associated with restoration needs, fatigue, or reduced respiratory support.",
    },
    {
      name: "Adaptability",
      score: score((pitchFlexibility(scan) * 0.72 + stability * 0.28) * capturePenalty),
      state: "balanced",
      derivedFrom: "pitch variability and pitch stability",
      interpretation:
        "Patterns may suggest emotional flexibility and the ability to shift tone without losing steadiness.",
      attention: "Lower adaptability can show up as restriction; very wide shifts may indicate overactivation.",
    },
    {
      name: "Expression",
      score: score((voiced * 0.32 + clarity * 0.22 + pitchFlexibility(scan) * 0.22 + formantStability * 0.24) * capturePenalty),
      state: "balanced",
      derivedFrom: "voiced expression ratio, pitch clarity, vocal range, and formant stability",
      interpretation:
        "Patterns may reflect how openly expression is moving through the voice during this sample.",
      attention: "Lower expression can be associated with held-back expression or reduced vocal engagement.",
    },
    {
      name: "Cognitive Load",
      score: score((Math.min(pausesPerMinute / 7, 1) * 0.46 + (1 - stability) * 0.28 + (1 - spectralBalance(scan)) * 0.26) * capturePenalty),
      state: "balanced",
      derivedFrom: "pause density, pitch stability, and spectral balance",
      interpretation:
        "Patterns may suggest how much mental processing demand was present while you were responding.",
      attention: "Lower scores can indicate heavier processing demand, urgency, or difficulty fully settling thoughts.",
    },
  ];

  return dimensions.map((dimension) => {
    const state = scoreToState(dimension.score);
    const level = scoreToLevel(dimension.score);
    return {
      ...dimension,
      level,
      band: scoreToBand(dimension.score),
      state,
      interpretation: dimensionMeaning(dimension.name, dimension.score),
    };
  });
}

export function buildSystemSignatures(scan: VoiceAnalysisResult): SystemSignature[] {
  const dynamics = scan.voiceDynamics;
  const centroid = scan.spectralCentroidHz ?? 0;
  const highCentroid = centroid > 1700 ? 1 : centroid > 1400 ? 0.65 : 0.2;
  const lowCentroid = centroid > 0 && centroid < 900 ? 1 : centroid < 1150 ? 0.65 : 0.2;
  const lowPitchRange = (dynamics?.pitchRangeSemitones ?? 0) > 0 && (dynamics?.pitchRangeSemitones ?? 0) < 3 ? 1 : 0.25;
  const fastPauses = pauseDensity(scan) > 5 ? 0.8 : pauseDensity(scan) > 3 ? 0.5 : 0.2;
  const lowVoicing = (dynamics?.voicedFrameRatio ?? 0.45) < 0.32 ? 1 : 0.25;
  const lowResonance = (scan.resonanceScore ?? 0.5) < 0.46 ? 1 : 0.25;
  const instability = 1 - (dynamics?.pitchStability ?? 0.55);
  const flatness = dynamics?.spectralFlatness ?? 0.22;
  const jitter = Math.min((dynamics?.jitterLocalPct ?? 1.2) / 4, 1);
  const shimmer = Math.min((dynamics?.shimmerLocalPct ?? 8) / 24, 1);
  const lowRichness = 1 - (dynamics?.harmonicRichness ?? clamp01(1 - flatness));

  const signatures: SystemSignature[] = [
    {
      name: "Stress Load",
      strength: score(highCentroid * 0.24 + instability * 0.22 + jitter * 0.22 + fastPauses * 0.16 + (flatness > 0.25 ? 0.16 : 0.06)),
      interpretation:
        "This pattern may be associated with sustained demand, upper-frequency tension, and nervous system load.",
      likelySystems: ["autonomic nervous system", "respiratory tension", "cognitive load"],
    },
    {
      name: "Fatigue Load",
      strength: score(lowVoicing * 0.22 + lowResonance * 0.24 + lowCentroid * 0.16 + shimmer * 0.2 + lowRichness * 0.18),
      interpretation:
        "This pattern may be associated with reduced available energy, restoration needs, or weaker respiratory support.",
      likelySystems: ["recovery systems", "energy regulation", "muscular endurance"],
    },
    {
      name: "Burnout Pattern",
      strength: score(lowPitchRange * 0.26 + lowResonance * 0.24 + lowVoicing * 0.18 + fastPauses * 0.14 + lowRichness * 0.18),
      interpretation:
        "This pattern may indicate reduced adaptability, energy depletion, or chronic stress adaptation.",
      likelySystems: ["stress response", "cognitive resources", "recovery capacity"],
    },
    {
      name: "Anxious Activation",
      strength: score(highCentroid * 0.28 + instability * 0.22 + jitter * 0.2 + ((dynamics?.pitchRangeSemitones ?? 0) > 10 ? 0.16 : 0.05) + fastPauses * 0.14),
      interpretation:
        "This pattern may be associated with vigilance, cognitive activation, or rapid state shifting.",
      likelySystems: ["sympathetic activation", "stress response", "emotional regulation"],
    },
    {
      name: "Low Activation",
      strength: score(lowPitchRange * 0.28 + lowVoicing * 0.3 + lowCentroid * 0.2 + lowResonance * 0.22),
      interpretation:
        "This pattern may be associated with reduced activation, lower expressive range, or heavier processing burden.",
      likelySystems: ["motivation networks", "energy regulation", "cognitive processing"],
    },
  ];

  return signatures.sort((a, b) => b.strength - a.strength).slice(0, 3);
}

export function buildSpectralMeasurements(scan: VoiceAnalysisResult): SpectralMeasurement[] {
  const dynamics = scan.voiceDynamics;
  if (!dynamics) return [];

  const pitchRange = dynamics.pitchRangeSemitones;
  const jitter = dynamics.jitterLocalPct ?? 0;
  const shimmer = dynamics.shimmerLocalPct ?? 0;
  const hnr = dynamics.harmonicToNoiseRatioDb ?? 0;
  const richness = dynamics.harmonicRichness ?? 0;
  const centroid = scan.spectralCentroidHz ?? 0;
  const formantStability = dynamics.formantStability ?? 0;
  const pauseRate = dynamics.pauseDensityPerMin ?? pauseDensity(scan);
  const pacing = dynamics.speechRateProxyPerMin ?? 0;

  return [
    {
      label: "Activation Baseline",
      level: "Informational",
      evidence: dynamics.medianPitchHz ? `Fundamental frequency ${dynamics.medianPitchHz} Hz` : "Limited pitch lock",
      meaning: dynamics.medianPitchHz
        ? "This is the pitch area your voice organized around most consistently. SoulScope uses it as one clue for your Core Resonance, not as a fixed identity."
        : "Your pitch did not settle clearly enough to lead the interpretation, so the scan leaned more heavily on broader voice patterns.",
    },
    {
      label: "Adaptability",
      level: pitchRange < 2.5 ? "Low" : pitchRange > 11 ? "High" : "Moderate",
      evidence: `Pitch variability ${pitchRange.toFixed(1)} semitones`,
      meaning:
        pitchRange < 2.5
          ? "Your voice stayed in a narrower range, which may suggest reduced emotional movement, guarded expression, or lower activation."
          : pitchRange > 11
          ? "Your voice moved through a wide range, which may suggest high activation, rapid state shifts, or a lot of energy moving through the system."
          : "Your voice showed enough movement to suggest flexibility without appearing scattered or overactivated.",
    },
    {
      label: "Regulation Stability",
      level: jitter > 2.2 ? "Low" : jitter > 0 ? "Moderate" : "Informational",
      evidence: `Jitter ${jitter.toFixed(2)}%`,
      meaning:
        jitter > 2.2
          ? "Small moment-to-moment shifts in vocal control were more noticeable during this scan. This pattern is often associated with increased effort, stress responsiveness, or a system working harder to remain steady."
          : jitter > 0
          ? "Moment-to-moment vocal stability appeared relatively steady, suggesting your system may not be investing excessive effort to remain balanced."
          : "There was not enough stable pitch tracking to read this feature strongly.",
    },
    {
      label: "Energy Consistency",
      level: shimmer > 14 ? "Low" : shimmer > 0 ? "Moderate" : "Informational",
      evidence: `Shimmer ${shimmer.toFixed(2)}%`,
      meaning:
        shimmer > 14
          ? "Changes in vocal energy appeared more variable throughout the recording. This pattern is often associated with fatigue, reduced recovery, or fluctuating physical resources."
          : shimmer > 0
          ? "Vocal energy stayed relatively consistent, suggesting your available resources may be holding steady during this scan."
          : "There was not enough voiced energy to read this feature strongly.",
    },
    {
      label: "Resonance Quality",
      level: hnr < 6 ? "Low" : hnr > 18 ? "High" : "Moderate",
      evidence: `Harmonic-to-noise estimate ${hnr.toFixed(1)} dB`,
      meaning:
        hnr < 6
          ? "The overall resonance profile appeared less supported than average. This can occur when energy, breath support, or recovery resources are under greater demand."
          : hnr > 18
          ? "The resonance profile appeared strongly supported, which may suggest organized vocal energy and available physiological resources."
          : "Your voice carried a usable level of clarity, suggesting enough support for the scan to interpret your current pattern.",
    },
    {
      label: "Activation Level",
      level: centroid > 1800 ? "High" : centroid > 0 && centroid < 900 ? "Low" : "Moderate",
      evidence: `Spectral centroid ${centroid} Hz`,
      meaning:
        centroid > 1800
          ? "Your vocal profile showed stronger upper-frequency activity. This pattern is commonly associated with alertness, urgency, heightened engagement, or increased nervous system activation."
          : centroid > 0 && centroid < 900
          ? "Your voice leaned darker or lower in energy, which may suggest fatigue, reduced activation, or a more withdrawn state."
          : "Your voice brightness sat in a moderate range, which may suggest a more balanced level of activation.",
    },
    {
      label: "Vitality",
      level: richness < 0.62 ? "Low" : richness > 0.86 ? "High" : "Moderate",
      evidence: `Harmonic richness ${Math.round(richness * 100)}%`,
      meaning:
        richness < 0.62
          ? "Your voice carried fewer layered overtones, which may suggest lower vitality, depletion, or reduced adaptive capacity."
          : richness > 0.86
          ? "Your voice carried strong overtone complexity, which may suggest available energy and responsiveness."
          : "Your voice carried moderate overtone complexity, suggesting some available energy without strong signs of depletion or overactivation.",
    },
    {
      label: "Expression Clarity",
      level: formantStability < 0.45 ? "Low" : "Moderate",
      evidence: `Formant stability ${Math.round(formantStability * 100)}%`,
      meaning:
        formantStability < 0.45
          ? "Your resonance shifted more during the scan, which may suggest expression was less settled or harder to hold consistently."
          : "Your resonance stayed relatively consistent, which may suggest clearer expression and more stable vocal engagement.",
    },
    {
      label: "Processing Rhythm",
      level: pauseRate > 5 ? "High" : "Moderate",
      evidence: `Pause density ${pauseRate.toFixed(1)} pauses/min`,
      meaning:
        pauseRate > 5
          ? "Your speech included more reflective pauses than average. This can indicate careful processing, active reflection, or increased mental demand."
          : "Your pacing included natural space without suggesting unusually high processing demand.",
    },
    {
      label: "Processing Tempo",
      level: pacing > 18 ? "High" : pacing > 0 && pacing < 7 ? "Low" : "Moderate",
      evidence: `Speech pacing proxy ${pacing.toFixed(1)} voiced runs/min`,
      meaning:
        pacing > 18
          ? "Your responses came in more frequent vocal bursts, which may suggest urgency, active processing, or a lot moving through your mind."
          : pacing > 0 && pacing < 7
          ? "Your responses came in fewer vocal bursts, which may suggest slower processing, lower activation, or a more reflective pace."
          : "Your response pacing appears moderate. This is a voice-activity estimate, not a words-per-minute count.",
    },
  ];
}
