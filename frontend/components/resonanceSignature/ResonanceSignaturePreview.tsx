import { useMemo, useState } from "react";
import ResonanceSignature from "./ResonanceSignature";
import type { ResonanceSignatureInputV1, SignatureConstellationId } from "../../lib/resonanceSignature";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function baseFixture(scanId: string): ResonanceSignatureInputV1 {
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellationId, constellationIndex) => {
    const base = 0.54 + constellationIndex * 0.04;
    return [constellationId, {
      constellationId,
      confidence: 0.82,
      evidenceCoverage: 0.84,
      contradiction: 0.06,
      coherence: 0.8,
      dimensions: [0, 1, 2, 3].map((index) => ({
        dimensionId: `${constellationId}-P${index + 1}`,
        mean: clamp01(base + index * 0.05),
        lowerBound: clamp01(base - 0.08 + index * 0.02),
        upperBound: clamp01(base + 0.08 + index * 0.02),
        confidence: clamp01(0.75 + index * 0.05),
        evidenceCoverage: 0.84,
        contradiction: 0.05,
        coherence: 0.8,
        unresolved: false,
        momentum: 0,
      })),
    }];
  })) as unknown as ResonanceSignatureInputV1["constellations"];
  return {
    contractVersion: "soulscope.resonance-signature.v1",
    scanId,
    resultVersion: "preview-fixture-v2",
    rendererVersion: "soulscope-signature-renderer-v1.1.0",
    overallConfidence: 0.84,
    overallCoverage: 0.84,
    overallCoherence: 0.8,
    baselineTrust: 0.72,
    constellations,
    acousticVisualInputs: {
      pitchRange: 0.62,
      pitchStability: 0.72,
      harmonicRichness: 0.68,
      hnr: 0.74,
      jitter: 0.08,
      formantStability: 0.76,
      pauseDensity: 0.24,
      pauseDurationMean: 0.34,
    },
  };
}

function fixtureSet() {
  const balanced = baseFixture("balanced-high-confidence");
  const boost = (input: ResonanceSignatureInputV1, constellationId: SignatureConstellationId, value: number): ResonanceSignatureInputV1 => ({
    ...input,
    constellations: {
      ...input.constellations,
      [constellationId]: {
        ...input.constellations[constellationId],
        confidence: clamp01(input.constellations[constellationId].confidence + value),
        evidenceCoverage: clamp01(input.constellations[constellationId].evidenceCoverage + value * 0.6),
        dimensions: input.constellations[constellationId].dimensions.map((dimension) => ({
          ...dimension,
          mean: clamp01((dimension.mean ?? 0.5) + value * 0.25),
          lowerBound: clamp01((dimension.lowerBound ?? 0.4) + value * 0.2),
          upperBound: clamp01((dimension.upperBound ?? 0.6) + value * 0.2),
          confidence: clamp01(dimension.confidence + value * 0.22),
          evidenceCoverage: clamp01(dimension.evidenceCoverage + value * 0.2),
        })),
      },
    },
  });
  return [
    { label: "1) Balanced high-confidence", input: balanced },
    { label: "2) COG dominant", input: boost(baseFixture("cog-dominant"), "COG", 0.26) },
    { label: "3) REG dominant", input: boost(baseFixture("reg-dominant"), "REG", 0.26) },
    { label: "4) CAP dominant", input: boost(baseFixture("cap-dominant"), "CAP", 0.26) },
    { label: "5) EXP dominant", input: boost(baseFixture("exp-dominant"), "EXP", 0.26) },
    { label: "6) Highly asymmetric", input: {
      ...baseFixture("highly-asymmetric"),
      overallCoherence: 0.64,
      constellations: {
        ...baseFixture("highly-asymmetric").constellations,
        COG: { ...baseFixture("highly-asymmetric").constellations.COG, dimensions: baseFixture("highly-asymmetric").constellations.COG.dimensions.map((dimension) => ({ ...dimension, momentum: -0.82 })) },
        CAP: { ...baseFixture("highly-asymmetric").constellations.CAP, dimensions: baseFixture("highly-asymmetric").constellations.CAP.dimensions.map((dimension) => ({ ...dimension, momentum: 0.88 })) },
      },
    } },
    { label: "7) High contradiction", input: {
      ...baseFixture("high-contradiction"),
      constellations: {
        ...baseFixture("high-contradiction").constellations,
        EXP: {
          ...baseFixture("high-contradiction").constellations.EXP,
          contradiction: 0.86,
          coherence: 0.3,
          dimensions: baseFixture("high-contradiction").constellations.EXP.dimensions.map((dimension) => ({ ...dimension, contradiction: 0.88, coherence: 0.22 })),
        },
      },
    } },
    { label: "8) Low confidence", input: { ...baseFixture("low-confidence"), overallConfidence: 0.34, constellations: Object.fromEntries(CONSTELLATIONS.map((id) => [id, { ...baseFixture("low-confidence").constellations[id], confidence: 0.32, dimensions: baseFixture("low-confidence").constellations[id].dimensions.map((dimension) => ({ ...dimension, confidence: 0.3 })) }])) as ResonanceSignatureInputV1["constellations"] } },
    { label: "9) Unresolved dimension", input: {
      ...baseFixture("unresolved-dimension"),
      constellations: {
        ...baseFixture("unresolved-dimension").constellations,
        CAP: {
          ...baseFixture("unresolved-dimension").constellations.CAP,
          dimensions: baseFixture("unresolved-dimension").constellations.CAP.dimensions.map((dimension, index) => index === 2 ? {
            ...dimension,
            mean: null,
            lowerBound: null,
            upperBound: null,
            confidence: 0.12,
            evidenceCoverage: 0.2,
            unresolved: true,
          } : dimension),
        },
      },
    } },
    { label: "10) Sparse evidence", input: { ...baseFixture("sparse-evidence"), overallCoverage: 0.28, constellations: Object.fromEntries(CONSTELLATIONS.map((id) => [id, { ...baseFixture("sparse-evidence").constellations[id], evidenceCoverage: 0.28, dimensions: baseFixture("sparse-evidence").constellations[id].dimensions.map((dimension) => ({ ...dimension, evidenceCoverage: 0.24 })) }])) as ResonanceSignatureInputV1["constellations"] } },
    { label: "11) High coherence", input: { ...baseFixture("high-coherence"), overallCoherence: 0.95, constellations: Object.fromEntries(CONSTELLATIONS.map((id) => [id, { ...baseFixture("high-coherence").constellations[id], coherence: 0.94, dimensions: baseFixture("high-coherence").constellations[id].dimensions.map((dimension) => ({ ...dimension, coherence: 0.94 })) }])) as ResonanceSignatureInputV1["constellations"] } },
    { label: "12) Real supplied scan proxy", input: { ...balanced, scanId: "real-supplied-scan", resultVersion: "real-scan-proxy-v1" } },
  ];
}

export default function ResonanceSignaturePreview() {
  const fixtures = useMemo(() => fixtureSet(), []);
  const [showGuides, setShowGuides] = useState(true);
  const [showBloom, setShowBloom] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showConfidenceOverlay, setShowConfidenceOverlay] = useState(false);
  const [showMissingnessOverlay, setShowMissingnessOverlay] = useState(false);
  const [isolateConstellation, setIsolateConstellation] = useState<"all" | SignatureConstellationId>("all");
  const controls = (
    <fieldset style={{ display: "flex", flexWrap: "wrap", gap: 16, border: "1px solid rgba(115,227,255,0.25)", borderRadius: 12, padding: 12 }}>
      <label><input type="checkbox" checked={showGuides} onChange={() => setShowGuides((value) => !value)} /> guides</label>
      <label><input type="checkbox" checked={showBloom} onChange={() => setShowBloom((value) => !value)} /> bloom</label>
      <label><input type="checkbox" checked={showNodes} onChange={() => setShowNodes((value) => !value)} /> nodes</label>
      <label><input type="checkbox" checked={showConfidenceOverlay} onChange={() => setShowConfidenceOverlay((value) => !value)} /> confidence overlay</label>
      <label><input type="checkbox" checked={showMissingnessOverlay} onChange={() => setShowMissingnessOverlay((value) => !value)} /> missingness overlay</label>
      <label>
        constellation isolation
        <select
          value={isolateConstellation}
          onChange={(event) => setIsolateConstellation(event.target.value as "all" | SignatureConstellationId)}
          style={{ marginLeft: 8 }}
        >
          <option value="all">all</option>
          <option value="COG">COG</option>
          <option value="REG">REG</option>
          <option value="CAP">CAP</option>
          <option value="EXP">EXP</option>
        </select>
      </label>
    </fieldset>
  );

  return (
    <div style={{ display: "grid", gap: 24, background: "#01040A", padding: 24 }}>
      {controls}
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, letterSpacing: 1.6, textTransform: "uppercase", color: "#72FFF5" }}>Current production renderer (baseline profile)</h2>
        <ResonanceSignature input={fixtures[0].input} size={420} showGuides showBloom={false} showNodes={false} showBaselineGhost motion="none" />
      </section>
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, letterSpacing: 1.6, textTransform: "uppercase", color: "#72FFF5" }}>Revised renderer</h2>
        <ResonanceSignature
          input={fixtures[0].input}
          size={460}
          showGuides={showGuides}
          showBloom={showBloom}
          showNodes={showNodes}
          isolateConstellation={isolateConstellation}
          showConfidenceOverlay={showConfidenceOverlay}
          showMissingnessOverlay={showMissingnessOverlay}
          showBaselineGhost
          motion="none"
        />
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 14 }}>
        {[1, 0.75, 0.5, 0.25].map((scale) => (
          <article key={scale} style={{ border: "1px solid rgba(115,227,255,0.15)", padding: 10 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#8FB7CA" }}>{Math.round(scale * 100)}%</p>
            <ResonanceSignature input={fixtures[0].input} size={380 * scale} showGuides={showGuides} showBloom={showBloom} showNodes={showNodes} motion="none" />
          </article>
        ))}
      </section>
      <section>
        <h2 style={{ margin: "0 0 12px", fontSize: 14, letterSpacing: 1.6, textTransform: "uppercase", color: "#72FFF5" }}>Grayscale</h2>
        <ResonanceSignature input={fixtures[0].input} size={420} showGuides={showGuides} showBloom={showBloom} showNodes={showNodes} grayscale motion="none" />
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {fixtures.map((fixture) => (
          <article key={fixture.label} style={{ border: "1px solid rgba(115,227,255,0.14)", borderRadius: 12, padding: 12, background: "rgba(5,16,28,0.6)" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#8FB7CA" }}>{fixture.label}</p>
            <ResonanceSignature
              input={fixture.input}
              size={340}
              showGuides={showGuides}
              showBloom={showBloom}
              showNodes={showNodes}
              showConfidenceOverlay={showConfidenceOverlay}
              showMissingnessOverlay={showMissingnessOverlay}
              isolateConstellation={isolateConstellation}
              motion="none"
            />
          </article>
        ))}
      </section>
    </div>
  );
}
