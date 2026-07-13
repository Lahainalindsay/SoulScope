import type {
  SystemDimension,
  SystemDimensionName,
  UserResultDomain,
  UserResultDomainName,
  UserResultFunctionalState,
} from "../systemDimensions";
import type { DomainResultV2 } from "./types";

const DOMAIN_NAME_MAP: Record<string, UserResultDomainName> = {
  energy_vitality: "Energy & Vitality",
  recovery_restoration: "Recovery & Restoration",
  focus_mental_demand: "Focus & Mental Load",
  expression_communication: "Communication & Clarity",
  emotional_flexibility: "Emotional Expression",
  regulation_stability: "Regulation",
  adaptability_direction: "Direction & Adaptability",
};

const DIMENSION_NAME_MAP: Record<string, SystemDimensionName> = {
  energy_vitality: "Vitality",
  recovery_restoration: "Recovery",
  focus_mental_demand: "Cognitive Load",
  expression_communication: "Expression",
  regulation_stability: "Regulation",
  adaptability_direction: "Adaptability",
};

function functionalState(domain: DomainResultV2): UserResultFunctionalState {
  if (domain.state === "working_hard") return "Working Hard";
  if (domain.state === "asking_for_support") return "Asking for Support";
  if (domain.state === "available") return domain.orientation === "demand" ? "Readily Available" : "Readily Available";
  return "Recovering";
}

export function adaptDomainsToLegacy(domains: DomainResultV2[]): UserResultDomain[] {
  return domains.flatMap((domain) => {
    const title = DOMAIN_NAME_MAP[domain.domainId];
    if (!title) return [];
    const state = functionalState(domain);
    return [{
      title,
      score: domain.score,
      activityLevel: domain.score >= 62 ? "High" : domain.score <= 38 ? "Low" : "Moderate",
      functionalState: state,
      currentPattern: domain.userFacingSummary,
      thisCouldExpressAs: [domain.userFacingSummary],
      itCanAlsoShowUpAs: [],
      supportiveReframe: domain.orientation === "demand" ? "Demand is current-state information, not a fixed trait." : "Availability can change from scan to scan.",
      signalSources: domain.contributingObservationIds,
    }];
  });
}

function band(score: number): SystemDimension["band"] {
  if (score <= 20) return "Extremely Low";
  if (score <= 40) return "Low";
  if (score < 67) return "Balanced";
  if (score < 85) return "High";
  return "Extremely High";
}

export function adaptDimensionsToLegacy(domains: DomainResultV2[]): SystemDimension[] {
  return domains.flatMap((domain) => {
    const name = DIMENSION_NAME_MAP[domain.domainId];
    if (!name) return [];
    return [{
      name,
      score: domain.score,
      level: domain.score >= 67 ? "High" : domain.score <= 40 ? "Low" : "Medium",
      band: band(domain.score),
      state: domain.state === "balanced" ? "balanced" : domain.state === "available" ? "available" : "requesting attention",
      derivedFrom: domain.contributingObservationIds.join(", "),
      interpretation: domain.userFacingSummary,
      attention: domain.state === "asking_for_support" || domain.state === "working_hard" ? domain.userFacingSummary : undefined,
    }];
  });
}
