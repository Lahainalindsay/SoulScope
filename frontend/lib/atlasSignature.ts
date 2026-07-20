import type { ResonanceSignatureDatum } from "../components/ResonanceSignature";
import {
  ATLAS_PROFILES,
  type AtlasEvidenceId,
  type AtlasInput,
  type AtlasResult,
  type AtlasSubpatternId,
} from "./patternAtlas";

export type AtlasSignatureModel = {
  data: ResonanceSignatureDatum[];
  seedKey: string;
  visualState: {
    density: number;
    coherence: number;
    asymmetry: number;
    expansion: number;
    centerCalm: number;
  };
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const FAMILY_VISUAL_BIAS: Record<string, Partial<Record<AtlasEvidenceId, number>>> = {
  overextended: { "sustained-effort": .18, "reduced-recovery": .22, "fragmented-processing": .08 },
  reflective: { "cognitive-searching": .2, "protective-restraint": .08 },
  protective: { "protective-restraint": .22, "steady-regulation": .08 },
  adaptive: { "adaptive-momentum": .2, "expressive-flexibility": .12 },
  recovering: { "returning-capacity": .22, "steady-regulation": .1 },
  grounded: { "grounded-presence": .22, "steady-regulation": .18 },
  expressive: { "expressive-flexibility": .22, "social-availability": .16 },
  purposeful: { "directional-clarity": .22, "adaptive-momentum": .12 },
};

function weighted(input: AtlasInput, ids: AtlasEvidenceId[]) {
  if (!ids.length) return 0;
  return ids.reduce((sum, id) => sum + clamp(input[id] ?? 0), 0) / ids.length;
}

export function buildAtlasSignatureModel(input: AtlasInput, result: AtlasResult): AtlasSignatureModel {
  const familyBias = FAMILY_VISUAL_BIAS[result.profile.family] ?? {};
  const evidenceData = (Object.entries(input) as Array<[AtlasEvidenceId, number]>)
    .map(([id, value]) => ({
      id: `atlas:evidence:${id}`,
      value: clamp(value + (familyBias[id] ?? 0)),
      weight: .9,
    }));

  const subpatternData = result.subpatterns.map(({ id, score }, index) => ({
    id: `atlas:subpattern:${id}`,
    value: clamp(score),
    weight: clamp(.82 - index * .11, .42, .82),
  }));

  const profileIndex = ATLAS_PROFILES.findIndex((profile) => profile.id === result.profile.id);
  const profileData: ResonanceSignatureDatum[] = [
    {
      id: `atlas:profile:${result.profile.id}`,
      value: clamp(result.score),
      weight: 1,
    },
    ...result.supporting.map(({ profile, score }, index) => ({
      id: `atlas:supporting:${profile.id}`,
      value: clamp(score),
      weight: clamp(.62 - index * .12, .38, .62),
    })),
    {
      id: `atlas:identity:${result.profile.family}:${Math.max(0, profileIndex)}`,
      value: clamp((Math.max(0, profileIndex) + 1) / Math.max(1, ATLAS_PROFILES.length)),
      weight: .34,
    },
  ];

  const demand = weighted(input, ["sustained-effort", "reduced-recovery", "cognitive-searching", "fragmented-processing"]);
  const regulation = weighted(input, ["steady-regulation", "grounded-presence", "adaptive-momentum"]);
  const openness = weighted(input, ["expressive-flexibility", "social-availability", "directional-clarity"]);
  const protection = weighted(input, ["protective-restraint", "reduced-recovery"]);
  const restoration = weighted(input, ["returning-capacity", "grounded-presence", "steady-regulation"]);

  return {
    data: [...evidenceData, ...subpatternData, ...profileData],
    seedKey: `${result.profile.id}:${result.subpatterns.map(({ id }) => id).join(":")}`,
    visualState: {
      density: clamp(.28 + demand * .62),
      coherence: clamp(.2 + regulation * .72 - (input["fragmented-processing"] ?? 0) * .18),
      asymmetry: clamp(.08 + Math.abs(demand - regulation) * .62 + protection * .18),
      expansion: clamp(.2 + openness * .55 + (input["adaptive-momentum"] ?? 0) * .2),
      centerCalm: clamp(.18 + restoration * .68 - demand * .22),
    },
  };
}

export function atlasSignatureRegionIds(result: AtlasResult): AtlasSubpatternId[] {
  return result.subpatterns.map(({ id }) => id);
}
