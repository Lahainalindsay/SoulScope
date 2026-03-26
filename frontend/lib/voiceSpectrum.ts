import { type CymaticReference } from "./cymatics";
import { NOTE_ORDER, getSoulScopeNoteProfile } from "./noteSystem";
import { NOTE_BAND_CONFIG, getNoteBandInterpretiveSummary } from "./noteBands";

export type SpectrumStatus = "dominant" | "balanced" | "underrepresented" | "overrepresented";

export type SpectrumBandResult = {
  key: string;
  label: string;
  rangeHz: [number, number];
  frequencyLabel?: string;
  frequencyRefs?: number[];
  interpretiveChakra?: string;
  relativeEnergy: number;
  status: SpectrumStatus;
  correlates: string;
  note: string;
  practice: string;
};

export type NoteEnergyResult = {
  note: string;
  score: number;
  relativeEnergy: number;
  status: "underactive" | "balanced" | "overactive";
};

export type VoiceDynamics = {
  analyzedDurationMs: number;
  voicedDurationMs: number;
  silenceDurationMs: number;
  voicedFrameRatio: number;
  voicedFrameCount: number;
  pitchFrameCount: number;
  pauseCount: number;
  averagePauseMs: number;
  longestPauseMs: number;
  medianPitchHz: number | null;
  lowPitchHz: number | null;
  highPitchHz: number | null;
  medianMidi: number | null;
  dominantOctave: number | null;
  pitchRangeHz: number;
  pitchRangeSemitones: number;
  pitchStability: number;
  pitchClarity: number;
  primaryNoteSource: "tracked-pitch" | "spectral-fallback";
};

export type VoiceAnalysisResult = {
  summary: string;
  coreFrequencyHz: number;
  spectralCentroidHz: number;
  resonanceScore: number;
  dominantBand: string;
  dominantBandLabel: string;
  noteEnergies?: NoteEnergyResult[];
  spectrumBands: SpectrumBandResult[];
  missingBands: SpectrumBandResult[];
  excessBands: SpectrumBandResult[];
  findings: string[];
  supportPlan: string[];
  noteInterpretation?: {
    primaryNote: string;
    oppositeNote: string;
    emotionalPattern: string;
    physicalPattern: string;
    oppositePattern: string;
    progression?: string[];
  };
  protocolNotes?: {
    overview: string[];
    prompts: {
      id: string;
      title: string;
      rangeLabel?: string;
      prompt: string;
      rationale: string;
      durationMs?: number;
      primaryNote?: string;
      noteScores?: {
        note: string;
        score: number;
      }[];
    }[];
  };
  researchBasis?: {
    validationNote: string;
    references: {
      title: string;
      url: string;
      type: string;
      note: string;
    }[];
  };
  cymaticReference?: CymaticReference;
  methodology: string;
  caution: string;
  chakraScores?: Record<string, number>;
  dominant?: string;
  voiceDynamics?: VoiceDynamics;
};

type RawBandConfig = {
  key: string;
  label: string;
  rangeHz: [number, number];
  frequencyLabel: string;
  frequencyRefs: number[];
  interpretiveChakra: string;
  correlates: string;
  balancedNote: string;
  underactiveNote: string;
  overactiveNote: string;
  practice: string;
};

const BAND_CONFIG: RawBandConfig[] = NOTE_BAND_CONFIG.map((config) => {
  const refs = config.frequencyRefs;
  const summary = getNoteBandInterpretiveSummary(config.note);

  return {
    key: config.key,
    label: config.label,
    rangeHz: [refs[0] ?? 0, refs[refs.length - 1] ?? 0],
    frequencyLabel: config.frequencyLabel,
    frequencyRefs: config.frequencyRefs,
    interpretiveChakra: config.interpretiveChakra,
    correlates: summary.correlates,
    balancedNote: summary.balanced,
    underactiveNote: summary.underactive,
    overactiveNote: summary.overactive,
    practice: summary.practice,
  };
});

function averageChannels(audioBuffer: AudioBuffer) {
  const mono = new Float32Array(audioBuffer.length);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      mono[i] += data[i] / audioBuffer.numberOfChannels;
    }
  }

  return mono;
}

function normalizeQuietAudio(samples: Float32Array) {
  let peak = 0;

  for (let i = 0; i < samples.length; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i] ?? 0));
  }

  if (peak <= 0 || peak >= 0.18) {
    return samples;
  }

  const gain = Math.min(8, 0.18 / peak);
  const normalized = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i += 1) {
    normalized[i] = Math.max(-1, Math.min(1, (samples[i] ?? 0) * gain));
  }

  return normalized;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

const MIN_VOICED_FRAME_RMS = 0.0035;
const MIN_VOICED_FRAMES = 4;
const MIN_VOICED_FRAME_RATIO = 0.06;
const MIN_PITCH_FRAMES = 6;
const MIN_PAUSE_MS = 180;
const MIN_SPEECH_PITCH_HZ = 85;
const MAX_SPEECH_PITCH_HZ = 340;
const MAX_SPEECH_FLATNESS = 0.38;
const MAX_SPEECH_ZCR = 0.16;
const MIN_PITCH_CLARITY = 0.6;

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function hzToNoteName(hz: number) {
  const midi = Math.round(69 + 12 * Math.log2(Math.max(hz, 1e-6) / 440));
  return NOTE_ORDER[((midi % 12) + 12) % 12];
}

function hzToMidi(hz: number) {
  return 69 + 12 * Math.log2(Math.max(hz, 1e-6) / 440);
}

function midiToNoteName(midi: number) {
  return NOTE_ORDER[((Math.round(midi) % 12) + 12) % 12];
}

function midiToOctave(midi: number) {
  return Math.floor(Math.round(midi) / 12) - 1;
}

function getNoteProfile(hz: number) {
  return getSoulScopeNoteProfile(hzToNoteName(hz));
}

function describeNoteEnergy(note: string, relativeEnergy: number): NoteEnergyResult {
  const score = Math.round(relativeEnergy * 3600) / 10;
  return {
    note,
    score,
    relativeEnergy: clamp01(relativeEnergy),
    status:
      score > 34 ? "overactive" : score < 26 ? "underactive" : "balanced",
  };
}

function describeBand(config: RawBandConfig, relativeEnergy: number): SpectrumBandResult {
  let status: SpectrumStatus = "balanced";
  let note = config.balancedNote;

  if (relativeEnergy >= 0.96) {
    status = "overrepresented";
    note = config.overactiveNote;
  } else if (relativeEnergy >= 0.82) {
    status = "dominant";
    note = config.overactiveNote;
  } else if (relativeEnergy < 0.62) {
    status = "underrepresented";
    note = config.underactiveNote;
  }

  return {
    key: config.key,
    label: config.label,
    rangeHz: config.rangeHz,
    frequencyLabel: config.frequencyLabel,
    frequencyRefs: config.frequencyRefs,
    interpretiveChakra: config.interpretiveChakra,
    relativeEnergy: clamp01(relativeEnergy),
    status,
    correlates: config.correlates,
    note,
    practice: config.practice,
  };
}

function percentile(sortedValues: number[], fraction: number) {
  if (!sortedValues.length) return 0;
  const index = (sortedValues.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower] ?? 0;
  }

  const weight = index - lower;
  return (sortedValues[lower] ?? 0) * (1 - weight) + (sortedValues[upper] ?? 0) * weight;
}

function estimatePitchHz(
  frame: Float32Array,
  sampleRate: number,
  minHz = MIN_SPEECH_PITCH_HZ,
  maxHz = MAX_SPEECH_PITCH_HZ
): { hz: number | null; clarity: number } {
  let mean = 0;
  for (let i = 0; i < frame.length; i += 1) {
    mean += frame[i] ?? 0;
  }
  mean /= frame.length || 1;

  const centered = new Float32Array(frame.length);
  for (let i = 0; i < frame.length; i += 1) {
    centered[i] = (frame[i] ?? 0) - mean;
  }

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(frame.length - 2, Math.floor(sampleRate / minHz));
  let bestLag = -1;
  let bestCorrelation = 0;
  const correlations: number[] = [];

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;

    for (let i = 0; i + lag < centered.length; i += 1) {
      const a = centered[i] ?? 0;
      const b = centered[i + lag] ?? 0;
      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }

    const normalized = correlation / Math.sqrt(Math.max(energyA * energyB, 1e-12));
    correlations.push(normalized);
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorrelation < 0.55) {
    return { hz: null, clarity: clamp01(bestCorrelation) };
  }

  const peakThreshold = Math.max(MIN_PITCH_CLARITY, bestCorrelation * 0.92);
  for (let index = 1; index < correlations.length - 1; index += 1) {
    const previous = correlations[index - 1] ?? 0;
    const current = correlations[index] ?? 0;
    const next = correlations[index + 1] ?? 0;

    if (current >= peakThreshold && current >= previous && current >= next) {
      bestLag = minLag + index;
      bestCorrelation = current;
      break;
    }
  }

  const neighboring: number[] = [];
  for (let offset = -1; offset <= 1; offset += 1) {
    const lag = bestLag + offset;
    if (lag < minLag || lag > maxLag) {
      neighboring.push(bestCorrelation);
      continue;
    }

    let correlation = 0;
    let energyA = 0;
    let energyB = 0;
    for (let i = 0; i + lag < centered.length; i += 1) {
      const a = centered[i] ?? 0;
      const b = centered[i + lag] ?? 0;
      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }
    neighboring.push(correlation / Math.sqrt(Math.max(energyA * energyB, 1e-12)));
  }

  const [left, center, right] = neighboring;
  const denominator = (left ?? 0) - 2 * (center ?? 0) + (right ?? 0);
  const offset = Math.abs(denominator) > 1e-9 ? 0.5 * (((left ?? 0) - (right ?? 0)) / denominator) : 0;
  const refinedLag = bestLag + Math.max(-1, Math.min(1, offset));

  return {
    hz: sampleRate / Math.max(refinedLag, 1),
    clarity: clamp01(bestCorrelation),
  };
}

function summarizeFindings(
  dominantBand: SpectrumBandResult,
  missingBands: SpectrumBandResult[],
  excessBands: SpectrumBandResult[],
  noteProfile: ReturnType<typeof getNoteProfile>,
  centroidHz: number,
  flatness: number,
  zcr: number,
  voiceDynamics: VoiceDynamics
) {
  const findings = [
    `Dominant energy sits in the ${dominantBand.label} pitch class (${dominantBand.frequencyLabel ?? `${dominantBand.rangeHz[0]}-${dominantBand.rangeHz[1]} Hz`}).`,
    `${noteProfile.note} is the closest core-note anchor in this model, with ${noteProfile.opposite} read as its opposite pole.`,
    noteProfile.emotionOveractive,
    `Physical correlates in this model include ${noteProfile.physicalCorrelates.join(", ")}.`,
    `${noteProfile.opposite} is treated as the opposite note and may reflect balancing pressure on the same pattern.`,
  ];

  if (missingBands.length > 0) {
    findings.push(
      `Lowest-energy region${missingBands.length > 1 ? "s" : ""}: ${missingBands
        .map((band) => `${band.label} (${band.frequencyLabel ?? `${band.rangeHz[0]}-${band.rangeHz[1]} Hz`})`)
        .join(", ")}.`
    );
  }

  if (excessBands.length > 0) {
    findings.push(
      `High-load region${excessBands.length > 1 ? "s" : ""}: ${excessBands
        .map((band) => `${band.label} (${band.frequencyLabel ?? `${band.rangeHz[0]}-${band.rangeHz[1]} Hz`})`)
        .join(", ")}.`
    );
  }

  findings.push(
    `Voiced signal covered ${Math.round(voiceDynamics.voicedFrameRatio * 100)}% of analyzable frames, with ${voiceDynamics.pauseCount} natural pause${voiceDynamics.pauseCount === 1 ? "" : "s"} between speaking runs.`
  );

  if (voiceDynamics.medianPitchHz) {
    findings.push(
      `Tracked pitch centered near ${voiceDynamics.medianPitchHz} Hz in octave ${voiceDynamics.dominantOctave ?? "?"}, with a ${voiceDynamics.pitchRangeHz} Hz / ${voiceDynamics.pitchRangeSemitones} semitone working range and ${Math.round(voiceDynamics.pitchStability * 100)}% stability.`
    );
  } else {
    findings.push(
      "Pitch tracking did not lock consistently enough to override the broader spectral reading, so note assignment fell back to the spectrum layer."
    );
  }

  findings.push(
    centroidHz < 900
      ? "The spectral centroid trends low, which often reads as darker or less projected tone."
      : centroidHz > 1800
      ? "The spectral centroid trends high, which often reads as brighter or more edge-forward tone."
      : "The spectral centroid sits in a moderate range, suggesting balanced brightness."
  );

  findings.push(
    flatness > 0.25
      ? "Higher spectral flatness suggests more broadband noise or breathiness in the sample."
      : "Lower spectral flatness suggests a more tonal, harmonic sample."
  );

  findings.push(
    zcr > 0.12
      ? "The zero-crossing rate is elevated, which can happen with airy consonants, fricatives, or vocal noise."
      : "The zero-crossing rate stays moderate, indicating the sample is more voiced than noisy."
  );

  noteProfile.progression?.forEach((step) => findings.push(step));

  return findings;
}

function buildSupportPlan(
  missingBands: SpectrumBandResult[],
  excessBands: SpectrumBandResult[],
  dominantBand: SpectrumBandResult,
  noteProfile: ReturnType<typeof getNoteProfile>
) {
  const plan: string[] = [];

  if (missingBands.length > 0) {
    missingBands.forEach((band) => {
      plan.push(`Support the ${band.label.toLowerCase()} band with ${band.practice}`);
    });
  }

  if (excessBands.length > 0) {
    excessBands.forEach((band) => {
      plan.push(
      `Down-regulate the ${band.label.toLowerCase()} band by reducing vocal push, lowering speaking volume, and adding recovery between longer speaking blocks.`
      );
    });
  }

  if (plan.length === 0) {
    plan.push(
      `Your spectrum is relatively even. Maintain it by reinforcing the ${dominantBand.label.toLowerCase()} band with light daily humming, relaxed breath support, and moderate vocal load.`
    );
  }

  plan.push(noteProfile.support);

  plan.push(
    "Retest after several days of practice to see whether the weaker regions gain energy and the high-load regions settle."
  );

  return plan;
}

export async function analyzeVoiceSpectrum(blob: Blob): Promise<VoiceAnalysisResult> {
  const AudioContextCtor =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("This browser does not support Web Audio analysis.");
  }

  const [{ default: Meyda }, arrayBuffer] = await Promise.all([import("meyda"), blob.arrayBuffer()]);

  const audioContext = new AudioContextCtor();

  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const mono = normalizeQuietAudio(averageChannels(decoded));
    const frameSize = 2048;
    const hopSize = 1024;

    if (mono.length < frameSize) {
      throw new Error("Recording is too short for spectrum analysis.");
    }

    Meyda.sampleRate = decoded.sampleRate;
    Meyda.bufferSize = frameSize;

    const spectralNoteTotals = new Map<string, number>(NOTE_ORDER.map((note) => [note, 0]));
    const pitchNoteTotals = new Map<string, number>(NOTE_ORDER.map((note) => [note, 0]));
    let centroidTotal = 0;
    let rmsTotal = 0;
    let flatnessTotal = 0;
    let zcrTotal = 0;
    let frameCount = 0;
    let activeFrameCount = 0;
    let voicedFrameCount = 0;
    let pitchClarityTotal = 0;
    const voicedFlags: boolean[] = [];
    const trackedPitches: number[] = [];
    const trackedMidis: number[] = [];
    const trackedClarities: number[] = [];

    for (let start = 0; start + frameSize <= mono.length; start += hopSize) {
      const frame = mono.slice(start, start + frameSize);
      const features = Meyda.extract(
        ["amplitudeSpectrum", "spectralCentroid", "rms", "spectralFlatness", "zcr"],
        frame
      ) as {
        amplitudeSpectrum?: Float32Array;
        spectralCentroid?: number;
        rms?: number;
        spectralFlatness?: number;
        zcr?: number;
      } | null;

      if (!features?.amplitudeSpectrum) {
        continue;
      }

      frameCount += 1;

      const frameRms = features.rms ?? 0;
      if (frameRms < MIN_VOICED_FRAME_RMS) {
        voicedFlags.push(false);
        continue;
      }

      activeFrameCount += 1;
      const binHz = decoded.sampleRate / frameSize;

      for (let i = 1; i < features.amplitudeSpectrum.length; i += 1) {
        const frequency = i * binHz;
        if (frequency < 85 || frequency > 1200) {
          continue;
        }
        const note = hzToNoteName(frequency);
        spectralNoteTotals.set(note, (spectralNoteTotals.get(note) ?? 0) + (features.amplitudeSpectrum[i] ?? 0));
      }

      const frameFlatness = features.spectralFlatness ?? 0;
      const frameZcr = features.zcr ?? 0;
      const speechLikeFrame =
        (frameFlatness <= MAX_SPEECH_FLATNESS && frameZcr <= MAX_SPEECH_ZCR) ||
        frameRms >= MIN_VOICED_FRAME_RMS * 2.4;

      voicedFlags.push(speechLikeFrame);

      centroidTotal += features.spectralCentroid ?? 0;
      rmsTotal += frameRms;
      flatnessTotal += frameFlatness;
      zcrTotal += frameZcr;

      if (!speechLikeFrame) {
        continue;
      }

      voicedFrameCount += 1;

      const trackedPitch = estimatePitchHz(frame, decoded.sampleRate);
      if (
        trackedPitch.hz &&
        trackedPitch.clarity >= MIN_PITCH_CLARITY &&
        trackedPitch.hz >= MIN_SPEECH_PITCH_HZ &&
        trackedPitch.hz <= MAX_SPEECH_PITCH_HZ
      ) {
        trackedPitches.push(trackedPitch.hz);
        trackedMidis.push(hzToMidi(trackedPitch.hz));
        trackedClarities.push(trackedPitch.clarity);
        pitchClarityTotal += trackedPitch.clarity;
        const note = hzToNoteName(trackedPitch.hz);
        const weight = frameRms * (0.65 + trackedPitch.clarity * 0.35);
        pitchNoteTotals.set(note, (pitchNoteTotals.get(note) ?? 0) + weight);
      }
    }

    if (!frameCount) {
      throw new Error("No analyzable voice frames were captured.");
    }

    if (!activeFrameCount) {
      throw new Error("Recording is too quiet or does not contain enough voiced speech to analyze. Please speak clearly and try again.");
    }

    const useBroadSpectrumFallback =
      voicedFrameCount < MIN_VOICED_FRAMES ||
      voicedFrameCount / frameCount < MIN_VOICED_FRAME_RATIO;

    const frameDurationMs = (hopSize / decoded.sampleRate) * 1000;
    const pauseDurations: number[] = [];
    let seenVoice = false;
    let silentFramesSinceVoice = 0;
    voicedFlags.forEach((isVoiced) => {
      if (isVoiced) {
        if (seenVoice && silentFramesSinceVoice > 0) {
          const pauseDuration = silentFramesSinceVoice * frameDurationMs;
          if (pauseDuration >= MIN_PAUSE_MS) {
            pauseDurations.push(pauseDuration);
          }
        }
        seenVoice = true;
        silentFramesSinceVoice = 0;
      } else if (seenVoice) {
        silentFramesSinceVoice += 1;
      }
    });

    const sortedPitches = [...trackedPitches].sort((a, b) => a - b);
    const sortedMidis = [...trackedMidis].sort((a, b) => a - b);
    const hasTrackedPitch = trackedPitches.length >= MIN_PITCH_FRAMES;
    const medianMidi = hasTrackedPitch ? percentile(sortedMidis, 0.5) : null;
    const focusedPitchNoteTotals = new Map<string, number>(NOTE_ORDER.map((note) => [note, 0]));

    if (hasTrackedPitch && medianMidi !== null) {
      trackedMidis.forEach((midi, index) => {
        const note = midiToNoteName(midi);
        const distanceFromCenter = Math.abs(midi - medianMidi);
        const centerWeight = Math.exp(-((distanceFromCenter / 4) ** 2));
        const clarityWeight = 0.7 + (trackedClarities[index] ?? 0) * 0.3;
        focusedPitchNoteTotals.set(
          note,
          (focusedPitchNoteTotals.get(note) ?? 0) + centerWeight * clarityWeight
        );
      });
    }

    const noteTotals =
      hasTrackedPitch && Array.from(focusedPitchNoteTotals.values()).some((value) => value > 0)
        ? focusedPitchNoteTotals
        : hasTrackedPitch
        ? pitchNoteTotals
        : spectralNoteTotals;
    const maxBandEnergy = Math.max(...Array.from(noteTotals.values()), 1e-6);
    const totalNoteEnergy = Math.max(
      Array.from(noteTotals.values()).reduce((sum, value) => sum + value, 0),
      1e-6
    );
    const noteEnergies = NOTE_ORDER.map((note) =>
      describeNoteEnergy(note, ((noteTotals.get(note) ?? 0) / totalNoteEnergy) * (360 / 360))
    );
    const spectrumBands = BAND_CONFIG.map((config) => {
      const noteState = noteEnergies.find((entry) => entry.note === config.label);
      const relativeEnergy = (noteTotals.get(config.label) ?? 0) / maxBandEnergy;
      const band = describeBand(config, relativeEnergy);

      if (noteState?.status === "overactive") {
        return { ...band, status: "overrepresented" as const, note: config.overactiveNote };
      }

      if (noteState?.status === "underactive") {
        return { ...band, status: "underrepresented" as const, note: config.underactiveNote };
      }

      return { ...band, status: "balanced" as const, note: config.balancedNote };
    });

    const dominantBand = [...spectrumBands].sort((a, b) => b.relativeEnergy - a.relativeEnergy)[0];
    const dominantNote = [...noteEnergies].sort((a, b) => b.relativeEnergy - a.relativeEnergy)[0];
    const missingBands = [...spectrumBands]
      .filter((band) => band.status === "underrepresented")
      .sort((a, b) => a.relativeEnergy - b.relativeEnergy)
      .slice(0, 3);
    const excessBands = [...spectrumBands]
      .filter((band) => band.status === "overrepresented")
      .sort((a, b) => b.relativeEnergy - a.relativeEnergy)
      .slice(0, 2);

    const analysisFrameCount = useBroadSpectrumFallback ? activeFrameCount : voicedFrameCount;
    const spectralCentroidHz = Math.round(centroidTotal / Math.max(analysisFrameCount, 1));
    const medianPitchHz = hasTrackedPitch ? round(percentile(sortedPitches, 0.5), 1) : null;
    const lowPitchHz = hasTrackedPitch ? percentile(sortedPitches, 0.2) : 0;
    const highPitchHz = hasTrackedPitch ? percentile(sortedPitches, 0.8) : 0;
    const pitchRangeHz = hasTrackedPitch ? round(Math.max(0, highPitchHz - lowPitchHz), 1) : 0;
    const lowMidi = hasTrackedPitch ? percentile(sortedMidis, 0.2) : 0;
    const highMidi = hasTrackedPitch ? percentile(sortedMidis, 0.8) : 0;
    const pitchRangeSemitones = hasTrackedPitch ? round(Math.max(0, highMidi - lowMidi), 1) : 0;
    const pitchMean = hasTrackedPitch
      ? trackedPitches.reduce((sum, value) => sum + value, 0) / trackedPitches.length
      : 0;
    const pitchVariance = hasTrackedPitch
      ? trackedPitches.reduce((sum, value) => sum + (value - pitchMean) ** 2, 0) / trackedPitches.length
      : 0;
    const pitchStability = hasTrackedPitch
      ? clamp01(1 - Math.sqrt(pitchVariance) / Math.max(medianPitchHz ?? 1, 1))
      : 0;
    const voiceDynamics: VoiceDynamics = {
      analyzedDurationMs: round(frameCount * frameDurationMs),
      voicedDurationMs: round(analysisFrameCount * frameDurationMs),
      silenceDurationMs: round(Math.max(0, (frameCount - analysisFrameCount) * frameDurationMs)),
      voicedFrameRatio: clamp01(analysisFrameCount / Math.max(frameCount, 1)),
      voicedFrameCount: analysisFrameCount,
      pitchFrameCount: trackedPitches.length,
      pauseCount: pauseDurations.length,
      averagePauseMs: round(
        pauseDurations.length
          ? pauseDurations.reduce((sum, value) => sum + value, 0) / pauseDurations.length
          : 0
      ),
      longestPauseMs: round(Math.max(0, ...pauseDurations)),
      medianPitchHz,
      lowPitchHz: hasTrackedPitch ? round(lowPitchHz, 1) : null,
      highPitchHz: hasTrackedPitch ? round(highPitchHz, 1) : null,
      medianMidi: hasTrackedPitch && medianMidi !== null ? round(medianMidi, 1) : null,
      dominantOctave: hasTrackedPitch && medianMidi !== null ? midiToOctave(medianMidi) : null,
      pitchRangeHz,
      pitchRangeSemitones,
      pitchStability: round(pitchStability, 3),
      pitchClarity: round(
        trackedPitches.length ? pitchClarityTotal / trackedPitches.length : 0,
        3
      ),
      primaryNoteSource: hasTrackedPitch && !useBroadSpectrumFallback ? "tracked-pitch" : "spectral-fallback",
    };
    const coreFrequencyHz = Math.round(
      medianPitchHz ??
        (dominantBand.rangeHz[0] +
          (dominantBand.rangeHz[1] - dominantBand.rangeHz[0]) * dominantBand.relativeEnergy * 0.5)
    );
    const resonanceScore = clamp01(
      (0.45 * (rmsTotal / Math.max(analysisFrameCount, 1)) * 8) +
        (0.35 * (1 - Math.min(flatnessTotal / Math.max(analysisFrameCount, 1), 1))) +
        (0.2 * dominantBand.relativeEnergy)
    );
    const primaryPitchClass =
      hasTrackedPitch && medianMidi !== null ? midiToNoteName(medianMidi) : dominantNote?.note;
    const noteProfile = getSoulScopeNoteProfile(primaryPitchClass ?? hzToNoteName(coreFrequencyHz));

    const findings = summarizeFindings(
      dominantBand,
      missingBands,
      excessBands,
      noteProfile,
      spectralCentroidHz,
      flatnessTotal / Math.max(analysisFrameCount, 1),
      zcrTotal / Math.max(analysisFrameCount, 1),
      voiceDynamics
    );
    const supportPlan = buildSupportPlan(missingBands, excessBands, dominantBand, noteProfile);

    const summary =
      missingBands.length > 0
        ? `${dominantBand.label} leads your sample. Your core-note anchor reads closest to ${noteProfile.note}, with ${noteProfile.opposite} treated as the opposite pole. ${voiceDynamics.medianPitchHz ? `Tracked pitch centered near ${voiceDynamics.medianPitchHz} Hz` : "Pitch lock was limited, so the broader spectrum carried more weight"} and ${voiceDynamics.pauseCount} pause${voiceDynamics.pauseCount === 1 ? "" : "s"} were detected between voiced phrases. Deficient support appears in ${missingBands
            .map((band) => band.label)
            .join(", ")}${excessBands.length ? `, while ${excessBands.map((band) => band.label).join(", ")} show excess load` : ""}.`
        : `${dominantBand.label} leads your sample. Your core-note anchor reads closest to ${noteProfile.note}, with ${noteProfile.opposite} treated as the opposite pole. ${voiceDynamics.medianPitchHz ? `Tracked pitch centered near ${voiceDynamics.medianPitchHz} Hz` : "Pitch lock was limited, so the broader spectrum carried more weight"} and ${voiceDynamics.pauseCount} pause${voiceDynamics.pauseCount === 1 ? "" : "s"} were detected between voiced phrases${excessBands.length ? `, and excess load appears in ${excessBands.map((band) => band.label).join(", ")}` : ""}.`;

    return {
      summary,
      coreFrequencyHz,
      spectralCentroidHz,
      resonanceScore,
      dominantBand: dominantBand.key,
      dominantBandLabel: dominantBand.label,
      noteEnergies,
      spectrumBands,
      missingBands,
      excessBands,
      findings,
      supportPlan,
      noteInterpretation: {
        primaryNote: noteProfile.note,
        oppositeNote: noteProfile.opposite,
        emotionalPattern: noteProfile.emotionOveractive,
        physicalPattern: `Physical correlates in this model include ${noteProfile.physicalCorrelates.join(", ")}.`,
        oppositePattern: `${noteProfile.opposite} is treated as the opposite note and may reflect balancing pressure on the same pattern.`,
        progression: noteProfile.progression,
      },
      methodology:
      "Short-window voice analysis using silence gating, tracked pitch when available, spectral note energy as fallback, pause segmentation between voiced runs, plus centroid, flatness, RMS, and zero-crossing rate.",
      caution:
        "These findings combine measured voice features with SoulScope's proprietary note-meaning interpretation model. They are non-diagnostic and not a medical assessment.",
      voiceDynamics,
    };
  } finally {
    void audioContext.close();
  }
}

export function mergeVoiceAnalyses(results: VoiceAnalysisResult[]): VoiceAnalysisResult {
  if (!results.length) {
    throw new Error("No voice analyses were provided.");
  }

  const allBands = results[0].spectrumBands.map((baseBand, index) => {
    const avgEnergy =
      results.reduce((sum, result) => sum + (result.spectrumBands[index]?.relativeEnergy ?? 0), 0) / results.length;

    return {
      ...baseBand,
      relativeEnergy: avgEnergy,
    };
  });

  const dominantBand = [...allBands].sort((a, b) => b.relativeEnergy - a.relativeEnergy)[0];
  const noteEnergies =
    results[0].noteEnergies?.map((baseNote, index) => {
      const avgScore =
        results.reduce((sum, result) => sum + (result.noteEnergies?.[index]?.score ?? 0), 0) /
        results.length;
      return {
        note: baseNote.note,
        score: Math.round(avgScore * 10) / 10,
        relativeEnergy: avgScore / 30,
        status: avgScore > 34 ? "overactive" : avgScore < 26 ? "underactive" : "balanced",
      } as NoteEnergyResult;
    }) ?? [];
  const coreFrequencyHz = Math.round(results.reduce((sum, result) => sum + result.coreFrequencyHz, 0) / results.length);
  const dominantNote = [...noteEnergies].sort((a, b) => b.relativeEnergy - a.relativeEnergy)[0];
  const analyzedDurationMs = results.reduce(
    (sum, result) => sum + (result.voiceDynamics?.analyzedDurationMs ?? 0),
    0
  );
  const voicedDurationMs = results.reduce(
    (sum, result) => sum + (result.voiceDynamics?.voicedDurationMs ?? 0),
    0
  );
  const silenceDurationMs = results.reduce(
    (sum, result) => sum + (result.voiceDynamics?.silenceDurationMs ?? 0),
    0
  );
  const voicedFrameCount = results.reduce(
    (sum, result) => sum + (result.voiceDynamics?.voicedFrameCount ?? 0),
    0
  );
  const pitchFrameCount = results.reduce(
    (sum, result) => sum + (result.voiceDynamics?.pitchFrameCount ?? 0),
    0
  );
  const pauseCount = results.reduce(
    (sum, result) => sum + (result.voiceDynamics?.pauseCount ?? 0),
    0
  );
  const weightedPitchValue = (
    key:
      | "medianPitchHz"
      | "lowPitchHz"
      | "highPitchHz"
      | "medianMidi"
      | "pitchRangeHz"
      | "pitchRangeSemitones"
      | "pitchStability"
      | "pitchClarity"
  ) => {
    if (!pitchFrameCount) return 0;
    return (
      results.reduce((sum, result) => {
        const weight = result.voiceDynamics?.pitchFrameCount ?? 0;
        const value = result.voiceDynamics?.[key] ?? 0;
        return sum + value * weight;
      }, 0) / pitchFrameCount
    );
  };
  const voiceDynamics: VoiceDynamics = {
    analyzedDurationMs: round(analyzedDurationMs),
    voicedDurationMs: round(voicedDurationMs),
    silenceDurationMs: round(silenceDurationMs),
    voicedFrameRatio: clamp01(voicedDurationMs / Math.max(analyzedDurationMs, 1)),
    voicedFrameCount,
    pitchFrameCount,
    pauseCount,
    averagePauseMs: round(
      pauseCount
        ? results.reduce(
            (sum, result) =>
              sum + (result.voiceDynamics?.averagePauseMs ?? 0) * (result.voiceDynamics?.pauseCount ?? 0),
            0
          ) / pauseCount
        : 0
    ),
    longestPauseMs: round(
      Math.max(0, ...results.map((result) => result.voiceDynamics?.longestPauseMs ?? 0))
    ),
    medianPitchHz: pitchFrameCount ? round(weightedPitchValue("medianPitchHz"), 1) : null,
    lowPitchHz: pitchFrameCount ? round(weightedPitchValue("lowPitchHz"), 1) : null,
    highPitchHz: pitchFrameCount ? round(weightedPitchValue("highPitchHz"), 1) : null,
    medianMidi: pitchFrameCount ? round(weightedPitchValue("medianMidi"), 1) : null,
    dominantOctave: pitchFrameCount ? midiToOctave(weightedPitchValue("medianMidi")) : null,
    pitchRangeHz: round(weightedPitchValue("pitchRangeHz"), 1),
    pitchRangeSemitones: round(weightedPitchValue("pitchRangeSemitones"), 1),
    pitchStability: round(weightedPitchValue("pitchStability"), 3),
    pitchClarity: round(weightedPitchValue("pitchClarity"), 3),
    primaryNoteSource: results.some(
      (result) => result.voiceDynamics?.primaryNoteSource === "tracked-pitch"
    )
      ? "tracked-pitch"
      : "spectral-fallback",
  };
  const primaryPitchClass =
    voiceDynamics.primaryNoteSource === "tracked-pitch" && voiceDynamics.medianMidi !== null
      ? midiToNoteName(voiceDynamics.medianMidi)
      : dominantNote?.note;
  const noteProfile = getSoulScopeNoteProfile(primaryPitchClass ?? hzToNoteName(coreFrequencyHz));
  const mergedMissingBands = allBands
    .filter((band) => noteEnergies.find((entry) => entry.note === band.label)?.status === "underactive")
    .sort((a, b) => a.relativeEnergy - b.relativeEnergy)
    .slice(0, 3)
    .map((band) => ({ ...band, status: "underrepresented" as const }));
  const mergedExcessBands = allBands
    .filter((band) => noteEnergies.find((entry) => entry.note === band.label)?.status === "overactive")
    .sort((a, b) => b.relativeEnergy - a.relativeEnergy)
    .slice(0, 2)
    .map((band) => ({ ...band, status: "overrepresented" as const }));

  return {
    ...results[0],
    summary:
      mergedMissingBands.length > 0
        ? `${dominantBand.label} leads across the three prompts. Your core-note anchor reads closest to ${noteProfile.note}, with ${noteProfile.opposite} treated as the opposite pole. ${voiceDynamics.medianPitchHz ? `Tracked pitch centered near ${voiceDynamics.medianPitchHz} Hz` : "Pitch lock was inconsistent across prompts, so the broader spectrum carried more weight"} and ${voiceDynamics.pauseCount} pause${voiceDynamics.pauseCount === 1 ? "" : "s"} were detected between voiced phrases. Deficient support appears in ${mergedMissingBands
            .map((band) => band.label)
            .join(", ")}${mergedExcessBands.length ? `, while ${mergedExcessBands.map((band) => band.label).join(", ")} show excess load` : ""}.`
        : `${dominantBand.label} leads across the three prompts. Your core-note anchor reads closest to ${noteProfile.note}, with ${noteProfile.opposite} treated as the opposite pole. ${voiceDynamics.medianPitchHz ? `Tracked pitch centered near ${voiceDynamics.medianPitchHz} Hz` : "Pitch lock was inconsistent across prompts, so the broader spectrum carried more weight"} and ${voiceDynamics.pauseCount} pause${voiceDynamics.pauseCount === 1 ? "" : "s"} were detected between voiced phrases${mergedExcessBands.length ? `, and excess load appears in ${mergedExcessBands.map((band) => band.label).join(", ")}` : ""}.`,
    coreFrequencyHz,
    spectralCentroidHz: Math.round(
      results.reduce((sum, result) => sum + result.spectralCentroidHz, 0) / results.length
    ),
    resonanceScore:
      results.reduce((sum, result) => sum + result.resonanceScore, 0) / results.length,
    dominantBand: dominantBand.key,
    dominantBandLabel: dominantBand.label,
    noteEnergies,
    spectrumBands: allBands.map((band) => {
      const noteState = noteEnergies.find((entry) => entry.note === band.label);

      if (noteState?.status === "overactive") {
        return { ...band, status: "overrepresented" as const };
      }

      if (noteState?.status === "underactive") {
        return { ...band, status: "underrepresented" as const };
      }

      return { ...band, status: "balanced" as const };
    }),
    missingBands: mergedMissingBands,
    excessBands: mergedExcessBands,
    findings: Array.from(
      new Set([
        noteProfile.emotionOveractive,
        `Physical correlates in this model include ${noteProfile.physicalCorrelates.join(", ")}.`,
        `${noteProfile.opposite} is treated as the opposite note and may reflect balancing pressure on the same pattern.`,
        ...(noteProfile.progression ?? []),
        ...results.flatMap((result) => result.findings),
      ])
    ),
    supportPlan: Array.from(new Set([noteProfile.support, ...results.flatMap((result) => result.supportPlan)])),
    noteInterpretation: {
      primaryNote: noteProfile.note,
      oppositeNote: noteProfile.opposite,
      emotionalPattern: noteProfile.emotionOveractive,
      physicalPattern: `Physical correlates in this model include ${noteProfile.physicalCorrelates.join(", ")}.`,
      oppositePattern: `${noteProfile.opposite} is treated as the opposite note and may reflect balancing pressure on the same pattern.`,
      progression: noteProfile.progression,
    },
    caution:
      "These findings combine measured voice features with SoulScope's proprietary note-meaning interpretation model. They are non-diagnostic and not a medical assessment.",
    voiceDynamics,
  };
}
