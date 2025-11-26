type ChakraKey = "root" | "sacral" | "solar" | "heart" | "throat" | "thirdEye" | "crown";

const chakraMap: Record<
  ChakraKey,
  {
    name: string;
    tone: string;
    color: string;
    underMsg: string;
    overMsg: string;
    practice: string;
    affirmation: string;
    breath: string;
  }
> = {
  root: {
    name: "Root",
    tone: "C",
    color: "Red",
    underMsg: "You may be feeling unsafe or disconnected from your body.",
    overMsg: "You may be stuck in survival mode or hypervigilance.",
    practice: "Grounding breathwork with deep exhales.",
    affirmation: "I am safe in my body.",
    breath: "Box breathing",
  },
  sacral: {
    name: "Sacral",
    tone: "D",
    color: "Orange",
    underMsg: "You might be emotionally blocked or creatively numb.",
    overMsg: "You may be over-identifying with pleasure or drama.",
    practice: "Hip movement & breath into pelvis.",
    affirmation: "I honor my feelings and flow.",
    breath: "Wave breath",
  },
  solar: {
    name: "Solar Plexus",
    tone: "E",
    color: "Yellow",
    underMsg: "Low self-worth or indecision may be showing up.",
    overMsg: "You might be controlling or overexerting force.",
    practice: "Fire breath + standing core activation.",
    affirmation: "I claim my power calmly.",
    breath: "Fire breath",
  },
  heart: {
    name: "Heart",
    tone: "F",
    color: "Green",
    underMsg: "You may be emotionally withdrawn or walled off.",
    overMsg: "You may give too much and lose yourself.",
    practice: "Heart-opening breath with open arms.",
    affirmation: "It's safe to feel.",
    breath: "Coherent breathing",
  },
  throat: {
    name: "Throat",
    tone: "G",
    color: "Blue",
    underMsg: "You may be afraid to express your truth.",
    overMsg: "You may be talking without deep alignment.",
    practice: "Humming & vocal toning.",
    affirmation: "My voice is clear and true.",
    breath: "Humming exhale",
  },
  thirdEye: {
    name: "Third Eye",
    tone: "A",
    color: "Indigo",
    underMsg: "You may be disconnected from intuition.",
    overMsg: "You may be overanalyzing or overly psychic.",
    practice: "Eyes-closed breath focus behind forehead.",
    affirmation: "I trust my inner vision.",
    breath: "Nadi Shodhana",
  },
  crown: {
    name: "Crown",
    tone: "B",
    color: "Violet",
    underMsg: "You may feel disconnected from purpose.",
    overMsg: "You may be spiritually ungrounded.",
    practice: "Stillness + listening.",
    affirmation: "I am connected to all.",
    breath: "Silent breath",
  },
};

export type ChakraInterpretation = {
  chakra: string;
  state: "underactive" | "overactive" | "balanced";
  message: string;
  remedy: {
    tone: string;
    breath: string;
    practice: string;
    affirmation: string;
  };
};

export function analyzeChakras(data: Record<ChakraKey, number>): ChakraInterpretation[] {
  return Object.entries(data).map(([key, value]) => {
    const chakraKey = key as ChakraKey;
    const config = chakraMap[chakraKey];
    const state = value < 35 ? "underactive" : value > 80 ? "overactive" : "balanced";
    const message =
      state === "underactive"
        ? config.underMsg
        : state === "overactive"
        ? config.overMsg
        : "This center is flowing in harmony.";

    return {
      chakra: config.name,
      state,
      message,
      remedy: {
        tone: config.tone,
        breath: config.breath,
        practice: config.practice,
        affirmation: config.affirmation,
      },
    };
  });
}
