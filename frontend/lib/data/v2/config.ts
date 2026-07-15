export type SoulScopeDataModelVersion = "v1" | "v2";

export const SOULSCOPE_DATA_MODEL_VERSION: SoulScopeDataModelVersion =
  process.env.NEXT_PUBLIC_SOULSCOPE_DATA_MODEL_VERSION === "v1" ? "v1" : "v2";

export function requireV2DataModel(): void {
  if (SOULSCOPE_DATA_MODEL_VERSION !== "v2") {
    throw new Error("This branch requires NEXT_PUBLIC_SOULSCOPE_DATA_MODEL_VERSION=v2.");
  }
}
