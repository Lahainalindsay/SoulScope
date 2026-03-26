import { getSoulScopeNoteProfile, NOTE_ORDER } from "./noteSystem";

export type NoteDiscoveryProfile = {
  note: string;
  colorName: string;
  chakra: string;
  senseOrgans: string[];
  internalOrgans: string[];
  emotionalTheme: string;
  underactiveEmotional: string[];
  overactiveEmotional: string[];
  underactivePhysical: string[];
  overactivePhysical: string[];
};

const NOTE_DISCOVERY_BASE: Record<string, Omit<NoteDiscoveryProfile, "note" | "emotionalTheme">> = {
  C: {
    colorName: "Red",
    chakra: "Root",
    senseOrgans: ["Mouth", "Lips"],
    internalOrgans: ["Spleen", "Digestive reserve", "Lymphatic flow"],
    underactiveEmotional: ["Guarded attachment", "Low self-support", "Feeling undernourished by life"],
    overactiveEmotional: ["Over-caretaking", "Codependency", "Losing yourself while supporting others"],
    underactivePhysical: ["Low reserve", "Digestive weakness", "Poor grounding in the body"],
    overactivePhysical: ["Tension from over-responsibility", "Stress load in large body muscles", "Inflammatory strain when overextended"],
  },
  "C#": {
    colorName: "Red-Orange",
    chakra: "Root / Sacral Bridge",
    senseOrgans: ["Mouth", "Nose"],
    internalOrgans: ["Fertility axis", "Tendons", "Ligaments", "Lower back"],
    underactiveEmotional: ["Numbness around desire", "Fear of embodiment", "Reduced creative responsiveness"],
    overactiveEmotional: ["Oversensitivity", "Defensiveness", "Emotionally bracing against life"],
    underactivePhysical: ["Fertility weakness", "Lower back depletion", "Neck and shoulder fragility"],
    overactivePhysical: ["Inflammation", "Scar-tissue tension", "Carpal tunnel or fibrotic strain patterns"],
  },
  D: {
    colorName: "Orange",
    chakra: "Sacral",
    senseOrgans: ["Nose"],
    internalOrgans: ["Lungs", "Digestion", "Hormone action", "Liver processing"],
    underactiveEmotional: ["Hesitation", "Fear of action", "Muted momentum"],
    overactiveEmotional: ["Anger-driven movement", "Pressure to push", "Emotional volatility in action"],
    underactivePhysical: ["Digestive sluggishness", "Constipation", "Hormonal depletion"],
    overactivePhysical: ["Digestive heat", "Food-reactivity patterns", "Breath or throat tension from force"],
  },
  "D#": {
    colorName: "Amber",
    chakra: "Sacral / Solar Bridge",
    senseOrgans: ["Nose", "Eyes"],
    internalOrgans: ["Diaphragm", "Adrenals", "Respiratory rhythm"],
    underactiveEmotional: ["Rigidity", "Difficulty adapting", "Shallow emotional breathing"],
    overactiveEmotional: ["Reactive instability", "Scattered change response", "Hypervigilance"],
    underactivePhysical: ["Restricted breath", "Low prana / vitality", "Adrenal fatigue spillover"],
    overactivePhysical: ["Stress reactivity", "Sinus aggravation", "Upper abdominal holding"],
  },
  E: {
    colorName: "Yellow",
    chakra: "Solar Plexus",
    senseOrgans: ["Eyes"],
    internalOrgans: ["Liver", "Stomach", "Lungs", "Will / digestion axis"],
    underactiveEmotional: ["Low joy", "Low agency", "Feeling trapped or directionless"],
    overactiveEmotional: ["Over-control", "Force", "Trying to manage reality through pressure"],
    underactivePhysical: ["Low drive", "Nervous-type respiratory strain", "Mineral depletion patterns"],
    overactivePhysical: ["Congestion", "Bronchial load", "Asthma-like pressure or catarrh patterns"],
  },
  F: {
    colorName: "Green",
    chakra: "Heart",
    senseOrgans: ["Tongue", "Touch"],
    internalOrgans: ["Heart", "Kidneys", "Bladder", "Pancreas", "Circulation"],
    underactiveEmotional: ["Indecisiveness", "Low replenishment", "Difficulty receiving support"],
    overactiveEmotional: ["Over-nurturing", "Emotional overconsumption", "Carrying too much relational weight"],
    underactivePhysical: ["Weak muscle tone", "Low sexual vitality", "Bladder or kidney depletion"],
    overactivePhysical: ["Chemical sensitivity", "Inflammatory stress chemistry", "Pain-load amplification"],
  },
  "F#": {
    colorName: "Teal",
    chakra: "Heart / Throat Bridge",
    senseOrgans: ["Tongue", "Ears"],
    internalOrgans: ["Brain", "Filtering systems", "Adrenal stress chemistry"],
    underactiveEmotional: ["Mental fog", "Low self-regulation", "Difficulty translating thought into action"],
    overactiveEmotional: ["Control", "Irritability", "Mental overload"],
    underactivePhysical: ["Filtering weakness", "Prostate depletion patterns", "Low sodium / adrenal resilience"],
    overactivePhysical: ["High cortisol", "High adrenaline", "Stress-driven acid load"],
  },
  G: {
    colorName: "Blue",
    chakra: "Throat",
    senseOrgans: ["Tongue", "Voice"],
    internalOrgans: ["Heart", "Liver", "Thyroid chemistry", "Neurotransmitter balance"],
    underactiveEmotional: ["Muted expression", "Low mood", "Difficulty being heard"],
    overactiveEmotional: ["Overexplaining", "Verbal pressure", "Manic or overstimulated expression"],
    underactivePhysical: ["Depressive chemistry", "Mineral imbalance", "Neck / shoulder tension"],
    overactivePhysical: ["Hormonal overstimulation", "Caffeine-like agitation", "Leg and buttock tension patterns"],
  },
  "G#": {
    colorName: "Blue-Indigo",
    chakra: "Throat / Third Eye Bridge",
    senseOrgans: ["Ears", "Inner hearing"],
    internalOrgans: ["Gall bladder", "Mineral regulation", "Complex neurotransmitter balance"],
    underactiveEmotional: ["Scarcity vigilance", "Low security", "Compensating for weakness with emotion"],
    overactiveEmotional: ["Financial fear", "Mental escalation", "Chaotic inner pressure"],
    underactivePhysical: ["Digestive weakness", "Mineral depletion", "Low energy utilization"],
    overactivePhysical: ["Schizophrenic or manic-style escalation patterns in source material", "GABA imbalance", "Gall bladder stress patterns"],
  },
  A: {
    colorName: "Indigo",
    chakra: "Third Eye",
    senseOrgans: ["Eyes", "Ears"],
    internalOrgans: ["Kidneys", "Immune reserve", "Vision axis", "Lower legs"],
    underactiveEmotional: ["Lack of direction", "Low inspiration", "Weak future vision"],
    overactiveEmotional: ["Overreach", "Idealization", "Pressure around purpose and success"],
    underactivePhysical: ["Degenerative patterns", "Eye weakness", "Knee and lower-leg depletion"],
    overactivePhysical: ["Immune stress", "Radiation / light sensitivity", "Overdriven ambition in the body"],
  },
  "A#": {
    colorName: "Violet",
    chakra: "Third Eye / Crown Bridge",
    senseOrgans: ["Eyes", "Face", "Jaw"],
    internalOrgans: ["Heart integration", "Immune support", "Detox pathways"],
    underactiveEmotional: ["Fear of conflict", "Inability to speak up", "Low receptivity to support"],
    overactiveEmotional: ["Emotional outbursts", "Excess temper", "Workaholic or self-sacrificing strain"],
    underactivePhysical: ["Detox stagnation", "Pain carrying", "Jaw / TMJ tension"],
    overactivePhysical: ["Attention-fragmentation patterns", "Immune overload", "Stress chemistry around criticism and hurt"],
  },
  B: {
    colorName: "White-Violet",
    chakra: "Crown",
    senseOrgans: ["Ears", "Fine motor system"],
    internalOrgans: ["Bowels", "Brain-body electrical regulation", "Mineral conductivity"],
    underactiveEmotional: ["Feeling unloved", "Disconnection", "Blocked completion or release"],
    overactiveEmotional: ["Martyring", "Burden-carrying", "Chronic exhaustion from over-holding life"],
    underactivePhysical: ["Hearing or ear imbalance", "Mineral transport weakness", "Fine-motor depletion"],
    overactivePhysical: ["High blood pressure patterns", "Electrical overstimulation", "Bowel stress from unresolved load"],
  },
};

export function getNoteDiscoveryProfile(note: string): NoteDiscoveryProfile {
  const normalized = NOTE_ORDER.includes(note as (typeof NOTE_ORDER)[number]) ? note : "C";
  const source = NOTE_DISCOVERY_BASE[normalized];
  const profile = getSoulScopeNoteProfile(normalized);

  return {
    note: normalized,
    emotionalTheme: profile.emotionBalanced,
    ...source,
  };
}

export function getUniqueDiscoveryProfiles(notes: string[]) {
  return Array.from(new Set(notes)).map((note) => getNoteDiscoveryProfile(note));
}
