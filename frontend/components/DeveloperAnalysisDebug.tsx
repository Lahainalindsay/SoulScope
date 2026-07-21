import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { type VoiceAnalysisResult } from "../lib/voiceSpectrum";

type Props = {
  scanId?: string | null;
  createdAt?: string | null;
  scan: VoiceAnalysisResult;
  report: SoulScopeReport;
};

function show(value: unknown) {
  return value === undefined || value === null || value === "" ? "missing" : value;
}

function topNotes(scan: VoiceAnalysisResult) {
  return (scan.noteEnergies ?? [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => ({
      note: entry.note,
      score: entry.score,
      relativeEnergy: entry.relativeEnergy,
      status: entry.status,
    }));
}

export default function DeveloperAnalysisDebug({ scanId, createdAt, scan, report }: Props) {
  const debugObject = {
    scan: {
      id: show(scanId),
      created_at: show(createdAt),
      captureDurationMs: show(scan.captureDurationMs),
      captureKind: show(scan.captureKind),
    },
    audio_debug: {
      blobSize: show(scan.analysisDebug?.blobSize),
      blobType: show(scan.analysisDebug?.blobType),
      decodedDurationMs: show(scan.analysisDebug?.decodedDurationMs),
      decodedSampleRate: show(scan.analysisDebug?.decodedSampleRate),
      frameCount: show(scan.analysisDebug?.frameCount),
      activeFrameCount: show(scan.analysisDebug?.activeFrameCount),
      voicedFrameCount: show(scan.analysisDebug?.voicedFrameCount),
      trackedPitchCount: show(scan.analysisDebug?.trackedPitchCount),
      usedBroadSpectrumFallback: show(scan.analysisDebug?.usedBroadSpectrumFallback),
      issue: show(scan.analysisDebug?.rejectionReason),
    },
    main_analysis: {
      dominantBandLabel: show(scan.dominantBandLabel),
      coreFrequencyHz: show(scan.coreFrequencyHz),
      spectralCentroidHz: show(scan.spectralCentroidHz),
      resonanceScore: show(scan.resonanceScore),
      primaryNote: show(scan.noteInterpretation?.primaryNote),
      primaryPattern: report.primaryPattern.name,
      patternSignature: report.dynamicPattern.patternSignature,
      patternFamily: report.dynamicPattern.family,
      patternConfidence: report.primaryPattern.confidence,
    },
    evidence_ledger: report.dynamicPattern.evidenceLedger,
    state_vector: report.dynamicPattern.stateVector,
    dimension_ledger: report.dynamicPattern.dimensions,
    decision_ledger: report.dynamicPattern.decisionLedger,
    baseline: report.dynamicPattern.baseline,
    top_note_energies: topNotes(scan),
    domain_results: report.domainResults.map((domain) => ({
      title: domain.title,
      score: domain.score,
      activityLevel: domain.activityLevel,
      functionalState: domain.functionalState,
    })),
    voice_dynamics: {
      analyzedDurationMs: show(scan.voiceDynamics?.analyzedDurationMs),
      voicedDurationMs: show(scan.voiceDynamics?.voicedDurationMs),
      activeFrameRatio: show(scan.voiceDynamics?.activeFrameRatio),
      voicedFrameRatio: show(scan.voiceDynamics?.voicedFrameRatio),
      pauseCount: show(scan.voiceDynamics?.pauseCount),
      medianPitchHz: show(scan.voiceDynamics?.medianPitchHz),
      pitchRangeHz: show(scan.voiceDynamics?.pitchRangeHz),
      pitchRangeSemitones: show(scan.voiceDynamics?.pitchRangeSemitones),
      pitchStability: show(scan.voiceDynamics?.pitchStability),
      pitchClarity: show(scan.voiceDynamics?.pitchClarity),
      harmonicToNoiseRatioDb: show(scan.voiceDynamics?.harmonicToNoiseRatioDb),
      spectralFlatness: show(scan.voiceDynamics?.spectralFlatness),
      speechRateProxyPerMin: show(scan.voiceDynamics?.speechRateProxyPerMin),
      captureQuality: show(scan.voiceDynamics?.captureQuality),
      primaryNoteSource: show(scan.voiceDynamics?.primaryNoteSource),
    },
    camera: {
      blinkRatePerMin: show(scan.protocolNotes?.camera?.blinkRatePerMin),
      facialTension: show(scan.protocolNotes?.camera?.facialTension),
      eyeOpenness: show(scan.protocolNotes?.camera?.eyeOpenness),
      eyeDilationProxy: show(scan.protocolNotes?.camera?.eyeDilationProxy),
      trackingConfidence: show(scan.protocolNotes?.camera?.trackingConfidence),
      framesAnalyzed: show(scan.protocolNotes?.camera?.framesAnalyzed),
    },
    prompt_analyses: scan.analysisDebug?.promptAnalyses ?? [],
  };

  if (typeof window !== "undefined") {
    console.log("SoulScope analysis debug", debugObject);
  }

  return (
    <details style={{ marginTop: 24, border: "1px solid rgba(103,232,249,.18)", borderRadius: 24, padding: 18, background: "rgba(2,6,23,.52)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Signal Details</summary>
      <p style={{ color: "rgba(226,232,240,.8)" }}>Technical capture values used to support this scan. This section is optional.</p>
      <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", fontSize: 12, lineHeight: 1.45, color: "#dbeafe" }}>{JSON.stringify(debugObject, null, 2)}</pre>
    </details>
  );
}
