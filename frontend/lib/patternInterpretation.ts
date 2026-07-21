import { type UserResultDomain } from "./systemDimensions";
import { type VoiceAnalysisResult } from "./voiceSpectrum";

export type PatternFamily =
  | "overextended"
  | "reflective"
  | "protective"
  | "adaptive"
  | "recovering"
  | "grounded"
  | "expressive"
  | "purposeful"
  | "activated"
  | "reorganizing";

export type EvidencePolarity = "supporting" | "contradictory" | "missing";

export type EvidenceEntry = {
  id: string;
  label: string;
  value: number;
  confidence: number;
  polarity: EvidencePolarity;
  measurements: Record<string, number | string | boolean | null>;
  prompts: string[];
  longitudinal: boolean;
  rationale: string;
};

export type EvidenceLedger = {
  supporting: EvidenceEntry[];
  contradictory: EvidenceEntry[];
  missing: EvidenceEntry[];
  quality: {
    usable: boolean;
    confidence: number;
    reasons: string[];
  };
};

export type StateVector = {
  activation: number;
  organization: number;
  regulation: number;
  expression: number;
  relationalOrientation: number;
  direction: number;
  capacity: number;
};

export type ScoredDimension = {
  key: keyof StateVector;
  label: string;
  state: string;
  score: number;
  confidence: number;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
};

export type DynamicPatternResult = {
  family: PatternFamily;
  dimensions: Record<keyof StateVector, ScoredDimension>;
  evidenceLedger: EvidenceLedger;
  stateVector: StateVector;
  patternSignature: string;
  displayName: string;
  confidence: number;
  interpretationLimits: string[];
  decisionLedger: {
    selected: string;
    rejected: Array<{
      id: string;
      name: string;
      reasons: string[];
    }>;
    alternatives: Array<{
      id: string;
      name: string;
      compatibility: number;
      supportingEvidence: string[];
      contradictoryEvidence: string[];
      missingEvidence: string[];
    }>;
  };
  baseline: {
    subjectId: string | null;
    comparisonAvailable: boolean;
    identityConfidence: number;
    deviationScore: number | null;
    changedDimensions: string[];
  };
};

export type LegacyPatternCandidate = {
  id: string;
  name: string;
  confidence: number;
};

type PromptAnalysis = NonNullable<NonNullable<VoiceAnalysisResult["analysisDebug"]>["promptAnalyses"]>[number];

function clamp(value: number, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function normalize(value: number, low: number, high: number) {
  return clamp((value - low) / Math.max(1, high - low));
}

function addEvidence(ledger: EvidenceLedger, entry: EvidenceEntry) {
  ledger[entry.polarity].push({
    ...entry,
    value: Number(clamp(entry.value).toFixed(3)),
    confidence: Number(clamp(entry.confidence).toFixed(3)),
  });
}

function promptTitles(prompts: PromptAnalysis[]) {
  return prompts.map((prompt) => `Prompt ${prompt.index + 1}`);
}

function qualityLedger(scan: VoiceAnalysisResult): EvidenceLedger["quality"] {
  const dynamics = scan.voiceDynamics;
  const reasons: string[] = [];
  let confidence = 0.72;

  if (!dynamics) {
    return { usable: false, confidence: 0.15, reasons: ["Voice dynamics were unavailable."] };
  }
  if (dynamics.captureQuality === "poor") {
    confidence -= 0.32;
    reasons.push("Capture quality was poor.");
  }
  if (dynamics.voicedFrameCount < 16) {
    confidence -= 0.22;
    reasons.push("Voiced-frame count was limited.");
  }
  if (dynamics.voicedFrameRatio < 0.18) {
    confidence -= 0.18;
    reasons.push("Voiced speech ratio was low.");
  }
  if (dynamics.clippingFrameRatio > 0.08) {
    confidence -= 0.16;
    reasons.push("Clipping was present in the audio.");
  }
  if ((scan.protocolNotes?.camera?.trackingConfidence ?? 1) < 0.45) {
    confidence -= 0.08;
    reasons.push("Camera tracking confidence was limited.");
  }

  return {
    usable: confidence >= 0.35,
    confidence: Number(clamp(confidence).toFixed(3)),
    reasons: reasons.length ? reasons : ["Capture quality was sufficient for a bounded reflection."],
  };
}

export function buildEvidenceLedger(scan: VoiceAnalysisResult): EvidenceLedger {
  const ledger: EvidenceLedger = {
    supporting: [],
    contradictory: [],
    missing: [],
    quality: qualityLedger(scan),
  };
  const dynamics = scan.voiceDynamics;
  const prompts = scan.analysisDebug?.promptAnalyses ?? [];
  const promptCameras = scan.protocolNotes?.prompts?.filter((prompt) => prompt.camera) ?? [];
  const camera = scan.protocolNotes?.camera;
  const cameraBaseline = scan.protocolNotes?.cameraBaseline;

  if (!dynamics) {
    addEvidence(ledger, {
      id: "voice-dynamics-missing",
      label: "Voice dynamics unavailable",
      value: 1,
      confidence: 0.9,
      polarity: "missing",
      measurements: {},
      prompts: [],
      longitudinal: false,
      rationale: "The scan cannot score voice-derived dynamics without voice timing and pitch features.",
    });
    return ledger;
  }

  const activationValue = mean([
    normalize(dynamics.speechRateProxyPerMin ?? 0, 80, 210),
    normalize(dynamics.pitchRangeSemitones, 4, 18),
    normalize(dynamics.voicedFrameRatio, 0.24, 0.7),
    normalize(dynamics.harmonicRichness ?? 0, 0.2, 0.8),
  ]);
  if (activationValue >= 0.58) {
    addEvidence(ledger, {
      id: "high-activation",
      label: "High activation",
      value: activationValue,
      confidence: ledger.quality.confidence,
      polarity: "supporting",
      measurements: {
        speechRateProxyPerMin: dynamics.speechRateProxyPerMin ?? null,
        pitchRangeSemitones: dynamics.pitchRangeSemitones,
        voicedFrameRatio: dynamics.voicedFrameRatio,
      },
      prompts: [],
      longitudinal: false,
      rationale: "Speech rate, pitch range, and voiced activity suggest elevated activation.",
    });
  }

  const fragmentationValue = mean([
    normalize(dynamics.pauseCount, 2, 7),
    normalize(dynamics.averagePauseMs, 260, 1100),
    normalize(1 - dynamics.pitchStability, 0.24, 0.72),
    normalize(dynamics.spectralFlatness ?? 0, 0.15, 0.52),
  ]);
  if (fragmentationValue >= 0.55) {
    addEvidence(ledger, {
      id: "activation-with-fragmentation",
      label: "Activation with fragmentation",
      value: fragmentationValue,
      confidence: ledger.quality.confidence,
      polarity: "supporting",
      measurements: {
        pauseCount: dynamics.pauseCount,
        averagePauseMs: dynamics.averagePauseMs,
        pitchStability: dynamics.pitchStability,
        spectralFlatness: dynamics.spectralFlatness ?? null,
      },
      prompts: [],
      longitudinal: false,
      rationale: "Pauses, pitch instability, and spectral flatness suggest organization may be harder under activation.",
    });
  } else if (activationValue >= 0.52) {
    addEvidence(ledger, {
      id: "activation-with-coherence",
      label: "Activation with coherence",
      value: 1 - fragmentationValue,
      confidence: ledger.quality.confidence,
      polarity: "supporting",
      measurements: {
        pauseCount: dynamics.pauseCount,
        pitchStability: dynamics.pitchStability,
      },
      prompts: [],
      longitudinal: false,
      rationale: "Activation is present, but the available timing and pitch features remain comparatively organized.",
    });
  }

  if (prompts.length >= 2) {
    const resonanceValues = prompts.map((prompt) => prompt.resonanceScore);
    const pitchRanges = prompts.map((prompt) => prompt.voiceDynamics?.pitchRangeSemitones ?? 0);
    const speechRates = prompts.map((prompt) => prompt.voiceDynamics?.speechRateProxyPerMin ?? 0);
    const first = mean(resonanceValues.slice(0, Math.ceil(prompts.length / 2)));
    const last = mean(resonanceValues.slice(Math.floor(prompts.length / 2)));
    const escalation = normalize(last - first, 0.05, 0.28);
    const variability = mean([
      normalize(standardDeviation(resonanceValues), 0.04, 0.24),
      normalize(standardDeviation(pitchRanges), 1.2, 7),
      normalize(standardDeviation(speechRates), 8, 44),
    ]);

    if (escalation >= 0.45 || variability >= 0.55) {
      addEvidence(ledger, {
        id: "cross-prompt-escalation",
        label: "Cross-prompt modulation",
        value: Math.max(escalation, variability),
        confidence: ledger.quality.confidence,
        polarity: "supporting",
        measurements: {
          firstHalfResonance: Number(first.toFixed(3)),
          secondHalfResonance: Number(last.toFixed(3)),
          resonanceSpread: Number(standardDeviation(resonanceValues).toFixed(3)),
          pitchRangeSpread: Number(standardDeviation(pitchRanges).toFixed(3)),
        },
        prompts: promptTitles(prompts),
        longitudinal: false,
        rationale: "Prompt-level features changed enough that a scan-wide average may hide important modulation.",
      });
    }
  } else {
    addEvidence(ledger, {
      id: "prompt-level-evidence-missing",
      label: "Prompt-level evidence unavailable",
      value: 1,
      confidence: 0.8,
      polarity: "missing",
      measurements: {},
      prompts: [],
      longitudinal: false,
      rationale: "Cross-prompt modulation cannot be scored without prompt-level audio summaries.",
    });
  }

  if (camera && camera.trackingConfidence >= 0.45) {
    const visualActivation = mean([
      normalize(camera.facialTension, 0.32, 0.72),
      normalize(camera.blinkRatePerMin, 12, 34),
      normalize(1 - camera.eyeOpenness, 0.18, 0.62),
    ]);
    const divergence = Math.abs(visualActivation - activationValue);
    addEvidence(ledger, {
      id: divergence >= 0.32 ? "vocal-facial-divergence" : "vocal-facial-congruence",
      label: divergence >= 0.32 ? "Vocal-facial divergence" : "Vocal-facial congruence",
      value: divergence >= 0.32 ? divergence : 1 - divergence,
      confidence: Math.min(ledger.quality.confidence, camera.trackingConfidence),
      polarity: "supporting",
      measurements: {
        vocalActivation: Number(activationValue.toFixed(3)),
        visualActivation: Number(visualActivation.toFixed(3)),
        trackingConfidence: camera.trackingConfidence,
      },
      prompts: promptCameras.map((prompt) => prompt.title),
      longitudinal: false,
      rationale:
        divergence >= 0.32
          ? "Voice and visible expression did not move in the same direction, so interpretation should preserve that mismatch."
          : "Voice and visible expression moved in a broadly aligned direction.",
    });
  } else {
    addEvidence(ledger, {
      id: "camera-evidence-missing",
      label: "Reliable camera evidence unavailable",
      value: 1,
      confidence: 0.72,
      polarity: "missing",
      measurements: { trackingConfidence: camera?.trackingConfidence ?? null },
      prompts: [],
      longitudinal: false,
      rationale: "Cross-modal congruence cannot be strongly scored without reliable camera tracking.",
    });
  }

  if (camera && cameraBaseline && camera.trackingConfidence >= 0.45) {
    const recoveryDelta =
      (camera.facialTension - cameraBaseline.facialTension) +
      (camera.blinkRatePerMin - cameraBaseline.blinkRatePerMin) / 40 -
      (camera.eyeOpenness - cameraBaseline.eyeOpenness);
    if (recoveryDelta >= 0.26) {
      addEvidence(ledger, {
        id: "slow-recovery",
        label: "Slow recovery",
        value: normalize(recoveryDelta, 0.18, 0.8),
        confidence: Math.min(ledger.quality.confidence, camera.trackingConfidence),
        polarity: "supporting",
        measurements: {
          facialTensionDelta: Number((camera.facialTension - cameraBaseline.facialTension).toFixed(3)),
          blinkDelta: Number((camera.blinkRatePerMin - cameraBaseline.blinkRatePerMin).toFixed(1)),
          eyeOpennessDelta: Number((camera.eyeOpenness - cameraBaseline.eyeOpenness).toFixed(3)),
        },
        prompts: [],
        longitudinal: false,
        rationale: "Camera summary stayed more activated than the opening baseline.",
      });
    }
  } else {
    addEvidence(ledger, {
      id: "recovery-evidence-missing",
      label: "Recovery evidence unavailable",
      value: 1,
      confidence: 0.7,
      polarity: "missing",
      measurements: {},
      prompts: [],
      longitudinal: false,
      rationale: "Recovery cannot be scored strongly without a reliable opening baseline and later comparison.",
    });
  }

  addEvidence(ledger, {
    id: "baseline-deviation-unavailable",
    label: "Personal baseline unavailable",
    value: 1,
    confidence: 1,
    polarity: "missing",
    measurements: {},
    prompts: [],
    longitudinal: true,
    rationale: "No confirmed scan subject and eligible prior scan set were supplied, so personal baseline deviation is not used.",
  });

  return ledger;
}

function evidenceValue(ledger: EvidenceLedger, id: string) {
  return ledger.supporting.find((entry) => entry.id === id)?.value ?? 0;
}

function evidenceConfidence(ledger: EvidenceLedger, ids: string[]) {
  const entries = ledger.supporting.filter((entry) => ids.includes(entry.id));
  if (!entries.length) return ledger.quality.confidence * 0.55;
  return mean(entries.map((entry) => entry.confidence));
}

function buildStateVector(ledger: EvidenceLedger, domains: UserResultDomain[]): StateVector {
  const byDomain = (title: UserResultDomain["title"]) => domains.find((domain) => domain.title === title)?.score ?? 50;
  const highActivation = evidenceValue(ledger, "high-activation");
  const fragmentation = evidenceValue(ledger, "activation-with-fragmentation");
  const coherence = evidenceValue(ledger, "activation-with-coherence");
  const escalation = evidenceValue(ledger, "cross-prompt-escalation");
  const slowRecovery = evidenceValue(ledger, "slow-recovery");
  const congruence = evidenceValue(ledger, "vocal-facial-congruence");
  const divergence = evidenceValue(ledger, "vocal-facial-divergence");

  return {
    activation: clamp(mean([highActivation, byDomain("Energy & Vitality") / 100, byDomain("Emotional Expression") / 100, escalation])),
    organization: clamp(0.62 + coherence * 0.24 - fragmentation * 0.52 - divergence * 0.12),
    regulation: clamp(byDomain("Regulation") / 100 - slowRecovery * 0.3 - escalation * 0.18),
    expression: clamp(mean([byDomain("Communication & Clarity") / 100, byDomain("Emotional Expression") / 100, highActivation * 0.8])),
    relationalOrientation: clamp(byDomain("Connection & Support") / 100 + congruence * 0.1 - divergence * 0.14),
    direction: clamp(byDomain("Direction & Adaptability") / 100 + escalation * 0.08),
    capacity: clamp(mean([byDomain("Recovery & Restoration") / 100, byDomain("Regulation") / 100]) - slowRecovery * 0.24 - fragmentation * 0.16),
  };
}

function stateFor(key: keyof StateVector, score: number) {
  const bands: Record<keyof StateVector, [string, string, string, string]> = {
    activation: ["low", "settled", "elevated", "high"],
    organization: ["fragmenting", "searching", "coherent", "highly coherent"],
    regulation: ["strained", "effortful", "steady", "flexible"],
    expression: ["contained", "measured", "open", "forceful"],
    relationalOrientation: ["inward", "selective", "available", "connected"],
    direction: ["dispersed", "exploratory", "focused", "action-oriented"],
    capacity: ["taxed", "limited", "available", "sustained"],
  };
  const [low, midLow, midHigh, high] = bands[key];
  if (score < 0.34) return low;
  if (score < 0.52) return midLow;
  if (score < 0.72) return midHigh;
  return high;
}

function dimension(
  key: keyof StateVector,
  score: number,
  ledger: EvidenceLedger,
  supportingIds: string[],
  contradictoryIds: string[] = [],
): ScoredDimension {
  const labels: Record<keyof StateVector, string> = {
    activation: "Activation",
    organization: "Organization",
    regulation: "Regulation",
    expression: "Expression",
    relationalOrientation: "Relational Orientation",
    direction: "Direction",
    capacity: "Capacity",
  };
  return {
    key,
    label: labels[key],
    state: stateFor(key, score),
    score: Number(score.toFixed(3)),
    confidence: Number(evidenceConfidence(ledger, supportingIds).toFixed(3)),
    supportingEvidence: supportingIds.filter((id) => ledger.supporting.some((entry) => entry.id === id)),
    contradictoryEvidence: contradictoryIds.filter((id) => ledger.supporting.some((entry) => entry.id === id)),
    missingEvidence: ledger.missing.map((entry) => entry.id),
  };
}

function buildDimensions(vector: StateVector, ledger: EvidenceLedger): DynamicPatternResult["dimensions"] {
  return {
    activation: dimension("activation", vector.activation, ledger, ["high-activation", "cross-prompt-escalation"]),
    organization: dimension("organization", vector.organization, ledger, ["activation-with-coherence"], ["activation-with-fragmentation"]),
    regulation: dimension("regulation", vector.regulation, ledger, ["vocal-facial-congruence"], ["slow-recovery", "cross-prompt-escalation"]),
    expression: dimension("expression", vector.expression, ledger, ["high-activation", "vocal-facial-congruence", "vocal-facial-divergence"]),
    relationalOrientation: dimension("relationalOrientation", vector.relationalOrientation, ledger, ["vocal-facial-congruence"], ["vocal-facial-divergence"]),
    direction: dimension("direction", vector.direction, ledger, ["cross-prompt-escalation"]),
    capacity: dimension("capacity", vector.capacity, ledger, ["activation-with-coherence"], ["slow-recovery", "activation-with-fragmentation"]),
  };
}

function chooseFamily(vector: StateVector): PatternFamily {
  if (vector.activation >= 0.7 && vector.capacity < 0.45) return "activated";
  if (vector.organization < 0.42) return "reorganizing";
  if (vector.regulation >= 0.6 && vector.capacity >= 0.58) return "grounded";
  if (vector.expression >= 0.68) return "expressive";
  if (vector.relationalOrientation < 0.42) return "protective";
  if (vector.capacity < 0.42) return "overextended";
  if (vector.direction >= 0.68) return "purposeful";
  return "adaptive";
}

function displayName(vector: StateVector, family: PatternFamily) {
  if (family === "grounded") return "The Grounded Navigator";
  if (family === "activated" && vector.organization < 0.45) return "The Pressurized Reorganizer";
  if (family === "activated" && vector.organization >= 0.58) return "The Coherent Accelerator";
  if (family === "protective") return "The Selective Protector";
  if (family === "overextended") return "The Overextended Steward";
  if (family === "expressive" && vector.capacity < 0.5) return "The Expression Under Pressure";
  if (family === "reorganizing") return "The Reorganizing Explorer";
  if (family === "purposeful") return "The Focused Navigator";
  return "The Adaptive Integrator";
}

function compatibility(name: string, vector: StateVector, ledger: EvidenceLedger) {
  const fragmentation = evidenceValue(ledger, "activation-with-fragmentation");
  const escalation = evidenceValue(ledger, "cross-prompt-escalation");
  const slowRecovery = evidenceValue(ledger, "slow-recovery");
  const score =
    name === "grounded"
      ? vector.organization * 0.3 + vector.regulation * 0.34 + vector.capacity * 0.28 - fragmentation * 0.24 - escalation * 0.16 - slowRecovery * 0.18
      : name === "activated"
      ? vector.activation * 0.42 + (1 - vector.capacity) * 0.22 + escalation * 0.18 + fragmentation * 0.14
      : name === "protective"
      ? (1 - vector.relationalOrientation) * 0.36 + vector.regulation * 0.18 + evidenceValue(ledger, "vocal-facial-divergence") * 0.2
      : name === "reorganizing"
      ? (1 - vector.organization) * 0.42 + fragmentation * 0.28 + vector.activation * 0.12
      : vector.direction * 0.2 + vector.expression * 0.16 + vector.regulation * 0.16;
  return clamp(score);
}

function buildPatternSignature(dimensions: DynamicPatternResult["dimensions"]) {
  return [
    `activation:${dimensions.activation.state}`,
    `organization:${dimensions.organization.state}`,
    `regulation:${dimensions.regulation.state}`,
    `expression:${dimensions.expression.state}`,
    `relationship:${dimensions.relationalOrientation.state}`,
    `direction:${dimensions.direction.state}`,
    `capacity:${dimensions.capacity.state}`,
  ].join("+");
}

function buildDecisionLedger(
  family: PatternFamily,
  name: string,
  vector: StateVector,
  ledger: EvidenceLedger,
  legacyCandidates: LegacyPatternCandidate[],
): DynamicPatternResult["decisionLedger"] {
  const candidates = [
    { id: "grounded", name: "Grounded Navigator" },
    { id: "activated", name: "Activated Pattern" },
    { id: "protective", name: "Protective Pattern" },
    { id: "reorganizing", name: "Reorganizing Pattern" },
    { id: "adaptive", name: "Adaptive Pattern" },
  ].map((candidate) => {
    const supportingEvidence = ledger.supporting
      .filter((entry) => {
        if (candidate.id === "grounded") return ["activation-with-coherence", "vocal-facial-congruence"].includes(entry.id);
        if (candidate.id === "activated") return ["high-activation", "cross-prompt-escalation"].includes(entry.id);
        if (candidate.id === "protective") return ["vocal-facial-divergence", "slow-recovery"].includes(entry.id);
        if (candidate.id === "reorganizing") return ["activation-with-fragmentation", "cross-prompt-escalation"].includes(entry.id);
        return true;
      })
      .map((entry) => entry.id);
    const contradictoryEvidence =
      candidate.id === "grounded"
        ? ledger.supporting
            .filter((entry) => ["high-activation", "activation-with-fragmentation", "cross-prompt-escalation", "slow-recovery"].includes(entry.id))
            .map((entry) => entry.id)
        : [];
    return {
      id: candidate.id,
      name: candidate.name,
      compatibility: Number(compatibility(candidate.id, vector, ledger).toFixed(3)),
      supportingEvidence,
      contradictoryEvidence,
      missingEvidence: ledger.missing.map((entry) => entry.id),
    };
  }).sort((a, b) => b.compatibility - a.compatibility);

  const rejected = candidates
    .filter((candidate) => candidate.id !== family)
    .slice(0, 4)
    .map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      reasons: [
        candidate.contradictoryEvidence.length
          ? `Contradicted by ${candidate.contradictoryEvidence.join(", ")}.`
          : `Compatibility ${candidate.compatibility} did not exceed selected signature.`,
        candidate.missingEvidence.length ? `Missing evidence: ${candidate.missingEvidence.slice(0, 2).join(", ")}.` : "",
      ].filter(Boolean),
    }));

  return {
    selected: `${name} from ${family} family`,
    rejected: [
      ...rejected,
      ...legacyCandidates.slice(0, 3).map((candidate) => ({
        id: `legacy:${candidate.id}`,
        name: candidate.name,
        reasons: [`Legacy profile score ${candidate.confidence.toFixed(3)} retained for comparison only.`],
      })),
    ],
    alternatives: candidates,
  };
}

function confidenceFor(dimensions: DynamicPatternResult["dimensions"], ledger: EvidenceLedger) {
  const dimensionConfidence = mean(Object.values(dimensions).map((item) => item.confidence));
  const contradictionLoad = ledger.contradictory.length * 0.06;
  const missingLoad = ledger.missing.length * 0.035;
  return Number(clamp(mean([dimensionConfidence, ledger.quality.confidence]) - contradictionLoad - missingLoad).toFixed(3));
}

export function buildDynamicPatternResult(
  scan: VoiceAnalysisResult,
  domains: UserResultDomain[],
  legacyCandidates: LegacyPatternCandidate[] = [],
): DynamicPatternResult {
  const evidenceLedger = buildEvidenceLedger(scan);
  const stateVector = buildStateVector(evidenceLedger, domains);
  const dimensions = buildDimensions(stateVector, evidenceLedger);
  const family = chooseFamily(stateVector);
  const name = displayName(stateVector, family);
  const patternSignature = buildPatternSignature(dimensions);
  const confidence = confidenceFor(dimensions, evidenceLedger);
  const subject = scan.scanMeta?.subject;
  const subjectId = subject?.subjectId ?? null;
  const identityConfidence = subject?.identityConfidence ?? 0;
  const comparisonAvailable = Boolean(subjectId && subject?.historyEligible === true && identityConfidence >= 0.7);

  return {
    family,
    dimensions,
    evidenceLedger,
    stateVector,
    patternSignature,
    displayName: name,
    confidence,
    interpretationLimits: [
      ...(!evidenceLedger.quality.usable ? ["Capture quality limits the strength of this interpretation."] : []),
      "The pattern describes measured signal relationships, not a diagnosis or fixed identity.",
      "Personal baseline comparison is disabled until a confirmed scan subject has enough eligible prior scans.",
    ],
    decisionLedger: buildDecisionLedger(family, name, stateVector, evidenceLedger, legacyCandidates),
    baseline: {
      subjectId,
      comparisonAvailable,
      identityConfidence,
      deviationScore: null,
      changedDimensions: [],
    },
  };
}
