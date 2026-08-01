import { ANCHORS, CONSTELLATIONS, FIELD_RADIUS, GRID_SIZE, VIEWBOX_SIZE } from "./constants";
import { angleDistance, clamp, mean, round, sha256Like, TAU } from "./math";
import type { ConstellationId, DimensionInput, InteractionInput, RendererInput, ScalarField } from "./types";

function indexFor(x: number, y: number, width: number) {
  return y * width + x;
}

function dimensionIndex(dimension: DimensionInput) {
  return Math.max(0, Number(dimension.dimensionId.slice(-1)) - 1);
}

function oscillator(dimension: DimensionInput, constellation: RendererInput["constellations"][ConstellationId], px: number, py: number) {
  if (!dimension.resolved || dimension.mean === null) return 0;
  const anchor = ANCHORS[dimension.constellation];
  const dx = px - anchor.x;
  const dy = py - anchor.y;
  const radius = Math.hypot(dx, dy) / FIELD_RADIUS;
  if (radius > 0.86) return 0;
  const theta = Math.atan2(dy, dx);
  const slot = dimensionIndex(dimension);
  const uncertainty = dimension.upperBound !== null && dimension.lowerBound !== null ? clamp(dimension.upperBound - dimension.lowerBound) : 1;
  const radialReach = 0.24 + dimension.mean * 0.5 + constellation.magnitude * 0.16;
  const amplitude = (0.28 + dimension.mean * 0.72) * dimension.confidence * dimension.signalReliability;
  const uncertaintyWidth = 0.07 + uncertainty * 0.22;
  const phase = (dimension.mean * 1.7 + dimension.confidence * 0.9 + slot * 0.37) * TAU;
  const harmonicOrder = 3 + slot * 2 + Math.round(dimension.mean * 5);
  const radialFrequency = 7 + slot * 3 + dimension.evidenceCoverage * 8;
  const angularBias = ((ANCHORS[dimension.constellation].angle * Math.PI) / 180) + dimension.momentum * 0.6;
  const angularEnvelope = Math.exp(-Math.pow(angleDistance(theta, angularBias) / (1.32 - constellation.dominance * 0.36), 2));
  const radialEnvelope = Math.exp(-Math.pow((radius - radialReach) / uncertaintyWidth, 2));
  const continuity = 0.28 + dimension.evidenceCoverage * 0.72;
  const coherence = 0.36 + dimension.coherence * 0.64;
  const wave = Math.sin(theta * harmonicOrder + radius * radialFrequency + phase + dimension.momentum * radius * 4);
  const counterPhase = Math.cos(theta * (harmonicOrder + 1) - phase + radius * radialFrequency * 0.72) * dimension.contradiction;
  return (wave * amplitude * coherence + counterPhase * 0.36) * radialEnvelope * angularEnvelope * continuity;
}

function texture(input: RendererInput, px: number, py: number) {
  const acoustic = input.acousticTexture;
  const roughness = (acoustic.jitter ?? 0) * 0.04 + (acoustic.shimmer ?? 0) * 0.035 + (acoustic.spectralFlux ?? 0) * 0.04;
  const branch = (acoustic.pitchRange ?? 0.5) * 0.03 + (1 - (acoustic.rhythmRegularity ?? 0.5)) * 0.03;
  const continuity = 1 - ((acoustic.pauseDensity ?? 0) * 0.07 + (acoustic.pauseDuration ?? 0) * 0.06);
  const micro = Math.sin(px * 0.071 + py * 0.047) * roughness + Math.cos(px * 0.031 - py * 0.063) * branch;
  return { micro, continuity: clamp(continuity, 0.72, 1) };
}

function interactionContribution(interaction: InteractionInput, px: number, py: number) {
  const subject = ANCHORS[interaction.subject];
  const object = ANCHORS[interaction.object];
  const vx = object.x - subject.x;
  const vy = object.y - subject.y;
  const lengthSq = vx * vx + vy * vy;
  const t = clamp(((px - subject.x) * vx + (py - subject.y) * vy) / Math.max(1, lengthSq));
  const bridgeX = subject.x + vx * t;
  const bridgeY = subject.y + vy * t;
  const distance = Math.hypot(px - bridgeX, py - bridgeY) / FIELD_RADIUS;
  const envelope = Math.exp(-Math.pow(distance / 0.16, 2)) * interaction.strength * interaction.confidence;
  const phase = (interaction.kind.length + interaction.interactionId.length) * 0.137;
  const wave = Math.sin(t * TAU * (2 + interaction.strength * 3) + phase);
  const polarity: Record<string, number> = {
    reinforces: 1,
    integrates: 0.9,
    buffers: 0.55,
    protects: 0.48,
    reveals: 0.7,
    redirects: -0.35,
    constrains: -0.52,
    destabilizes: -0.78,
    compensates: 0.38,
    amplifies: 1.18,
  };
  return envelope * wave * (polarity[interaction.kind] ?? 0.5);
}

export function buildScalarField(input: RendererInput, gridSize = GRID_SIZE): ScalarField {
  const width = gridSize;
  const height = gridSize;
  const constellationFields = Object.fromEntries(CONSTELLATIONS.map((id) => [id, new Array(width * height).fill(0)])) as Record<ConstellationId, number[]>;
  const interactionField = new Array(width * height).fill(0);
  const values = new Array(width * height).fill(0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const px = (x / (width - 1)) * VIEWBOX_SIZE;
      const py = (y / (height - 1)) * VIEWBOX_SIZE;
      const index = indexFor(x, y, width);
      const tex = texture(input, px, py);
      for (const constellationId of CONSTELLATIONS) {
        const constellation = input.constellations[constellationId];
        const dimensions = input.dimensions.filter((dimension) => dimension.constellation === constellationId);
        const raw = dimensions.reduce((sum, dimension) => sum + oscillator(dimension, constellation, px, py), 0);
        const distortion = 1 + constellation.distortion * 0.22 - constellation.tension * 0.08;
        constellationFields[constellationId][index] = round(Math.abs(raw * distortion + tex.micro) * tex.continuity);
      }
      interactionField[index] = round(input.interactions.reduce((sum, interaction) => sum + interactionContribution(interaction, px, py), 0));
      const overlap = mean(CONSTELLATIONS.map((id) => constellationFields[id][index]));
      const convergence = Math.min(...CONSTELLATIONS.map((id) => constellationFields[id][index])) * mean(CONSTELLATIONS.map((id) => input.constellations[id].coherence));
      values[index] = round(clamp(overlap + Math.abs(interactionField[index]) * 0.32 + convergence * 0.72));
    }
  }

  return Object.freeze({
    width,
    height,
    values: Object.freeze(values),
    constellationFields: Object.freeze(Object.fromEntries(CONSTELLATIONS.map((id) => [id, Object.freeze(constellationFields[id])]))) as ScalarField["constellationFields"],
    interactionField: Object.freeze(interactionField),
    checksum: sha256Like(values.map((value) => value.toFixed(6)).join("|")),
  });
}
