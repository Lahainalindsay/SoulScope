import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { coreFrequency, coreChakra, missing } = req.body || {};

  const coreNoteMap: Record<string, string> = {
    Root: "C",
    Sacral: "D",
    "Solar Plexus": "E",
    Heart: "F",
    Throat: "G",
    "Third Eye": "A",
    Crown: "B",
  };

  res.status(200).json({
    coreFrequency,
    coreNote: coreNoteMap[coreChakra] ? `${coreNoteMap[coreChakra]} note` : "Unknown",
    coreChakra,
    missing,
    suggestion: {
      listen: [
        `${coreFrequency} Hz`,
        ...(missing?.slice(0, 1)?.map((gap: any) => {
          const [start, end] = Array.isArray(gap.range) ? gap.range : [gap.range];
          return `${start}-${end} Hz`;
        }) || []),
      ],
      see: "Harmonic Glyph Visualization",
      breathe: "5-5-5 technique",
    },
  });
}
