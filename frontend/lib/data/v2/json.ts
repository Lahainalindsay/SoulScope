import type { JsonObject, JsonValue } from "./types";

export function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, toJsonValue(item)]),
    );
  }
  return String(value);
}

export function toJsonObject(value: unknown): JsonObject {
  const serialized = toJsonValue(value);
  return serialized && !Array.isArray(serialized) && typeof serialized === "object" ? serialized : { value: serialized };
}
