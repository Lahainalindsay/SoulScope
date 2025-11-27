import Head from "next/head";
import { useCallback, useRef, useState } from "react";
import Recorder, { RecorderHandle } from "../components/Recorder";
import Navbar from "../components/Navbar";
import { FaceReader, FaceReading } from "../components/FaceReader";
import { supabase } from "../lib/supabaseClient";

const CHAKRA_ORDER: { key: string; label: string; color: string }[] = [
  { key: "root", label: "Root", color: "#B71C1C" },
  { key: "sacral", label: "Sacral", color: "#E65100" },
  { key: "solar_plexus", label: "Solar Plexus", color: "#FBC02D" },
  { key: "heart", label: "Heart", color: "#2E7D32" },
  { key: "throat", label: "Throat", color: "#1565C0" },
  { key: "third_eye", label: "Third Eye", color: "#4527A0" },
  { key: "crown", label: "Crown", color: "#673AB7" },
];

interface ScanResult {
  chakraScores: Record<string, number>;
  summary: string;
  face?: {
    emotion: string;
    focusScore: number;
  };
  dominant?: string;
}

export default function ScanPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [faceReading, setFaceReading] = useState<FaceReading | null>(null);
  const cameraActive = isRecording || isAnalyzing;
  const recorderRef = useRef<RecorderHandle | null>(null);

  const handleAudioComplete = async (blob: Blob) => {
    console.log("🎧 handleAudioComplete called, size:", blob.size);

    try {
      setScanError(null);
      setScanResult(null);
      setIsAnalyzing(true);

      const { data, error: fnError } = await supabase.functions.invoke<{
        chakraScores?: Record<string, number>;
        summary?: string;
      }>("analyze-voice", {
        body: blob,
      });

      console.log("analyze-voice response:", { data, fnError });

      if (fnError) {
        console.error("analyze-voice error", fnError);
        setScanError(`Voice analysis failed: ${fnError.message ?? "Unknown error"}`);
        return;
      }

      const combined: ScanResult = {
        chakraScores: data?.chakraScores ?? {},
        summary: data?.summary ?? "Scan complete.",
        face: faceReading ?? undefined,
      };

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.error("No user for scan insert", userError);
        setScanError("You must be signed in to save your scan.");
        setScanResult(combined);
        return;
      }

      const user = userData.user;

      const { error: insertError } = await supabase.from("scans").insert({
        user_id: user.id,
        result: combined,
      });

      if (insertError) {
        console.error("Failed to insert scan row", insertError);
        setScanError("Scan analyzed but could not be saved to history. (DB policy error)");
      } else {
        console.log("✅ Scan saved to public.scans");
      }

      setScanResult(combined);
    } catch (err) {
      console.error("Unexpected scan error", err);
      setScanError("Unexpected error while analyzing your scan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFaceResult = useCallback((reading: FaceReading) => {
    console.log("📷 face reading:", reading);
    setFaceReading(reading);
  }, []);

  const handleStart = () => {
    setFaceReading(null);
    recorderRef.current?.start();
  };

  return (
    <>
      <Head>
        <title>SoulScope Scan – Speak Your Frequency</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Navbar />
      <div
        style={{
          minHeight: "100vh",
          padding: "32px 16px",
          background: "radial-gradient(circle at top left, #312e81, #020617 55%)",
          color: "#e5e7eb",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 1040 }}>
          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: 0,
                marginBottom: 8,
                letterSpacing: "0.03em",
              }}
            >
              Core Tone Scan
            </h1>
            <p
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: 14,
                color: "#cbd5f5",
              }}
            >
              Tap start, look into the camera, and speak freely for 15 seconds.
            </p>
            <button
              onClick={handleStart}
              disabled={isRecording || isAnalyzing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #ec4899)",
                color: "#f9fafb",
                fontSize: 14,
                fontWeight: 500,
                cursor: isRecording || isAnalyzing ? "default" : "pointer",
                opacity: isRecording || isAnalyzing ? 0.6 : 1,
                boxShadow: isRecording || isAnalyzing ? "none" : "0 10px 25px rgba(79,70,229,0.5)",
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
              }}
            >
              {isRecording ? "Listening…" : isAnalyzing ? "Analyzing…" : "Start scan"}
            </button>
            <div style={{ marginTop: 10, fontSize: 13 }}>
              {isRecording
                ? "Recording… keep speaking naturally."
                : isAnalyzing
                ? "Recording complete. Analyzing…"
                : scanResult
                ? "Scan complete. You can run another anytime."
                : "Ready when you are."}
            </div>
            {scanError && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#f97373" }}>
                {scanError}
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
              gap: 24,
              alignItems: "flex-start",
              marginTop: 16,
            }}
          >
            <div>
              {scanResult ? (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    background: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(148,163,184,0.4)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 20px",
                      fontSize: 18,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {scanResult.summary}
                  </p>
                  {scanResult.face && (
                    <div
                      style={{
                        marginBottom: 20,
                        textAlign: "center",
                        fontSize: 14,
                        color: "#9ca3af",
                      }}
                    >
                      😌 Emotion: <strong style={{ color: "#f9fafb" }}>{scanResult.face.emotion}</strong> · 🎯 Focus:{" "}
                      <strong style={{ color: "#f9fafb" }}>{Math.round((scanResult.face.focusScore ?? 0) * 100)}%</strong>
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {CHAKRA_ORDER.map((chakra) => {
                      const value = scanResult.chakraScores[chakra.key] ?? 0;
                      const pct = Math.round(value * 100);
                      const isDominant = scanResult?.dominant === chakra.key;
                      return (
                        <div
                          key={chakra.key}
                          style={{
                            padding: 10,
                            borderRadius: 12,
                            background: isDominant
                              ? `linear-gradient(135deg, ${chakra.color}33, rgba(0,0,0,0.5))`
                              : "rgba(15,23,42,0.9)",
                            border: isDominant ? `1px solid ${chakra.color}` : "1px solid rgba(51,65,85,0.9)",
                            boxShadow: isDominant ? `0px 0px 18px 3px ${chakra.color}55` : "none",
                            transition: "all 0.4s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                            <span style={{ fontWeight: 500 }}>{chakra.label}</span>
                            <span style={{ color: "#9ca3af" }}>{pct}%</span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              borderRadius: 999,
                              background: "#020617",
                              overflow: "hidden",
                              marginBottom: 6,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                borderRadius: 999,
                                background: chakra.color,
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                            {pct >= 80
                              ? "Highly activated · watch for overwhelm."
                              : pct >= 55
                              ? "Balanced activation."
                              : pct >= 30
                              ? "Gently underactive · wants nurturing."
                              : "Low activation · asking for attention."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    border: "1px dashed rgba(148,163,184,0.4)",
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  Complete a scan to reveal your chakra insights.
                </div>
              )}
            </div>

            <div
              style={{
                background: "rgba(15,23,42,0.9)",
                borderRadius: 16,
                padding: 12,
                border: "1px solid rgba(148,163,184,0.4)",
              }}
            >
              <FaceReader active={cameraActive} onResult={handleFaceResult} />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Recorder
              ref={recorderRef}
              hideTrigger
              durationMs={15000}
              onComplete={handleAudioComplete}
              onRecordingStateChange={(recording) => {
                setIsRecording(recording);
                if (recording) {
                  setFaceReading(null);
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
