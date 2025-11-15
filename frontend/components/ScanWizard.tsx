"use client";

import { useEffect, useMemo, useState } from "react";
import {
  checkSensors as apiCheckSensors,
  startPhase as apiStartPhase,
  saveVoiceClip as apiSaveVoiceClip,
  fetchCoreFrequencyResult,
  PhaseId,
  SensorApiStatus,
  SensorKey,
  CoreFrequencyApiResponse,
} from "../lib/api";
import IntroScreen from "./screens/IntroScreen";
import SensorScreen from "./screens/SensorScreen";
import BaselineScreen from "./screens/BaselineScreen";
import VoiceScreen from "./screens/VoiceScreen";
import ChallengeScreen from "./screens/ChallengeScreen";
import RecoveryScreen from "./screens/RecoveryScreen";
import ResultsScreen from "./screens/ResultsScreen";
import { PhaseState } from "./screens/TimerBlock";

type ScreenId =
  | "intro"
  | "sensors"
  | "baseline"
  | "voice"
  | "challenge"
  | "recovery"
  | "results";

type StepDefinition = {
  id: ScreenId;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
};

type VoicePrompt = {
  label: string;
  prompt: string;
  duration: string;
  status: "idle" | "recording" | "done";
};

const steps: StepDefinition[] = [
  {
    id: "intro",
    label: "Intro",
    eyebrow: "Screen 1",
    title: "Core Frequency Scan",
    summary:
      "This scan will measure your nervous system, your voice, and your emotional reactivity to estimate your core frequency – the pattern your system defaults to beneath stress and performance.",
  },
  {
    id: "sensors",
    label: "Sensors",
    eyebrow: "Screen 2",
    title: "Sensor check",
    summary:
      "Verify that the heart sensor, EDA pads, and breathing belt (optional) are streaming clean signals before the scan begins.",
  },
  {
    id: "baseline",
    label: "Baseline",
    eyebrow: "Screen 3",
    title: "Baseline phase",
    summary:
      "Sit comfortably, breathe normally, and allow SoulScope to capture your resting nervous system pattern for two minutes.",
  },
  {
    id: "voice",
    label: "Voice",
    eyebrow: "Screen 4",
    title: "Voice phase",
    summary:
      "Capture four short voice clips: neutral identity, current state, power statement, and vulnerability line.",
  },
  {
    id: "challenge",
    label: "Challenge",
    eyebrow: "Screen 5",
    title: "Emotional challenge",
    summary:
      "Guide the seeker through gentle emotional recall to measure how their system responds under stress.",
  },
  {
    id: "recovery",
    label: "Recovery",
    eyebrow: "Screen 6",
    title: "Recovery phase",
    summary:
      "Lead a patterned breath sequence (in 4, out 6) to observe how quickly physiology returns toward baseline.",
  },
  {
    id: "results",
    label: "Results",
    eyebrow: "Screen 7",
    title: "Core frequency report",
    summary:
      "Fuse PhysioTimeSeries, VoiceFeatures, and ReactivityMetrics to reveal the seeker’s dominant band and resonance profile.",
  },
];

const DEFAULT_PHASE_DURATIONS: Record<PhaseId, number> = {
  baseline: 120,
  challenge: 120,
  recovery: 90,
};

const voicePromptsTemplate: Omit<VoicePrompt, "status">[] = [
  {
    label: "Neutral identity",
    prompt: "“Please say your full name slowly and clearly.”",
    duration: "≈ 5s",
  },
  {
    label: "Current state",
    prompt: "“In one sentence, say how you’re feeling right now.”",
    duration: "≈ 8s",
  },
  {
    label: "Power statement",
    prompt: "“Say: ‘I trust myself to handle what comes next.’”",
    duration: "≈ 6s",
  },
  {
    label: "Heart line",
    prompt: "“Say: ‘I deserve to be loved and supported.’”",
    duration: "≈ 6s",
  },
];

function usePhaseTimer(
  state: PhaseState,
  setState: React.Dispatch<React.SetStateAction<PhaseState>>
) {
  useEffect(() => {
    if (!state.started || state.completed) {
      return;
    }
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.started || prev.completed) {
          return prev;
        }
        const nextRemaining = prev.remaining - 1;
        if (nextRemaining <= 0) {
          return { ...prev, remaining: 0, completed: true };
        }
        return { ...prev, remaining: nextRemaining };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setState, state.completed, state.started]);
}

const sensorLabels: Record<SensorKey, string> = {
  heart: "Heart sensor (HR/HRV)",
  eda: "EDA sensor",
  breath: "Breathing belt (optional)",
};

const sensorDescriptions: Record<SensorKey, string> = {
  heart: "Need: clean PPG waveform (10s stable)",
  eda: "Need: micro-siemens drift within ±0.2",
  breath: "Need: belt expansion signal (if used)",
};

const timelineCopy = [
  {
    label: "30s Entry",
    text: "Guide seeker into gentle recall.",
  },
  {
    label: "60–90s Active",
    text: "Hold the challenging scenario in mind.",
  },
  {
    label: "30s Inquiry",
    text: "Ask: “I am safe to feel this.” Notice the response.",
  },
];

export default function ScanWizard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex];

  const [sensorStatus, setSensorStatus] = useState<Record<SensorKey, SensorApiStatus>>({
    heart: "idle",
    eda: "idle",
    breath: "idle",
  });
  const [sensorDetails, setSensorDetails] = useState<Record<SensorKey, string>>({
    heart: "",
    eda: "",
    breath: "",
  });
  const [sensorPreview, setSensorPreview] = useState<{
    heart_rate: number;
    hrv_rmssd: number;
    eda_drift: number;
    breath_rate?: number;
  } | null>(null);
  const [checkingSensors, setCheckingSensors] = useState(false);
  const [sensorsReady, setSensorsReady] = useState(false);

  const [phaseDurations, setPhaseDurations] = useState<Record<PhaseId, number>>({
    ...DEFAULT_PHASE_DURATIONS,
  });
  const [phaseLoading, setPhaseLoading] = useState<Record<PhaseId, boolean>>({
    baseline: false,
    challenge: false,
    recovery: false,
  });

  const [baselinePhase, setBaselinePhase] = useState<PhaseState>({
    started: false,
    remaining: phaseDurations.baseline,
    completed: false,
  });
  const [challengePhase, setChallengePhase] = useState<PhaseState>({
    started: false,
    remaining: phaseDurations.challenge,
    completed: false,
  });
  const [recoveryPhase, setRecoveryPhase] = useState<PhaseState>({
    started: false,
    remaining: phaseDurations.recovery,
    completed: false,
  });

  const [voicePrompts, setVoicePrompts] = useState<VoicePrompt[]>(
    voicePromptsTemplate.map((prompt) => ({ ...prompt, status: "idle" }))
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<CoreFrequencyApiResponse | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  usePhaseTimer(baselinePhase, setBaselinePhase);
  usePhaseTimer(challengePhase, setChallengePhase);
  usePhaseTimer(recoveryPhase, setRecoveryPhase);

  const handleBack = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleSensorCheck = async () => {
    setCheckingSensors(true);
    setSensorsReady(false);
    setErrorMessage(null);
    setSensorStatus({ heart: "checking", eda: "checking", breath: "checking" });
    try {
      const response = await apiCheckSensors();
      setSensorStatus({
        heart: response.sensors.heart.status,
        eda: response.sensors.eda.status,
        breath: response.sensors.breath.status,
      });
      setSensorDetails({
        heart: response.sensors.heart.detail,
        eda: response.sensors.eda.detail,
        breath: response.sensors.breath.detail,
      });
      setSensorPreview(response.preview);
      setSensorsReady(response.ready);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to check sensors";
      setErrorMessage(message);
      setSensorStatus({ heart: "idle", eda: "idle", breath: "idle" });
    } finally {
      setCheckingSensors(false);
    }
  };

  const handleStartPhase = async (phase: PhaseId) => {
    if (phaseLoading[phase]) {
      return;
    }
    setPhaseLoading((prev) => ({ ...prev, [phase]: true }));
    setErrorMessage(null);
    try {
      const response = await apiStartPhase(phase);
      const duration = response.duration_seconds || DEFAULT_PHASE_DURATIONS[phase];
      setPhaseDurations((prev) => ({ ...prev, [phase]: duration }));
      const initialState: PhaseState = {
        started: true,
        remaining: duration,
        completed: false,
      };
      if (phase === "baseline") {
        setBaselinePhase(initialState);
      } else if (phase === "challenge") {
        setChallengePhase(initialState);
      } else if (phase === "recovery") {
        setRecoveryPhase(initialState);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start phase";
      setErrorMessage(message);
    } finally {
      setPhaseLoading((prev) => ({ ...prev, [phase]: false }));
    }
  };

  const handleVoiceCapture = async (index: number) => {
    const prompt = voicePrompts[index];
    setErrorMessage(null);
    setVoicePrompts((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, status: "recording" } : item
      )
    );
    try {
      await apiSaveVoiceClip(prompt.label, prompt.prompt);
      setVoicePrompts((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, status: "done" } : item
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice capture failed";
      setErrorMessage(message);
      setVoicePrompts((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, status: "idle" } : item
        )
      );
    }
  };

  const allVoiceClipsRecorded = useMemo(
    () => voicePrompts.every((prompt) => prompt.status === "done"),
    [voicePrompts]
  );

  const readyForResults =
    baselinePhase.completed &&
    challengePhase.completed &&
    recoveryPhase.completed &&
    sensorsReady &&
    allVoiceClipsRecorded;

  useEffect(() => {
    if (
      currentStep.id === "results" &&
      readyForResults &&
      !resultData &&
      !resultLoading
    ) {
      setResultError(null);
      setResultLoading(true);
      fetchCoreFrequencyResult()
        .then((data) => setResultData(data))
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Failed to load results";
          setResultError(message);
        })
        .finally(() => setResultLoading(false));
    }
  }, [currentStep.id, readyForResults, resultData, resultLoading]);

  const canAdvance = useMemo(() => {
    switch (currentStep.id) {
      case "intro":
        return true;
      case "sensors":
        return sensorsReady;
      case "baseline":
        return baselinePhase.completed;
      case "voice":
        return allVoiceClipsRecorded;
      case "challenge":
        return challengePhase.completed;
      case "recovery":
        return recoveryPhase.completed;
      case "results":
        return false;
      default:
        return false;
    }
  }, [
    allVoiceClipsRecorded,
    baselinePhase.completed,
    challengePhase.completed,
    currentStep.id,
    recoveryPhase.completed,
    sensorsReady,
  ]);

  const renderCurrentContent = () => {
    switch (currentStep.id) {
      case "intro":
        return (
          <IntroScreen
            eyebrow={currentStep.eyebrow}
            title={currentStep.title}
            summary={currentStep.summary}
          />
        );
      case "sensors":
        return (
          <SensorScreen
            sensorStatus={sensorStatus}
            sensorDetails={sensorDetails}
            labels={sensorLabels}
            descriptions={sensorDescriptions}
            preview={sensorPreview}
            checking={checkingSensors}
            onCheck={handleSensorCheck}
          />
        );
      case "baseline":
        return (
          <BaselineScreen
            phase={baselinePhase}
            duration={phaseDurations.baseline}
            isStarting={phaseLoading.baseline}
            onStart={handleStartPhase}
          />
        );
      case "voice":
        return <VoiceScreen prompts={voicePrompts} onCapture={handleVoiceCapture} />;
      case "challenge":
        return (
          <ChallengeScreen
            timeline={timelineCopy}
            phase={challengePhase}
            duration={phaseDurations.challenge}
            isStarting={phaseLoading.challenge}
            onStart={handleStartPhase}
          />
        );
      case "recovery":
        return (
          <RecoveryScreen
            phase={recoveryPhase}
            duration={phaseDurations.recovery}
            isStarting={phaseLoading.recovery}
            onStart={handleStartPhase}
          />
        );
      case "results":
        return (
          <ResultsScreen
            ready={readyForResults}
            loading={resultLoading}
            result={resultData}
            error={resultError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="wizard">
      <header className="wizard__header">
        <div className="wizard__steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`wizard-step ${
                index === currentIndex ? "wizard-step--active" : ""
              } ${index < currentIndex ? "wizard-step--complete" : ""}`}
            >
              <span>{step.label}</span>
            </div>
          ))}
        </div>
        <p>
          {currentIndex + 1} / {steps.length} · {currentStep.title}
        </p>
      </header>
      <div className="wizard-card">
        <div className="wizard-card__body">{renderCurrentContent()}</div>
        <footer className="wizard-card__footer">
          {currentIndex > 0 && currentStep.id !== "results" && (
            <button className="wizard-button wizard-button--ghost" onClick={handleBack}>
              Back
            </button>
          )}
          {currentStep.id !== "results" && (
            <button
              className="wizard-button"
              onClick={handleNext}
              disabled={!canAdvance}
            >
              {currentStep.id === "intro" ? "Begin" : "Continue"}
            </button>
          )}
        </footer>
      </div>
      {errorMessage && <p className="wizard-error">{errorMessage}</p>}
      {currentStep.id !== "results" && (
        <p className="wizard-hint">
          Progress is auto-saved per phase. Continue becomes available once the current phase is complete.
        </p>
      )}
    </section>
  );
}
