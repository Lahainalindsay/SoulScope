import assert from "node:assert/strict";
import test from "node:test";
import { buildContours, buildNodes, buildScalarField, normalizeSignatureInput, serializeSignatureSvg, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { buildVisualFixtures } from "./fixtures";

function parsePath(path: string) {
  const match = /M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)/.exec(path);
  if (!match) return null;
  const x = (Number(match[1]) + Number(match[3])) / 2;
  const y = (Number(match[2]) + Number(match[4])) / 2;
  const length = Math.hypot(Number(match[3]) - Number(match[1]), Number(match[4]) - Number(match[2]));
  return { x, y, length };
}

function buildMetrics(scan: ReturnType<typeof normalizeSignatureInput>) {
  const field = buildScalarField(scan);
  const contours = buildContours(scan, field);
  const nodes = buildNodes(scan, contours);
  const quadrantEnergy = { north: 0, east: 0, south: 0, west: 0 };
  const familyEnergy = { COG: 0, REG: 0, CAP: 0, EXP: 0 };
  let visiblePathLength = 0;
  for (const contour of contours) {
    const parsed = parsePath(contour.path);
    if (!parsed) continue;
    const energy = parsed.length * contour.opacity * contour.strokeWidth;
    visiblePathLength += parsed.length;
    if (parsed.y < 600 && Math.abs(parsed.y - 600) >= Math.abs(parsed.x - 600)) quadrantEnergy.north += energy;
    if (parsed.x > 600 && Math.abs(parsed.x - 600) >= Math.abs(parsed.y - 600)) quadrantEnergy.east += energy;
    if (parsed.y > 600 && Math.abs(parsed.y - 600) >= Math.abs(parsed.x - 600)) quadrantEnergy.south += energy;
    if (parsed.x < 600 && Math.abs(parsed.x - 600) >= Math.abs(parsed.y - 600)) quadrantEnergy.west += energy;
    if (contour.constellationId === "COG" || contour.constellationId === "REG" || contour.constellationId === "CAP" || contour.constellationId === "EXP") {
      familyEnergy[contour.constellationId] += energy;
    }
  }
  const totalQuadrantEnergy = quadrantEnergy.north + quadrantEnergy.east + quadrantEnergy.south + quadrantEnergy.west;
  const maxQuadrant = Math.max(quadrantEnergy.north, quadrantEnergy.east, quadrantEnergy.south, quadrantEnergy.west);
  const rotationalDominanceScore = totalQuadrantEnergy > 0 ? maxQuadrant / totalQuadrantEnergy : 1;
  return {
    contours,
    nodes,
    visiblePathLength,
    quadrantEnergy,
    familyEnergy,
    rotationalDominanceScore,
    highPriorityContours: contours.filter((contour) => contour.tier === "A").length,
    convergenceNodeCount: nodes.filter((node) => node.support >= 2.5).length,
    avgOpacity: contours.reduce((sum, contour) => sum + contour.opacity, 0) / Math.max(1, contours.length),
  };
}

test("balanced fixture produces four directional field families without single-spiral collapse", () => {
  const fixtures = buildVisualFixtures();
  const metrics = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.balancedHighConfidence)));
  assert.ok(metrics.quadrantEnergy.north > 0);
  assert.ok(metrics.quadrantEnergy.east > 0);
  assert.ok(metrics.quadrantEnergy.south > 0);
  assert.ok(metrics.quadrantEnergy.west > 0);
  assert.ok(metrics.rotationalDominanceScore < 0.42);
});

test("dominant constellation fixtures retain quadrant and color-family separation", () => {
  const fixtures = buildVisualFixtures();
  const cogMetrics = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.cogDominant)));
  const regMetrics = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.regDominant)));
  const capMetrics = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.capDominant)));
  const expMetrics = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.expDominant)));
  assert.equal(Math.max(...Object.values(cogMetrics.familyEnergy)), cogMetrics.familyEnergy.COG);
  assert.equal(Math.max(...Object.values(regMetrics.familyEnergy)), regMetrics.familyEnergy.REG);
  assert.equal(Math.max(...Object.values(capMetrics.familyEnergy)), capMetrics.familyEnergy.CAP);
  assert.equal(Math.max(...Object.values(expMetrics.familyEnergy)), expMetrics.familyEnergy.EXP);
  assert.ok(cogMetrics.quadrantEnergy.north > cogMetrics.quadrantEnergy.south);
  assert.ok(regMetrics.quadrantEnergy.east > regMetrics.quadrantEnergy.west);
  assert.ok(capMetrics.quadrantEnergy.south > capMetrics.quadrantEnergy.north);
  assert.ok(expMetrics.quadrantEnergy.west > expMetrics.quadrantEnergy.east);
});

test("central convergence grows with stronger multi-constellation support", () => {
  const fixtures = buildVisualFixtures();
  const highSupport = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.balancedHighConfidence)));
  const lowSupport = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.sparseEvidence)));
  const highCenter = highSupport.nodes.find((node) => node.id === "central-convergence");
  const lowCenter = lowSupport.nodes.find((node) => node.id === "central-convergence");
  assert.ok(highCenter && lowCenter);
  assert.ok(highCenter.radius > lowCenter.radius);
  assert.ok(highSupport.convergenceNodeCount >= lowSupport.convergenceNodeCount);
});

test("low confidence dims brightness but keeps geometry", () => {
  const fixtures = buildVisualFixtures();
  const balanced = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.balancedHighConfidence)));
  const low = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.lowConfidence)));
  assert.ok(low.avgOpacity < balanced.avgOpacity);
  assert.ok(low.visiblePathLength > balanced.visiblePathLength * 0.55);
});

test("low coverage reduces contour population", () => {
  const fixtures = buildVisualFixtures();
  const balanced = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.balancedHighConfidence)));
  const sparse = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.sparseEvidence)));
  assert.ok(sparse.contours.length < balanced.contours.length);
  assert.ok(sparse.highPriorityContours <= balanced.highPriorityContours);
});

test("unresolved dimensions stay interrupted and contradiction stays localized", () => {
  const fixtures = buildVisualFixtures();
  const unresolvedOutput = serializeSignatureSvg(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.unresolvedDimension)));
  const contradictionMetrics = buildMetrics(normalizeSignatureInput(validateResonanceSignatureInput(fixtures.highContradiction)));
  const contradictionContours = contradictionMetrics.contours.filter((contour) => contour.constellationId === "contradiction");
  assert.match(unresolvedOutput.svg, /stroke-dasharray/);
  assert.ok(unresolvedOutput.manifest.missingDimensions.length > 0);
  assert.ok(contradictionContours.length > 0);
  assert.ok(contradictionContours.length / contradictionMetrics.contours.length < 0.35);
});
