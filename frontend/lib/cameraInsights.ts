type CameraMetrics = {
  blinkRatePerMin: number;
  facialTension: number;
  eyeDilationProxy: number;
  eyeOpenness: number;
  trackingConfidence: number;
  framesAnalyzed: number;
};

type CameraPrompt = {
  id: string;
  title: string;
  rangeLabel?: string;
  camera?: CameraMetrics;
};

type CameraRangeSummary = {
  key: string;
  label: string;
  blinkRatePerMin: number;
  facialTension: number;
  eyeDilationProxy: number;
  eyeOpenness: number;
  trackingConfidence: number;
  framesAnalyzed: number;
};

export type CameraInsights = {
  headline: string;
  summary: string;
  findings: string[];
  strongestPrompt: CameraPrompt | null;
  lowestOpennessPrompt: CameraPrompt | null;
  rangeSummaries: CameraRangeSummary[];
  promptMetrics: Array<CameraPrompt & { camera: CameraMetrics }>;
};

function averageMetrics(metrics: CameraMetrics[]): CameraMetrics {
  const totalFrames = metrics.reduce((sum, metric) => sum + Math.max(1, metric.framesAnalyzed), 0);
  const weightedAverage = (selector: (metric: CameraMetrics) => number) =>
    metrics.reduce((sum, metric) => sum + selector(metric) * Math.max(1, metric.framesAnalyzed), 0) /
    Math.max(1, totalFrames);

  return {
    blinkRatePerMin: Number(weightedAverage((metric) => metric.blinkRatePerMin).toFixed(1)),
    facialTension: Number(weightedAverage((metric) => metric.facialTension).toFixed(3)),
    eyeDilationProxy: Number(weightedAverage((metric) => metric.eyeDilationProxy).toFixed(3)),
    eyeOpenness: Number(weightedAverage((metric) => metric.eyeOpenness).toFixed(3)),
    trackingConfidence: Number(weightedAverage((metric) => metric.trackingConfidence).toFixed(3)),
    framesAnalyzed: totalFrames,
  };
}

function formatShift(delta: number, suffix = "%") {
  const absolute = Math.round(Math.abs(delta));
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  if (direction === "flat") {
    return `held flat at ${absolute}${suffix}`;
  }
  return `${direction} ${absolute}${suffix}`;
}

function getHeadline(camera: CameraMetrics) {
  if (camera.facialTension >= 0.58 || (camera.eyeOpenness <= 0.42 && camera.blinkRatePerMin <= 10)) {
    return "Guarded activation";
  }
  if (camera.blinkRatePerMin >= 24 || camera.facialTension >= 0.48) {
    return "Hyper-alert engagement";
  }
  if (camera.blinkRatePerMin <= 8 && camera.eyeOpenness <= 0.55) {
    return "Constricted holding";
  }
  if (camera.facialTension <= 0.32 && camera.blinkRatePerMin >= 10 && camera.blinkRatePerMin <= 20) {
    return "Regulated presence";
  }
  return "Mixed camera read";
}

function getSummary(camera: CameraMetrics) {
  const tension = Math.round(camera.facialTension * 100);
  const openness = Math.round(camera.eyeOpenness * 100);
  const dilation = Math.round(camera.eyeDilationProxy * 100);

  if (camera.facialTension >= 0.58) {
    return `The face read stayed tight overall, with tension around ${tension}% and a guarded eye pattern.`;
  }
  if (camera.blinkRatePerMin >= 24) {
    return `The camera read skewed alert, with blink rate near ${camera.blinkRatePerMin}/min and tension around ${tension}%.`;
  }
  if (camera.facialTension <= 0.32 && camera.eyeOpenness >= 0.6) {
    return `The face read looked relatively settled, with lower tension (${tension}%), open eyes (${openness}%), and moderate blink behavior.`;
  }
  return `The face read was usable but mixed: blink rate ${camera.blinkRatePerMin}/min, tension ${tension}%, eye openness ${openness}%, eye-dilation proxy ${dilation}%.`;
}

export function buildCameraInsights(
  overallCamera: CameraMetrics | undefined,
  cameraBaseline: CameraMetrics | undefined,
  prompts: CameraPrompt[] | undefined
): CameraInsights | null {
  if (!overallCamera || !prompts?.length) {
    return null;
  }

  const promptMetrics = prompts.filter(
    (prompt): prompt is CameraPrompt & { camera: CameraMetrics } => Boolean(prompt.camera)
  );

  if (!promptMetrics.length) {
    return null;
  }

  const strongestPrompt = [...promptMetrics].sort(
    (a, b) => (b.camera.facialTension + b.camera.blinkRatePerMin / 60) - (a.camera.facialTension + a.camera.blinkRatePerMin / 60)
  )[0] ?? null;
  const lowestOpennessPrompt = [...promptMetrics].sort(
    (a, b) => a.camera.eyeOpenness - b.camera.eyeOpenness
  )[0] ?? null;

  const rangeGroups = [
    { key: "opening", label: "Opening", indexes: [0, 1] },
    { key: "emotional", label: "Emotional", indexes: [2, 3, 4] },
    { key: "future", label: "Future", indexes: [5] },
  ];

  const rangeSummaries = rangeGroups
    .map((group) => {
      const rangeMetrics = group.indexes
        .map((index) => prompts[index]?.camera)
        .filter((metric): metric is CameraMetrics => Boolean(metric));

      if (!rangeMetrics.length) {
        return null;
      }

      return {
        key: group.key,
        label: group.label,
        ...averageMetrics(rangeMetrics),
      };
    })
    .filter((group): group is CameraRangeSummary => Boolean(group));

  const opening = rangeSummaries.find((group) => group.key === "opening");
  const emotional = rangeSummaries.find((group) => group.key === "emotional");
  const future = rangeSummaries.find((group) => group.key === "future");

  const findings: string[] = [];

  if (cameraBaseline) {
    const blinkDelta = overallCamera.blinkRatePerMin - cameraBaseline.blinkRatePerMin;
    const tensionDelta = (overallCamera.facialTension - cameraBaseline.facialTension) * 100;
    findings.push(
      `Relative to your opening camera baseline, blink rate moved ${formatShift(blinkDelta, "/min")} and facial tension moved ${formatShift(tensionDelta)}.`
    );
  }

  if (opening && emotional) {
    const blinkDelta = emotional.blinkRatePerMin - opening.blinkRatePerMin;
    const tensionDelta = (emotional.facialTension - opening.facialTension) * 100;
    findings.push(
      `From opening to emotional prompts, blink rate ${formatShift(blinkDelta, "/min")} and facial tension moved ${formatShift(tensionDelta)}.`
    );
  }

  if (emotional && future) {
    const opennessDelta = (future.eyeOpenness - emotional.eyeOpenness) * 100;
    findings.push(
      `By the future-oriented prompt, eye openness moved ${formatShift(opennessDelta)} relative to the emotional section.`
    );
  }

  if (strongestPrompt) {
    findings.push(
      `${strongestPrompt.title} showed the highest overall activation, with blink rate ${strongestPrompt.camera.blinkRatePerMin}/min and tension ${Math.round(strongestPrompt.camera.facialTension * 100)}%.`
    );
  }

  if (lowestOpennessPrompt) {
    findings.push(
      `${lowestOpennessPrompt.title} had the lowest eye openness at ${Math.round(lowestOpennessPrompt.camera.eyeOpenness * 100)}%, which can reflect narrowing or visual holding under load.`
    );
  }

  if (overallCamera.trackingConfidence < 0.45) {
    findings.push("Camera tracking confidence was limited, so treat the visual read as directional rather than precise.");
  }

  return {
    headline:
      overallCamera.trackingConfidence < 0.45 ? "Low-confidence camera read" : getHeadline(overallCamera),
    summary:
      overallCamera.trackingConfidence < 0.45
        ? `The camera captured a partial read, but tracking confidence stayed low. Use this section as a rough directional signal rather than a precise interpretation.`
        : getSummary(overallCamera),
    findings,
    strongestPrompt,
    lowestOpennessPrompt,
    rangeSummaries,
    promptMetrics,
  };
}
