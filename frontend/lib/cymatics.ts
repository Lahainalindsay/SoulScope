export type CymaticAssetRecord = {
  slug: string;
  note: string | null;
  sourcePath: string;
  publicImagePath: string;
  status: "source_screenshot" | "cropped_ready";
  sortOrder: number;
  originalFilename: string;
};

export type CymaticReference = {
  note: string;
  status: "mapped" | "master-chart" | "pending-mapping";
  imagePath?: string;
  assetSlug?: string;
  availableSourceAssetCount: number;
};

export const CYMATIC_MASTER_CHART = {
  slug: "cymatic-note-chart",
  imagePath: "/cymatics/piano-cymatics.png",
  label: "Cymatic note chart",
};

export const CYMATIC_SOURCE_ASSETS: CymaticAssetRecord[] = [
  {
    slug: "cymatic-source-01",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-01.png",
    publicImagePath: "/cymatics/source/cymatic-source-01.png",
    status: "source_screenshot",
    sortOrder: 1,
    originalFilename: "Screenshot 2026-03-23 7.35.00 AM.png",
  },
  {
    slug: "cymatic-source-02",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-02.png",
    publicImagePath: "/cymatics/source/cymatic-source-02.png",
    status: "source_screenshot",
    sortOrder: 2,
    originalFilename: "Screenshot 2026-03-23 7.35.07 AM.png",
  },
  {
    slug: "cymatic-source-03",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-03.png",
    publicImagePath: "/cymatics/source/cymatic-source-03.png",
    status: "source_screenshot",
    sortOrder: 3,
    originalFilename: "Screenshot 2026-03-23 7.35.17 AM.png",
  },
  {
    slug: "cymatic-source-04",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-04.png",
    publicImagePath: "/cymatics/source/cymatic-source-04.png",
    status: "source_screenshot",
    sortOrder: 4,
    originalFilename: "Screenshot 2026-03-23 7.35.39 AM.png",
  },
  {
    slug: "cymatic-source-05",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-05.png",
    publicImagePath: "/cymatics/source/cymatic-source-05.png",
    status: "source_screenshot",
    sortOrder: 5,
    originalFilename: "Screenshot 2026-03-23 7.35.44 AM.png",
  },
  {
    slug: "cymatic-source-06",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-06.png",
    publicImagePath: "/cymatics/source/cymatic-source-06.png",
    status: "source_screenshot",
    sortOrder: 6,
    originalFilename: "Screenshot 2026-03-23 7.35.51 AM.png",
  },
  {
    slug: "cymatic-source-07",
    note: null,
    sourcePath: "/cymatics/source/cymatic-source-07.png",
    publicImagePath: "/cymatics/source/cymatic-source-07.png",
    status: "source_screenshot",
    sortOrder: 7,
    originalFilename: "Screenshot 2026-03-23 7.35.57 AM.png",
  },
];

const NOTE_CYMATIC_IMAGE_MAP: Partial<Record<string, { assetSlug: string; imagePath: string }>> = {
  C: {
    assetSlug: "cymatic-note-c",
    imagePath: "/cymatics/notes/C.png",
  },
  D: {
    assetSlug: "cymatic-note-d",
    imagePath: "/cymatics/notes/D.png",
  },
  E: {
    assetSlug: "cymatic-note-e",
    imagePath: "/cymatics/notes/E.png",
  },
  F: {
    assetSlug: "cymatic-note-f",
    imagePath: "/cymatics/notes/F.png",
  },
  G: {
    assetSlug: "cymatic-note-g",
    imagePath: "/cymatics/notes/G.png",
  },
  A: {
    assetSlug: "cymatic-note-a",
    imagePath: "/cymatics/notes/A.png",
  },
  B: {
    assetSlug: "cymatic-note-b",
    imagePath: "/cymatics/notes/B.png",
  },
};

export function buildCymaticReference(note?: string | null): CymaticReference | undefined {
  if (!note) {
    return undefined;
  }

  const mappedAsset = NOTE_CYMATIC_IMAGE_MAP[note];

  if (mappedAsset) {
    return {
      note,
      status: "mapped",
      imagePath: mappedAsset.imagePath,
      assetSlug: mappedAsset.assetSlug,
      availableSourceAssetCount: CYMATIC_SOURCE_ASSETS.length,
    };
  }

  return {
    note,
    status: "master-chart",
    imagePath: CYMATIC_MASTER_CHART.imagePath,
    assetSlug: CYMATIC_MASTER_CHART.slug,
    availableSourceAssetCount: CYMATIC_SOURCE_ASSETS.length,
  };
}
