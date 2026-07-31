export const SIGNATURE_COLORS = {
  background: "#020509",
  deepField: "#06111B",
  cogPrimary: "#20D7FF",
  cogSecondary: "#377BFF",
  regPrimary: "#58FFF1",
  regSecondary: "#15B9E8",
  capPrimary: "#D9FFF8",
  capSecondary: "#7FE9E2",
  expPrimary: "#B879FF",
  expSecondary: "#705CFF",
  convergence: "#F4FFFF",
  guide: "#547080",
  unresolved: "#6E7582",
} as const;

export const CONSTELLATION_COLORS = {
  COG: { primary: SIGNATURE_COLORS.cogPrimary, secondary: SIGNATURE_COLORS.cogSecondary },
  REG: { primary: SIGNATURE_COLORS.regPrimary, secondary: SIGNATURE_COLORS.regSecondary },
  CAP: { primary: SIGNATURE_COLORS.capPrimary, secondary: SIGNATURE_COLORS.capSecondary },
  EXP: { primary: SIGNATURE_COLORS.expPrimary, secondary: SIGNATURE_COLORS.expSecondary },
} as const;
