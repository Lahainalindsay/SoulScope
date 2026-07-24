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
  captureKind: "sustained_vowel" | "guided_speech";
  status: "idle" | "recording" | "done";
};

const steps: StepDefinition[] = [
  {
    id: "intro",
    label: "Prepare",
    eyebrow: "Welcome to SoulScope",
    title: "A clearer view begins with one moment.",
    summary:
      "You will respond to a short series of prompts while SoulScope listens for patterns in your voice and expression.",
  },
  {
    id: "sensors",
    label: "Permission",
    eyebrow: "You remain in control",
    title: "Microphone and optional camera.",
    summary:
      "Microphone access records your responses. Camera access is optional where supported and may add broad expression context.",
  },
  {
    id: "baseline",
    label: "Settle",
    eyebrow: "Prepare",
    title: "Take a moment to settle.",
    summary:
      "Sit comfortably and let your breathing return to its natural rhythm before the prompts begin.",
  },
  {
    id: "voice",
    label: "Speak",
    eyebrow: "Resonance Scan",
    title: "Speak naturally.",
    summary:
      "Begin with a comfortable voice sample, then answer the guided prompts in your own words.",
  },
  {
    id: "challenge",
    label: "Reflect",
    eyebrow: "Another point of comparison",
    title: "Bring one recent moment to mind.",
    summary:
      "Choose something meaningful but manageable. You can skip this part when supported.",
  },
  {
    id: "recovery",
    label: "Return",
    eyebrow: "Return to the present",
    title: "Let your attention return to the room.",
    summary:
      "This gives SoulScope a final comparison point before creating your Reflection.",
  },
  {
    id: "results",
    label: "Complete",
    eyebrow: "Scan complete",
    title: "Your Reflection is ready.",
    summary:
      "Receive one Resonance Signature, one Current Pattern, and one clear Reflection.",
  },
];

const DEFAULT_PHASE_DURATIONS: Record<PhaseId, number> = {
  baseline: 120,
  challenge: 120,
  recovery: 90,
};

const voicePromptsTemplate: Omit<VoicePrompt, "status">[] = [
  {
    label: "About you",
    prompt: "“Please tell me about yourself, whatever comes to mind.”",
    duration: "30s",
    captureKind: "guided_speech",
  },
  {
    label: "What is weighing on you",
    prompt: "“Tell me about something that has been troubling or weighing on you.”",
    duration: "30s",
    captureKind: "guided_speech",
  },
  {
    label: "Hope and direction",
    prompt: "“Tell me about something you hope for in the future, even if it still feels far away.”",
    duration: "30s",
    captureKind: "guided_speech",
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
  heart: "Microphone",
  eda: "Camera — optional",
  breath: "Additional context — optional",
};

const sensorDescriptions: Record<SensorKey, string> = {
  heart: "Needed to record your responses.",
  eda: "May add broad facial movement context when supported.",
  breath: "Only included when the current experience supports it.",
};

const timelineCopy = [
  {
    label: "Arrive",
    text: "Choose a recent moment that feels meaningful and manageable.",
  },
  {
    label: "Reflect",
    text: "Describe what stood out without forcing the answer.",
  },
  {
    label: "Return",
    text: "Let your attention come back to the room.",
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
