function hash32(value: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
    hash ^= hash >>> 13;
  }
  return hash >>> 0;
}

export function stableUuid(...parts: string[]): string {
  const value = parts.join("|");
  const chunks = [
    hash32(value, 2166136261),
    hash32(value, 2246822519),
    hash32(value, 3266489917),
    hash32(value, 668265263),
  ].map((chunk) => chunk.toString(16).padStart(8, "0"));
  const hex = chunks.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
