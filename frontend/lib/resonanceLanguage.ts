import { type NoteEnergyResult } from "./voiceSpectrum";

export type ResonanceSystem = {
  note: string;
  name: string;
  pillar: "Mental" | "Emotional" | "Physical" | "Behavioral";
  strength: string;
  load: string;
  underexpressed: string;
  feltSense: string;
  rebalancing: string;
};

export const RESONANCE_SYSTEMS: ResonanceSystem[] = [
  {
    note: "C",
    name: "Recovery Cluster",
    pillar: "Physical",
    strength: "Stability",
    load: "Sustained Strain",
    underexpressed: "Recovery Needs",
    feltSense: "It may feel harder to settle, recover, or feel fully resourced.",
    rebalancing: "Prioritize basic recovery: slower breathing, hydration, sleep regularity, and a grounded walk.",
  },
  {
    note: "C#",
    name: "Sensitivity Cluster",
    pillar: "Emotional",
    strength: "Emotional Awareness",
    load: "Emotional Saturation",
    underexpressed: "Reduced Emotional Access",
    feltSense: "You may notice emotional information arriving quickly, before it is easy to name.",
    rebalancing: "Create a short transition ritual before decisions: breathe, name the feeling, then act.",
  },
  {
    note: "D",
    name: "Pressure Cluster",
    pillar: "Physical",
    strength: "Forward Movement",
    load: "Sustained Demand",
    underexpressed: "Reduced Activation",
    feltSense: "Your system may feel like it is pushing to keep pace.",
    rebalancing: "Release pressure through movement, longer exhales, and smaller next actions.",
  },
  {
    note: "D#",
    name: "Adaptability Cluster",
    pillar: "Behavioral",
    strength: "Adaptability",
    load: "Adjustment Fatigue",
    underexpressed: "Resistance to Change",
    feltSense: "Change may require more effort than usual, even when you know what comes next.",
    rebalancing: "Reduce friction by choosing one clear priority and one optional task.",
  },
  {
    note: "E",
    name: "Growth Cluster",
    pillar: "Behavioral",
    strength: "Purposeful Growth",
    load: "Achievement Pressure",
    underexpressed: "Reduced Momentum",
    feltSense: "You may feel responsible for moving things forward, even when energy is uneven.",
    rebalancing: "Reconnect effort to purpose and remove one unnecessary obligation.",
  },
  {
    note: "F",
    name: "Connection Cluster",
    pillar: "Emotional",
    strength: "Relational Strength",
    load: "Emotional Responsibility",
    underexpressed: "Reduced Connection",
    feltSense: "You may be caring deeply while also needing more space to replenish.",
    rebalancing: "Practice clean boundaries: one honest request, one protected pause.",
  },
  {
    note: "F#",
    name: "Alignment Cluster",
    pillar: "Mental",
    strength: "Alignment",
    load: "Competing Priorities",
    underexpressed: "Unclear Direction",
    feltSense: "You may be sorting what you feel from what you think you should express.",
    rebalancing: "Journal the difference between what is true, what is urgent, and what can wait.",
  },
  {
    note: "G",
    name: "Expression Cluster",
    pillar: "Emotional",
    strength: "Expression",
    load: "Unspoken Tension",
    underexpressed: "Held-Back Expression",
    feltSense: "Words may be available, but the system may still be deciding how much to reveal.",
    rebalancing: "Speak one clear sentence out loud before entering a harder conversation.",
  },
  {
    note: "G#",
    name: "Release Cluster",
    pillar: "Physical",
    strength: "Recovery Capacity",
    load: "Recovery Debt",
    underexpressed: "Insufficient Recovery",
    feltSense: "You may feel braced, like your system has not fully exhaled yet.",
    rebalancing: "Use a short release cycle: shake out the body, hum softly, then rest in silence.",
  },
  {
    note: "A",
    name: "Future Orientation Cluster",
    pillar: "Behavioral",
    strength: "Future Orientation",
    load: "Future Overload",
    underexpressed: "Limited Momentum",
    feltSense: "Your attention may be reaching toward what is next, sometimes faster than your body can follow.",
    rebalancing: "Choose the next visible step instead of carrying the whole future at once.",
  },
  {
    note: "A#",
    name: "Integration Cluster",
    pillar: "Mental",
    strength: "Integrated Reflection",
    load: "Mental Processing Demand",
    underexpressed: "Unresolved Processing",
    feltSense: "You may be making meaning from recent experiences while still needing time to metabolize them.",
    rebalancing: "Give yourself a closing practice: summarize what happened, what mattered, and what is complete.",
  },
  {
    note: "B",
    name: "Reflection Cluster",
    pillar: "Mental",
    strength: "Reflection",
    load: "Cognitive Saturation",
    underexpressed: "Mental Fog",
    feltSense: "You may understand the bigger picture but need more quiet to turn insight into calm action.",
    rebalancing: "Reduce input, create white space, and identify the one insight worth acting on today.",
  },
];

export function getResonanceSystem(note?: string | null) {
  return RESONANCE_SYSTEMS.find((system) => system.note === note) ?? RESONANCE_SYSTEMS[6];
}

export function getResonanceSystemLabel(note?: string | null) {
  const system = getResonanceSystem(note);
  return `${system.name} (${system.note})`;
}

export function getExpressionStateLabel(status: NoteEnergyResult["status"]) {
  if (status === "overactive") return "Under Greater Demand";
  if (status === "underactive") return "Needs More Support";
  return "Balanced";
}

export function getLoadLanguage(entry: NoteEnergyResult) {
  const system = getResonanceSystem(entry.note);
  if (entry.status === "overactive") return system.load;
  if (entry.status === "underactive") return system.underexpressed;
  return system.strength;
}
