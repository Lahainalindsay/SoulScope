import type { CampaignDefinition, CampaignMemory, CampaignPhase, CampaignPhaseId, EditorialPlanItem } from "./types";
import { GROWTH_STUDIO_TIMEZONE } from "./types";

export const FOUNDING_500_CAMPAIGN: CampaignDefinition = {
  id: "founding-500-2026",
  name: "The Founding 500",
  communityName: "Founding Resonance Circle",
  timezone: GROWTH_STUDIO_TIMEZONE,
  launchDate: "2026-07-28",
  campaignEndsOn: "2026-08-10",
  objective: "Invite and qualify the first 500 real SoulScope members while building trust through clear, non-diagnostic education.",
  invitation: "Become one of the first 500 people to help shape SoulScope.",
  promise: "Qualified Founding Members receive one year of SoulScope access at no cost and a permanent Founder Number from #001 through #500.",
  qualificationCriteria: [
    "Create an account.",
    "Complete onboarding.",
    "Complete at least one valid Resonance Scan.",
    "Answer the short feedback questionnaire.",
    "Accept the Founding Member terms.",
  ],
  approvedCtas: ["Join the Founding 500", "See How SoulScope Works", "Learn More", "Share Feedback"],
  successMetrics: ["qualified_founders", "first_scans_completed", "feedback_completed", "qualified_referrals", "retained_users"],
  stopConditions: [
    "Publishing error rate exceeds the configured safety threshold.",
    "Offer or qualification count cannot be verified.",
    "A material privacy, legal, platform-policy, or security issue is detected.",
    "Founder Number inventory reaches zero.",
  ],
  phases: [
    {
      id: "prelaunch",
      startsOn: "2026-07-22",
      endsOn: "2026-07-27",
      objective: "Establish the product, privacy, Resonance Signature, and Founding 500 invitation.",
      narrative: ["recognition", "voice-first explanation", "reflection not diagnosis", "privacy", "signature", "invitation"],
      allowedCtas: ["See How SoulScope Works", "Learn More"],
    },
    {
      id: "launch",
      startsOn: "2026-07-28",
      endsOn: "2026-07-28",
      objective: "Open verified Founding 500 enrollment with one clear destination.",
      narrative: ["enrollment open", "qualification explained", "one-year access", "human feedback"],
      allowedCtas: ["Join the Founding 500", "See How SoulScope Works"],
    },
    {
      id: "week_one",
      startsOn: "2026-07-29",
      endsOn: "2026-08-03",
      objective: "Move from curiosity through explanation, credibility, privacy, and product experience.",
      narrative: ["curiosity", "explanation", "credibility", "privacy", "experience", "invitation"],
      allowedCtas: ["Join the Founding 500", "See How SoulScope Works"],
    },
    {
      id: "week_two",
      startsOn: "2026-08-04",
      endsOn: "2026-08-10",
      objective: "Show verified participation and learning, then close the initial campaign honestly.",
      narrative: ["participation", "learning", "progress", "education", "approved feedback", "final invitation"],
      allowedCtas: ["Join the Founding 500", "Share Feedback"],
    },
    {
      id: "post_campaign",
      startsOn: "2026-08-11",
      objective: "Onboard, learn from, and retain Founding Members.",
      narrative: ["onboarding", "feedback", "verified milestones", "product updates", "education"],
      allowedCtas: ["Share Feedback", "Learn More"],
    },
  ],
  audiences: [
    { id: "reflective-explorer", name: "Reflective Explorer", description: "Wants insight without another questionnaire.", nonSensitiveInterests: ["journaling", "self-awareness", "reflection"] },
    { id: "wellness-curious-skeptic", name: "Wellness-Curious Skeptic", description: "Open to reflection tools and careful about unsupported claims.", nonSensitiveInterests: ["biofeedback", "wellness education", "mindfulness"] },
    { id: "pattern-tracker", name: "Pattern Tracker", description: "Interested in observing movement across time.", nonSensitiveInterests: ["quantified self", "personal tracking", "journaling"] },
    { id: "creative-technologist", name: "Creative Technologist", description: "Interested in voice, design, signals, and human-centered technology.", nonSensitiveInterests: ["voice technology", "creative technology", "human-centered AI"] },
    { id: "growth-practitioner", name: "Personal Growth Practitioner", description: "Already reflects and wants another private lens.", nonSensitiveInterests: ["personal growth", "reflection", "mindfulness"] },
  ],
};

export function resolveCampaignPhase(date: string, phases: CampaignPhase[] = FOUNDING_500_CAMPAIGN.phases): CampaignPhase {
  const day = date.slice(0, 10);
  const matching = phases.find((phase) => day >= phase.startsOn && (!phase.endsOn || day <= phase.endsOn));
  if (matching) return matching;
  if (day < phases[0].startsOn) return phases[0];
  return phases[phases.length - 1];
}

export function createInitialCampaignMemory(now = "2026-07-22T09:00:00-10:00"): CampaignMemory {
  return {
    currentCampaignId: FOUNDING_500_CAMPAIGN.id,
    currentPhaseId: resolveCampaignPhase(now).id,
    previousContent: [],
    scheduledContent: [],
    activeCtas: ["See How SoulScope Works"],
    usedThemes: [],
    usedAssetIds: [],
    experiments: [],
    learnings: [],
    foundingMemberCount: 0,
    reservedFounderCount: 0,
    unansweredInteractionCount: 0,
    updatedAt: now,
  };
}

const planSeeds: Array<Omit<EditorialPlanItem, "date" | "phaseId">> = [
  { platform: "instagram", format: "carousel", pillar: "Observe Your Inner World", objective: "Introduce the brand promise", hookDirection: "Clarity is not always something you find outside yourself.", cta: "See How SoulScope Works" },
  { platform: "facebook", format: "text", pillar: "Reflection, Not Diagnosis", objective: "Set a credible boundary", hookDirection: "A lens, not a label.", cta: "Learn More" },
  { platform: "instagram", format: "reel", pillar: "Why SoulScope Begins With Voice", objective: "Explain the starting signal", hookDirection: "Your voice carries context—even when you are not trying to explain it.", cta: "See How SoulScope Works" },
  { platform: "instagram", format: "static", pillar: "Resonance Signature", objective: "Introduce the defining visual", hookDirection: "Your voice. Your pattern. Your signature.", cta: "Learn More" },
  { platform: "facebook", format: "founder", pillar: "Building SoulScope", objective: "Build founder trust", hookDirection: "Why I chose recognition over diagnosis.", cta: "Learn More" },
  { platform: "instagram", format: "story", pillar: "Private by Design", objective: "Explain privacy boundaries", hookDirection: "What private by design means here.", cta: "See How SoulScope Works" },
  { platform: "instagram", format: "carousel", pillar: "The Founding 500", objective: "Preview the invitation", hookDirection: "The first 500 will help shape what comes next.", cta: "Learn More" },
];

export function buildLaunchCalendar(): EditorialPlanItem[] {
  const start = new Date("2026-07-22T12:00:00Z");
  const end = new Date("2026-08-10T12:00:00Z");
  const items: EditorialPlanItem[] = [];
  for (let cursor = new Date(start), index = 0; cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1), index += 1) {
    const date = cursor.toISOString().slice(0, 10);
    const seed = planSeeds[index % planSeeds.length];
    const phase = resolveCampaignPhase(date);
    const cta = phase.allowedCtas.includes(seed.cta) ? seed.cta : phase.allowedCtas[0];
    items.push({ ...seed, date, phaseId: phase.id, cta });
  }
  return items;
}

export const CAMPAIGN_PHASE_IDS: CampaignPhaseId[] = ["prelaunch", "launch", "week_one", "week_two", "post_campaign"];
