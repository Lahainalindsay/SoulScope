"use client";

import { useEffect, useRef, useState } from "react";

type Landmark = {
  x: number;
  y: number;
  z?: number;
};

type BlendshapeCategory = {
  categoryName: string;
  score: number;
};

type FaceLandmarkerResult = {
  faceLandmarks?: Landmark[][];
  faceBlendshapes?: {
    categories: BlendshapeCategory[];
  }[];
};

type FaceLandmarkerInstance = {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): FaceLandmarkerResult;
  close(): void;
};

export type FaceReading = {
  blinkRatePerMin: number;
  facialTension: number;
  eyeDilationProxy: number;
  eyeOpenness: number;
  trackingConfidence: number;
  framesAnalyzed: number;
};

type FaceReaderProps = {
  active: boolean;
  tracking: boolean;
  calibrating?: boolean;
  onMetricsChange?: (reading: FaceReading) => void;
  onSummaryChange?: (reading: FaceReading | null) => void;
  onCalibrationComplete?: (reading: FaceReading | null) => void;
};

const EYE_BOUNDS_LEFT = [33, 133, 159, 145, 468, 469, 470, 471, 472];
const EYE_BOUNDS_RIGHT = [362, 263, 386, 374, 473, 474, 475, 476, 477];
const MEDIAPIPE_WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const FACE_MODEL_ASSET =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getBlendshapeScore(
  categories: BlendshapeCategory[] | undefined,
  categoryName: string
) {
  return categories?.find((item) => item.categoryName === categoryName)?.score ?? 0;
}

function getEyeBounds(
  landmarks: Landmark[],
  indexes: number[],
  width: number,
  height: number
) {
  const points = indexes
    .map((index) => landmarks[index])
    .filter((point): point is Landmark => Boolean(point));

  if (!points.length) {
    return null;
  }

  const xs = points.map((point) => point.x * width);
  const ys = points.map((point) => point.y * height);

  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(width, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(height, Math.ceil(Math.max(...ys)));

  if (maxX - minX < 6 || maxY - minY < 6) {
    return null;
  }

  return { minX, maxX, minY, maxY };
}

function measureEyeDarkness(
  context: CanvasRenderingContext2D,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const centerWidth = Math.max(4, Math.floor(width * 0.45));
  const centerHeight = Math.max(4, Math.floor(height * 0.55));
  const offsetX = bounds.minX + Math.floor((width - centerWidth) / 2);
  const offsetY = bounds.minY + Math.floor((height - centerHeight) / 2);
  const image = context.getImageData(offsetX, offsetY, centerWidth, centerHeight);

  let luminanceSum = 0;
  for (let index = 0; index < image.data.length; index += 4) {
    const r = image.data[index] ?? 0;
    const g = image.data[index + 1] ?? 0;
    const b = image.data[index + 2] ?? 0;
    luminanceSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const pixelCount = Math.max(1, image.data.length / 4);
  const avgLuminance = luminanceSum / pixelCount;

  return clamp01(1 - avgLuminance / 255);
}

export const FaceReader = ({
  active,
  tracking,
  calibrating = false,
  onMetricsChange,
  onSummaryChange,
  onCalibrationComplete,
}: FaceReaderProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<FaceLandmarkerInstance | null>(null);
  const metricsRef = useRef<FaceReading | null>(null);
  const aggregateRef = useRef<{
    frames: number;
    blinkCount: number;
    blinkActive: boolean;
    startAt: number | null;
    tension: number[];
    dilation: number[];
    openness: number[];
    confidence: number[];
  }>({
    frames: 0,
    blinkCount: 0,
    blinkActive: false,
    startAt: null,
    tension: [],
    dilation: [],
    openness: [],
    confidence: [],
  });
  const calibrationAggregateRef = useRef<{
    frames: number;
    blinkCount: number;
    blinkActive: boolean;
    startAt: number | null;
    tension: number[];
    dilation: number[];
    openness: number[];
    confidence: number[];
  }>({
    frames: 0,
    blinkCount: 0,
    blinkActive: false,
    startAt: null,
    tension: [],
    dilation: [],
    openness: [],
    confidence: [],
  });
  const smoothRef = useRef<FaceReading | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceReading | null>(null);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  function finalizeAggregate(
    aggregate: {
      frames: number;
      blinkCount: number;
      startAt: number | null;
      tension: number[];
      dilation: number[];
      openness: number[];
      confidence: number[];
    }
  ) {
    if (aggregate.frames <= 0 || !aggregate.startAt) {
      return null;
    }
    const durationMs = Math.max(1, performance.now() - aggregate.startAt);
    return {
      blinkRatePerMin: Number(((aggregate.blinkCount / durationMs) * 60000).toFixed(1)),
      facialTension: Number(mean(aggregate.tension).toFixed(3)),
      eyeDilationProxy: Number(mean(aggregate.dilation).toFixed(3)),
      eyeOpenness: Number(mean(aggregate.openness).toFixed(3)),
      trackingConfidence: Number(mean(aggregate.confidence).toFixed(3)),
      framesAnalyzed: aggregate.frames,
    } satisfies FaceReading;
  }

  useEffect(() => {
    if (!tracking) {
      onSummaryChange?.(finalizeAggregate(aggregateRef.current));

      aggregateRef.current = {
        frames: 0,
        blinkCount: 0,
        blinkActive: false,
        startAt: null,
        tension: [],
        dilation: [],
        openness: [],
        confidence: [],
      };
      return;
    }

    onSummaryChange?.(null);
    aggregateRef.current.startAt = performance.now();
  }, [onSummaryChange, tracking]);

  useEffect(() => {
    if (!calibrating) {
      onCalibrationComplete?.(finalizeAggregate(calibrationAggregateRef.current));
      calibrationAggregateRef.current = {
        frames: 0,
        blinkCount: 0,
        blinkActive: false,
        startAt: null,
        tension: [],
        dilation: [],
        openness: [],
        confidence: [],
      };
      return;
    }

    calibrationAggregateRef.current.startAt = performance.now();
    onCalibrationComplete?.(null);
  }, [calibrating, onCalibrationComplete]);

  useEffect(() => {
    const stop = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (modelRef.current) {
        modelRef.current.close();
        modelRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (!active) {
      stop();
      setMetrics(null);
      setStatus("idle");
      setError(null);
      return stop;
    }

    let cancelled = false;

    const start = async () => {
      try {
        setStatus("loading");
        setError(null);

        const [{ FaceLandmarker, FilesetResolver }, stream] = await Promise.all([
          import("@mediapipe/tasks-vision"),
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          }),
        ]);

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_ROOT);
        if (cancelled) {
          return;
        }

        modelRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_MODEL_ASSET,
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        const video = videoRef.current;
        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play();

        setStatus("ready");

        const render = () => {
          if (cancelled || !videoRef.current || !canvasRef.current || !modelRef.current) {
            return;
          }

          const videoEl = videoRef.current;
          if (videoEl.readyState < 2 || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
            frameRef.current = requestAnimationFrame(render);
            return;
          }

          const result = modelRef.current.detectForVideo(videoEl, performance.now());
          const landmarks = result.faceLandmarks?.[0];
          const blendshapes = result.faceBlendshapes?.[0]?.categories;

          if (landmarks?.length) {
            const blinkLeft = getBlendshapeScore(blendshapes, "eyeBlinkLeft");
            const blinkRight = getBlendshapeScore(blendshapes, "eyeBlinkRight");
            const eyeSquintLeft = getBlendshapeScore(blendshapes, "eyeSquintLeft");
            const eyeSquintRight = getBlendshapeScore(blendshapes, "eyeSquintRight");
            const browLeft = getBlendshapeScore(blendshapes, "browDownLeft");
            const browRight = getBlendshapeScore(blendshapes, "browDownRight");
            const mouthPressLeft = getBlendshapeScore(blendshapes, "mouthPressLeft");
            const mouthPressRight = getBlendshapeScore(blendshapes, "mouthPressRight");
            const jawOpen = getBlendshapeScore(blendshapes, "jawOpen");

            const blinkScore = (blinkLeft + blinkRight) / 2;
            const openness = clamp01(1 - blinkScore);
            const tension = clamp01(
              eyeSquintLeft * 0.2 +
                eyeSquintRight * 0.2 +
                browLeft * 0.2 +
                browRight * 0.2 +
                mouthPressLeft * 0.1 +
                mouthPressRight * 0.1 +
                jawOpen * 0.1
            );

            const canvas = canvasRef.current;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            let eyeDilationProxy = 0;

            if (context) {
              canvas.width = videoEl.videoWidth;
              canvas.height = videoEl.videoHeight;
              context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

              const leftBounds = getEyeBounds(
                landmarks,
                EYE_BOUNDS_LEFT,
                canvas.width,
                canvas.height
              );
              const rightBounds = getEyeBounds(
                landmarks,
                EYE_BOUNDS_RIGHT,
                canvas.width,
                canvas.height
              );
              const samples = [leftBounds, rightBounds]
                .filter(
                  (
                    bounds
                  ): bounds is { minX: number; maxX: number; minY: number; maxY: number } =>
                    Boolean(bounds)
                )
                .map((bounds) => measureEyeDarkness(context, bounds));

              eyeDilationProxy = Number(mean(samples).toFixed(3));
            }

            const rawConfidence = clamp01(
              1 - (Math.abs(blinkLeft - blinkRight) + Math.abs(eyeSquintLeft - eyeSquintRight)) * 0.5
            );
            const previousSmooth = smoothRef.current;
            const alpha = 0.22;
            const smoothedMetrics = {
              blinkRatePerMin:
                previousSmooth === null
                  ? blinkScore * 30
                  : previousSmooth.blinkRatePerMin * (1 - alpha) + blinkScore * 30 * alpha,
              facialTension:
                previousSmooth === null
                  ? tension
                  : previousSmooth.facialTension * (1 - alpha) + tension * alpha,
              eyeDilationProxy:
                previousSmooth === null
                  ? eyeDilationProxy
                  : previousSmooth.eyeDilationProxy * (1 - alpha) + eyeDilationProxy * alpha,
              eyeOpenness:
                previousSmooth === null
                  ? openness
                  : previousSmooth.eyeOpenness * (1 - alpha) + openness * alpha,
              trackingConfidence:
                previousSmooth === null
                  ? rawConfidence
                  : previousSmooth.trackingConfidence * (1 - alpha) + rawConfidence * alpha,
              framesAnalyzed: previousSmooth?.framesAnalyzed ?? 0,
            } satisfies FaceReading;

            const jumpTooLarge =
              previousSmooth !== null &&
              (Math.abs(smoothedMetrics.facialTension - previousSmooth.facialTension) > 0.25 ||
                Math.abs(smoothedMetrics.eyeOpenness - previousSmooth.eyeOpenness) > 0.3 ||
                Math.abs(smoothedMetrics.eyeDilationProxy - previousSmooth.eyeDilationProxy) > 0.3);

            const usableFrame = rawConfidence >= 0.38 && !jumpTooLarge;
            smoothRef.current = smoothedMetrics;

            const aggregate = aggregateRef.current;
            if (tracking && usableFrame) {
              aggregate.frames += 1;
              aggregate.tension.push(tension);
              aggregate.dilation.push(eyeDilationProxy);
              aggregate.openness.push(openness);
              aggregate.confidence.push(rawConfidence);

              if (blinkScore > 0.52 && !aggregate.blinkActive) {
                aggregate.blinkCount += 1;
                aggregate.blinkActive = true;
              } else if (blinkScore < 0.28) {
                aggregate.blinkActive = false;
              }
            }

            const calibrationAggregate = calibrationAggregateRef.current;
            if (calibrating && usableFrame) {
              calibrationAggregate.frames += 1;
              calibrationAggregate.tension.push(tension);
              calibrationAggregate.dilation.push(eyeDilationProxy);
              calibrationAggregate.openness.push(openness);
              calibrationAggregate.confidence.push(rawConfidence);

              if (blinkScore > 0.52 && !calibrationAggregate.blinkActive) {
                calibrationAggregate.blinkCount += 1;
                calibrationAggregate.blinkActive = true;
              } else if (blinkScore < 0.28) {
                calibrationAggregate.blinkActive = false;
              }
            }

            const elapsedMs = Math.max(
              1,
              tracking && aggregate.startAt ? performance.now() - aggregate.startAt : 1
            );
            const nextMetrics: FaceReading = {
              blinkRatePerMin:
                tracking && aggregate.frames > 0
                  ? Number(((aggregate.blinkCount / elapsedMs) * 60000).toFixed(1))
                  : metricsRef.current?.blinkRatePerMin ?? Number(smoothedMetrics.blinkRatePerMin.toFixed(1)),
              facialTension: Number(smoothedMetrics.facialTension.toFixed(3)),
              eyeDilationProxy: Number(smoothedMetrics.eyeDilationProxy.toFixed(3)),
              eyeOpenness: Number(smoothedMetrics.eyeOpenness.toFixed(3)),
              trackingConfidence: Number(smoothedMetrics.trackingConfidence.toFixed(3)),
              framesAnalyzed: tracking ? aggregate.frames : metricsRef.current?.framesAnalyzed ?? 0,
            };

            setMetrics(nextMetrics);
            onMetricsChange?.(nextMetrics);
          }

          frameRef.current = requestAnimationFrame(render);
        };

        frameRef.current = requestAnimationFrame(render);
      } catch (cause) {
        console.error("FaceReader error", cause);
        setStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to access the camera for face tracking."
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, calibrating, onMetricsChange, tracking]);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(2, 6, 23, 0.68)",
          aspectRatio: "4 / 3",
        }}
      >
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#dbeafe",
          }}
        >
          {status === "loading" ? "Camera loading" : tracking ? "Tracking live" : "Camera ready"}
        </div>
      </div>
      {error ? (
        <p style={{ marginTop: 10, fontSize: 13, color: "#fda4af" }}>{error}</p>
      ) : null}
    </div>
  );
};

export default FaceReader;
