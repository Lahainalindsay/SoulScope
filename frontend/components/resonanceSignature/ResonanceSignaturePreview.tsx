import ResonanceSignature from "./ResonanceSignature";
import type { ResonanceSignatureInputV1, SignatureConstellationId } from "../../lib/resonanceSignature";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function fixture(scanId: string, offset: number): ResonanceSignatureInputV1 {
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellationId, constellationIndex) => {
    const base = 0.52 + offset + constellationIndex * 0.035;
    return [constellationId, {
      constellationId,
      confidence: 0.78,
      evidenceCoverage: 0.84,
      contradiction: constellationId === "EXP" && offset > 0.08 ? 0.42 : 0.08,
      coherence: 0.76,
      dimensions: [0, 1, 2, 3].map((index) => ({
        dimensionId: `${constellationId}-P${index + 1}`,
        mean: Math.max(0, Math.min(1, base + index * 0.045)),
        lowerBound: Math.max(0, base - 0.08),
        upperBound: Math.min(1, base + 0.08),
        confidence: 0.74 + index * 0.035,
        evidenceCoverage: 0.78,
        contradiction: 0.05,
        coherence: 0.76,
        unresolved: false,
      })),
    }];
  })) as unknown as ResonanceSignatureInputV1["constellations"];
  return {
    contractVersion: "soulscope.resonance-signature.v1",
    scanId,
    resultVersion: "preview-fixture-v1",
    rendererVersion: "soulscope-signature-renderer-v1.0.0",
    overallConfidence: 0.8,
    overallCoverage: 0.82,
    overallCoherence: 0.76,
    baselineTrust: 0,
    constellations,
    acousticVisualInputs: { pitchRange: 0.62, pitchStability: 0.72, harmonicRichness: 0.68, hnr: 0.74 },
  };
}

export default function ResonanceSignaturePreview() {
  const fixtures = [
    fixture("preview-balanced", 0),
    fixture("preview-asymmetric", 0.12),
    fixture("preview-low", -0.18),
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, background: "#020509", padding: 24 }}>
      {fixtures.map((input) => <ResonanceSignature key={input.scanId} input={input} size={360} showGuides motion="none" />)}
    </div>
  );
}
