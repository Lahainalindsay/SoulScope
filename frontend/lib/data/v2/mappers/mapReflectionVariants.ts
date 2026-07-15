import type { ReflectionStyle, ReflectionVariantInsert } from "../types";
import { stableUuid } from "../stableId";
import { toJsonObject } from "../json";
import type { V2MappingContext } from "./context";

export function toReflectionStyle(style: string): ReflectionStyle {
  const normalized = style.toLowerCase();
  if (normalized === "direct" || normalized === "supportive" || normalized === "insight") return normalized;
  throw new Error(`Unsupported reflection style: ${style}`);
}

export function mapReflectionVariants(context: V2MappingContext): ReflectionVariantInsert[] {
  return context.report.storyCandidates.map((variant) => {
    const style = toReflectionStyle(variant.style);
    return {
      id: stableUuid(context.scanId, "reflection", style),
      scan_id: context.scanId,
      user_id: context.userId,
      style,
      title: variant.title,
      summary: variant.summary,
      content: toJsonObject({
        strongestResources: variant.strongestResources,
        areasWorkingHard: variant.areasWorkingHard,
        areasAskingForSupport: variant.areasAskingForSupport,
      }),
    };
  });
}
