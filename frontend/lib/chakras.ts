export type ChakraConfig = {
  name: string;
  range: [number, number];
  color: string;
  accent: string;
  meaning: string;
};

export const chakraData: ChakraConfig[] = [
  { name: "Root", range: [63, 250], color: "#B71C1C", accent: "#FF6B6B", meaning: "Grounding, survival, security" },
  { name: "Sacral", range: [250, 500], color: "#F57C00", accent: "#FFB347", meaning: "Creativity, sexuality, flow" },
  { name: "Solar Plexus", range: [500, 1000], color: "#FBC02D", accent: "#FFE066", meaning: "Confidence, identity, power" },
  { name: "Heart", range: [1000, 2000], color: "#388E3C", accent: "#8BC34A", meaning: "Love, compassion, connection" },
  { name: "Throat", range: [2000, 4000], color: "#1976D2", accent: "#64B5F6", meaning: "Truth, expression, authenticity" },
  { name: "Third Eye", range: [4000, 6000], color: "#512DA8", accent: "#9C6BFF", meaning: "Intuition, vision, inner knowing" },
  { name: "Crown", range: [6000, 8000], color: "#9C27B0", accent: "#E1BEE7", meaning: "Oneness, divine connection, surrender" },
];

export const chakraSlugs = chakraData.map((chakra) => chakra.name.toLowerCase().replace(/\s+/g, "-"));
