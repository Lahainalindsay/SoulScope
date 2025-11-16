import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    coreFrequency: 204.3,
    coreNote: "G#3 / Ab3",
    missing: [{ range: "392–410 Hz", chakra: "Throat", note: "G4" }],
    suggestion: {
      listen: ["204.3 Hz", "396 Hz"],
      see: "Harmonic Glyph SVG",
      breathe: "5-5-5 technique",
    },
  });
}
