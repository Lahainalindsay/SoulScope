import type { UserResultDomainName } from "./systemDimensions";

export type MeaningEvidence = {
  domain: UserResultDomainName;
  score: number;
};

export type MeaningCandidate = {
  id: string;
  title: string;
  compatibility: number;
  meaning: string;
};

export type MeaningNode = {
  id: string;
  title: string;
  score: number;
  confidence: number;
  meaning: string;
  resultType: "clear" | "blended" | "unresolved";
  evidence: MeaningEvidence[];
  alternatives: MeaningCandidate[];
  sourceNodeIds: string[];
};

type AxisDefinition = {
  id: string;
  x: UserResultDomainName;
  y: UserResultDomainName;
  states: Array<{
    id: string;
    title: string;
    x: number;
    y: number;
    meaning: string;
  }>;
  blends?: Array<{
    between: [string, string];
    id: string;
    title: string;
    meaning: string;
  }>;
};

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const normalized = (score: number) => clamp(score / 100);

const AXES: AxisDefinition[] = [
  {
    id: "mental-load-organization",
    x: "Focus & Mental Load",
    y: "Communication & Clarity",
    states: [
      { id: "structured-processing", title: "Structured Processing", x: 1, y: 1, meaning: "A great deal appears to be occupying your attention, while your thoughts remain organized enough to sort, hold, and work with what is in front of you." },
      { id: "competing-demands", title: "Competing Demands", x: 1, y: 0, meaning: "Several thoughts or demands appear active at once, while the structure needed to order them is less available, allowing priorities to compete for attention." },
      { id: "clear-simplicity", title: "Clear Simplicity", x: 0, y: 1, meaning: "Your mental field appears relatively uncluttered, and the thoughts that are present seem easy to organize and express clearly." },
      { id: "open-processing", title: "Open Processing", x: 0, y: 0, meaning: "There appears to be room for ideas to form without strong pressure to organize or resolve them immediately." },
    ],
    blends: [
      { between: ["structured-processing", "competing-demands"], id: "active-reorganization", title: "Active Reorganization", meaning: "A great deal is moving through your attention. Some of it is being organized effectively, while other parts remain unsettled or continue competing for space." },
    ],
  },
  {
    id: "mental-load-direction",
    x: "Focus & Mental Load",
    y: "Direction & Adaptability",
    states: [
      { id: "purposeful-focus", title: "Purposeful Focus", x: 1, y: 1, meaning: "Your attention appears highly engaged and organized around a meaningful direction, allowing complexity to be carried toward a clear purpose." },
      { id: "diffuse-prioritization", title: "Diffuse Prioritization", x: 1, y: 0, meaning: "There appears to be a great deal competing for your attention, making it harder to establish which direction deserves priority first." },
      { id: "open-direction", title: "Open Direction", x: 0, y: 1, meaning: "There is room to move toward what matters without a heavy cognitive burden shaping every decision." },
      { id: "uncommitted-space", title: "Uncommitted Space", x: 0, y: 0, meaning: "Your attention appears relatively open, with no single demand or direction strongly organizing the moment." },
    ],
    blends: [
      { between: ["purposeful-focus", "diffuse-prioritization"], id: "searching-focus", title: "Searching Focus", meaning: "You appear mentally engaged and actively looking for the clearest direction, even though several possible priorities still remain in play." },
    ],
  },
  {
    id: "recovery-capacity",
    x: "Recovery & Restoration",
    y: "Energy & Vitality",
    states: [
      { id: "restored-capacity", title: "Restored Capacity", x: 1, y: 1, meaning: "Recovery and usable energy appear available together, giving you room to engage without immediately drawing down your reserves." },
      { id: "quiet-restoration", title: "Quiet Restoration", x: 1, y: 0, meaning: "Your system appears capable of restoring itself, while outward energy remains quieter and more selective." },
      { id: "sustained-output", title: "Sustained Output", x: 0, y: 1, meaning: "There is enough energy to keep participating, although recovery is not yet keeping pace with the output being maintained." },
      { id: "reduced-reserve", title: "Reduced Reserve", x: 0, y: 0, meaning: "Both recovery and immediately available energy appear limited, making pacing and protection of resources especially important." },
    ],
    blends: [
      { between: ["sustained-output", "reduced-reserve"], id: "narrowing-reserve", title: "Narrowing Reserve", meaning: "You may still be able to continue, but the margin between available energy and needed recovery appears increasingly small." },
    ],
  },
  {
    id: "regulation-expression",
    x: "Regulation",
    y: "Emotional Expression",
    states: [
      { id: "regulated-expression", title: "Regulated Expression", x: 1, y: 1, meaning: "Emotion appears available for expression while your system remains able to stay connected to steadiness and perspective." },
      { id: "contained-composure", title: "Contained Composure", x: 1, y: 0, meaning: "Your system appears steady, while emotional expression remains more protected, private, or deliberately contained." },
      { id: "visible-intensity", title: "Visible Intensity", x: 0, y: 1, meaning: "Emotion appears readily available, while returning to steadiness may currently require more time or effort." },
      { id: "protected-processing", title: "Protected Processing", x: 0, y: 0, meaning: "Both expression and regulation appear to be working inwardly, suggesting a need for lower pressure and more protected processing." },
    ],
  },
  {
    id: "connection-expression",
    x: "Connection & Support",
    y: "Emotional Expression",
    states: [
      { id: "open-connection", title: "Open Connection", x: 1, y: 1, meaning: "You appear available for both emotional expression and meaningful connection, allowing others to meet more of what is actually present." },
      { id: "supportive-presence", title: "Supportive Presence", x: 1, y: 0, meaning: "You may remain available to others while keeping more of your own emotional experience private or carefully held." },
      { id: "selective-disclosure", title: "Selective Disclosure", x: 0, y: 1, meaning: "Emotion appears available, though you may be selective about who is invited close enough to receive it." },
      { id: "protected-relating", title: "Protected Relating", x: 0, y: 0, meaning: "Both relational and emotional availability appear more guarded, making safety, space, and lower demand especially relevant." },
    ],
  },
];

function evaluateAxis(axis: AxisDefinition, scores: Map<UserResultDomainName, number>): MeaningNode | null {
  const xScore = scores.get(axis.x);
  const yScore = scores.get(axis.y);
  if (xScore == null || yScore == null) return null;

  const x = normalized(xScore);
  const y = normalized(yScore);
  const candidates = axis.states
    .map((state) => {
      const distance = Math.sqrt(((x - state.x) ** 2 + (y - state.y) ** 2) / 2);
      return { ...state, compatibility: clamp(1 - distance) };
    })
    .sort((a, b) => b.compatibility - a.compatibility);

  const first = candidates[0];
  const second = candidates[1];
  const margin = first.compatibility - second.compatibility;
  const evidenceStrength = clamp((Math.abs(x - 0.5) + Math.abs(y - 0.5)));
  const closePair = margin <= 0.08;
  const blend = closePair
    ? axis.blends?.find((item) => item.between.includes(first.id) && item.between.includes(second.id))
    : undefined;

  if (blend) {
    return {
      id: blend.id,
      title: blend.title,
      score: clamp((first.compatibility + second.compatibility) / 2),
      confidence: clamp(0.68 + evidenceStrength * 0.2 - margin),
      meaning: blend.meaning,
      resultType: "blended",
      evidence: [{ domain: axis.x, score: xScore }, { domain: axis.y, score: yScore }],
      alternatives: candidates.slice(0, 3).map(({ id, title, compatibility, meaning }) => ({ id, title, compatibility, meaning })),
      sourceNodeIds: [],
    };
  }

  if (first.compatibility < 0.52) {
    return {
      id: `${axis.id}-unresolved`,
      title: "Relationship Unclear",
      score: first.compatibility,
      confidence: clamp(first.compatibility * 0.6),
      meaning: "The available evidence does not support a single clear relationship state yet.",
      resultType: "unresolved",
      evidence: [{ domain: axis.x, score: xScore }, { domain: axis.y, score: yScore }],
      alternatives: candidates.slice(0, 3).map(({ id, title, compatibility, meaning }) => ({ id, title, compatibility, meaning })),
      sourceNodeIds: [],
    };
  }

  return {
    id: first.id,
    title: first.title,
    score: first.compatibility,
    confidence: clamp(0.52 + margin * 1.4 + evidenceStrength * 0.24),
    meaning: first.meaning,
    resultType: "clear",
    evidence: [{ domain: axis.x, score: xScore }, { domain: axis.y, score: yScore }],
    alternatives: candidates.slice(0, 3).map(({ id, title, compatibility, meaning }) => ({ id, title, compatibility, meaning })),
    sourceNodeIds: [],
  };
}

export function buildMeaningNodes(values: Array<{ domain: UserResultDomainName; score: number }>): MeaningNode[] {
  const scores = new Map(values.map((value) => [value.domain, value.score]));
  return AXES.map((axis) => evaluateAxis(axis, scores))
    .filter((node): node is MeaningNode => Boolean(node))
    .sort((a, b) => b.confidence * b.score - a.confidence * a.score);
}

export function combineMeaningNodes(nodes: MeaningNode[]): MeaningNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const result: MeaningNode[] = [];

  const structured = byId.get("structured-processing") ?? byId.get("active-reorganization");
  const focus = byId.get("purposeful-focus") ?? byId.get("searching-focus") ?? byId.get("diffuse-prioritization");
  if (structured && focus) {
    const directed = focus.id === "diffuse-prioritization" || focus.id === "searching-focus";
    result.push({
      id: directed ? "active-sorting" : "directed-complexity",
      title: directed ? "Active Sorting" : "Directed Complexity",
      score: clamp((structured.score + focus.score) / 2),
      confidence: clamp((structured.confidence + focus.confidence) / 2),
      meaning: directed
        ? "You appear to be organizing a great deal of information while still deciding where that effort is most needed. The challenge is less about making sense of what is present and more about choosing what deserves priority first."
        : "You appear to be carrying substantial mental activity while continuing to organize it around a meaningful direction. Your attention is working through complexity rather than simply reacting to it.",
      resultType: structured.resultType === "blended" || focus.resultType === "blended" ? "blended" : "clear",
      evidence: [...structured.evidence, ...focus.evidence].filter((item, index, all) => all.findIndex((other) => other.domain === item.domain) === index),
      alternatives: [],
      sourceNodeIds: [structured.id, focus.id],
    });
  }

  const cognitive = result.find((node) => node.id === "active-sorting" || node.id === "directed-complexity");
  const reserve = byId.get("reduced-reserve") ?? byId.get("narrowing-reserve") ?? byId.get("sustained-output");
  if (cognitive && reserve) {
    result.push({
      id: reserve.id === "sustained-output" ? "sustained-deliberation" : "sustained-cognitive-demand",
      title: reserve.id === "sustained-output" ? "Sustained Deliberation" : "Sustained Cognitive Demand",
      score: clamp((cognitive.score + reserve.score) / 2),
      confidence: clamp((cognitive.confidence + reserve.confidence) / 2),
      meaning: reserve.id === "sustained-output"
        ? "You seem to be working carefully through important demands with a clear sense of purpose, although maintaining that level of thought and organization may be drawing more heavily on your available resources."
        : "Your mind appears actively engaged in organizing and prioritizing important thoughts, while the energy available to sustain that effort appears increasingly limited.",
      resultType: cognitive.resultType === "blended" || reserve.resultType === "blended" ? "blended" : "clear",
      evidence: [...cognitive.evidence, ...reserve.evidence].filter((item, index, all) => all.findIndex((other) => other.domain === item.domain) === index),
      alternatives: [],
      sourceNodeIds: [cognitive.id, reserve.id],
    });
  }

  return result.sort((a, b) => b.confidence * b.score - a.confidence * a.score);
}
