import { CENTER, MAX_FIELD_RADIUS } from "./registry";
import type { NormalizedResonanceSignature, SignatureConstellationId, SignatureContour, SignatureNode } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function parsePath(path: string) {
  const match = /M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)/.exec(path);
  if (!match) return null;
  return {
    x1: Number(match[1]),
    y1: Number(match[2]),
    x2: Number(match[3]),
    y2: Number(match[4]),
  };
}

export function buildNodes(input: NormalizedResonanceSignature, contours: readonly SignatureContour[]): SignatureNode[] {
  const nodes: SignatureNode[] = [];
  const weights = CONSTELLATIONS.map((id) => input.constellations[id].fieldWeight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const balance = clamp01(1 - (maxWeight - minWeight));
  const pairwise = [
    ["COG", "REG"],
    ["COG", "CAP"],
    ["COG", "EXP"],
    ["REG", "CAP"],
    ["REG", "EXP"],
    ["CAP", "EXP"],
  ] as const;
  const pairwiseSupport = pairwise.reduce((sum, [a, b]) => sum + input.constellations[a].fieldWeight * input.constellations[b].fieldWeight, 0) / pairwise.length;
  const centerSupport = clamp01(pairwiseSupport * 1.4 * input.overallCoverage);

  nodes.push({
    id: "central-convergence",
    x: CENTER,
    y: CENTER,
    radius: Number((5.8 + input.overallConfidence * 7.8 + centerSupport * 4.2 + balance * 2.8).toFixed(3)),
    opacity: Number((0.28 + input.overallConfidence * input.overallCoherence * 0.72 * centerSupport).toFixed(3)),
    constellationId: "center",
    support: Number((2 + centerSupport * 2).toFixed(3)),
  });

  for (const id of CONSTELLATIONS) {
    const constellation = input.constellations[id];
    const angle = (constellation.anchorAngle * Math.PI) / 180;
    const radius = MAX_FIELD_RADIUS * (0.44 + constellation.fieldWeight * 0.36);
    nodes.push({
      id: `${id}-anchor-node`,
      x: Number((CENTER + Math.cos(angle) * radius).toFixed(3)),
      y: Number((CENTER + Math.sin(angle) * radius).toFixed(3)),
      radius: Number((3.4 + constellation.confidence * 5.6).toFixed(3)),
      opacity: Number((0.2 + constellation.confidence * constellation.evidenceCoverage * 0.72).toFixed(3)),
      constellationId: id,
      support: Number((1 + constellation.dimensions.filter((dimension) => !dimension.unresolved).length * 0.35).toFixed(3)),
    });
  }

  const clusters = new Map<string, {
    xSum: number;
    ySum: number;
    weight: number;
    count: number;
    support: Set<string>;
    constellationScore: Record<SignatureConstellationId, number>;
  }>();

  const candidateContours = contours
    .filter((contour) => contour.tier === "A" || contour.tier === "B" || contour.constellationId === "contradiction")
    .slice(0, 520);

  for (const contour of candidateContours) {
    const parsed = parsePath(contour.path);
    if (!parsed) continue;
    const x = (parsed.x1 + parsed.x2) / 2;
    const y = (parsed.y1 + parsed.y2) / 2;
    const distanceToCenter = Math.hypot(x - CENTER, y - CENTER);
    if (distanceToCenter > MAX_FIELD_RADIUS * 0.94) continue;
    const key = `${Math.round(x / 28)}:${Math.round(y / 28)}`;
    const cluster = clusters.get(key) ?? {
      xSum: 0,
      ySum: 0,
      weight: 0,
      count: 0,
      support: new Set<string>(),
      constellationScore: { COG: 0, REG: 0, CAP: 0, EXP: 0 },
    };
    const weight = contour.importance * (contour.tier === "A" ? 1.45 : 1) * (contour.constellationId === "contradiction" ? 0.7 : 1);
    cluster.xSum += x * weight;
    cluster.ySum += y * weight;
    cluster.weight += weight;
    cluster.count += 1;
    if (contour.constellationId !== "global" && contour.constellationId !== "contradiction") {
      cluster.support.add(contour.constellationId);
      cluster.constellationScore[contour.constellationId] += weight;
    } else if (distanceToCenter < MAX_FIELD_RADIUS * 0.42) {
      for (const id of CONSTELLATIONS) {
        const anchorWeight = input.constellations[id].fieldWeight;
        if (anchorWeight > 0.38) cluster.support.add(id);
        cluster.constellationScore[id] += weight * anchorWeight * 0.45;
      }
    }
    clusters.set(key, cluster);
  }

  const clusterNodes = Array.from(clusters.values())
    .filter((cluster) => cluster.weight > 0.4 && (cluster.support.size >= 2 || cluster.count >= 4))
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 24)
    .map((cluster, index) => {
      const x = cluster.xSum / Math.max(0.00001, cluster.weight);
      const y = cluster.ySum / Math.max(0.00001, cluster.weight);
      const dominantConstellation = CONSTELLATIONS.reduce((best, id) =>
        cluster.constellationScore[id] > cluster.constellationScore[best] ? id : best, "COG");
      const supportStrength = clamp01(cluster.support.size / 4);
      return {
        id: `convergence-node-${index}`,
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        radius: Number((1.8 + supportStrength * 4.8 + Math.min(cluster.count, 8) * 0.32).toFixed(3)),
        opacity: Number((0.24 + supportStrength * 0.7).toFixed(3)),
        constellationId: cluster.support.size >= 3 ? "center" : dominantConstellation,
        support: Number((cluster.support.size + supportStrength).toFixed(3)),
      } as SignatureNode;
    });

  return [...nodes, ...clusterNodes];
}
