export const SIGNATURE_COLORS = {
  background: "#01040A",
  deepField: "#06101C",
  cogPrimary: "#25A8FF",
  cogSecondary: "#59C7FF",
  regPrimary: "#11E8E2",
  regSecondary: "#72FFF5",
  capPrimary: "#BFF9F0",
  capSecondary: "#F3FFFF",
  expPrimary: "#9B5CFF",
  expSecondary: "#C998FF",
  convergence: "#F5FFFF",
  guide: "#29465A",
  unresolved: "#5C6471",
} as const;

export const CONSTELLATION_COLORS = {
  COG: { primary: SIGNATURE_COLORS.cogPrimary, secondary: SIGNATURE_COLORS.cogSecondary },
  REG: { primary: SIGNATURE_COLORS.regPrimary, secondary: SIGNATURE_COLORS.regSecondary },
  CAP: { primary: SIGNATURE_COLORS.capPrimary, secondary: SIGNATURE_COLORS.capSecondary },
  EXP: { primary: SIGNATURE_COLORS.expPrimary, secondary: SIGNATURE_COLORS.expSecondary },
} as const;
