import { CENTER, MAX_FIELD_RADIUS } from "./registry";
import type { NormalizedResonanceSignature, SignatureConstellationId, SignatureNode } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

export function buildNodes(input: NormalizedResonanceSignature): SignatureNode[] {
  const nodes: SignatureNode[] = [];
  const balance = 1 - Math.min(1, Math.max(...CONSTELLATIONS.map((id) => input.constellations[id].fieldWeight)) - Math.min(...CONSTELLATIONS.map((id) => input.constellations[id].fieldWeight)));
  nodes.push({
    id: "central-convergence",
    x: CENTER,
    y: CENTER,
    radius: Number((5 + input.overallConfidence * 7 + balance * 4).toFixed(3)),
    opacity: Number((0.38 + input.overallCoherence * 0.48).toFixed(3)),
    constellationId: "center",
    support: Number(balance.toFixed(3)),
  });
  for (const id of CONSTELLATIONS) {
    const constellation = input.constellations[id];
    const angle = (constellation.anchorAngle * Math.PI) / 180;
    const radius = MAX_FIELD_RADIUS * (0.48 + constellation.fieldWeight * 0.38);
    nodes.push({
      id: `${id}-anchor-node`,
      x: Number((CENTER + Math.cos(angle) * radius).toFixed(3)),
      y: Number((CENTER + Math.sin(angle) * radius).toFixed(3)),
      radius: Number((3 + constellation.confidence * 6).toFixed(3)),
      opacity: Number((0.2 + constellation.confidence * 0.68).toFixed(3)),
      constellationId: id,
      support: constellation.dimensions.filter((dimension) => !dimension.unresolved).length,
    });
  }
  return nodes;
}
