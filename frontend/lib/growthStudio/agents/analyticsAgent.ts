import { AGENT_VERSION, audit } from "../base";
import type { AgentContext, AgentResult, AnalyticsInsight, FunnelMetrics, GrowthAgent } from "../types";

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

export class AnalyticsAgent implements GrowthAgent<FunnelMetrics, AnalyticsInsight> {
  readonly id = "analytics-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(metrics: FunnelMetrics, context: AgentContext): Promise<AgentResult<AnalyticsInsight>> {
    const funnelRates = {
      impressionToProfile: rate(metrics.profileVisits, metrics.impressions),
      profileToLanding: rate(metrics.landingPageVisits, metrics.profileVisits),
      landingToSignup: rate(metrics.signups, metrics.landingPageVisits),
      accountToOnboarding: rate(metrics.onboardingCompleted, metrics.accountsCreated),
      onboardingToFirstScan: rate(metrics.firstScansCompleted, metrics.onboardingCompleted),
      scanToFeedback: rate(metrics.feedbackCompleted, metrics.firstScansCompleted),
      signupToRetention: rate(metrics.retainedUsers, metrics.signups),
    };
    const recommendations: string[] = [];
    if (funnelRates.landingToSignup !== null && funnelRates.landingToSignup < 0.1) recommendations.push("Review landing-page promise, proof, and CTA continuity before increasing traffic.");
    if (funnelRates.onboardingToFirstScan !== null && funnelRates.onboardingToFirstScan < 0.5) recommendations.push("Investigate onboarding-to-scan friction before expanding acquisition spend.");
    if (funnelRates.scanToFeedback !== null && funnelRates.scanToFeedback < 0.4) recommendations.push("Shorten or reposition the first feedback request.");
    const insufficientData = Object.entries(funnelRates).filter(([, value]) => value === null).map(([key]) => key);
    const output: AnalyticsInsight = {
      funnelRates,
      vanityMetrics: ["impressions", "profileVisits"],
      businessOutcomes: ["firstScansCompleted", "feedbackCompleted", "qualifiedReferrals", "retainedUsers"],
      recommendations,
      insufficientData,
    };
    return { status: "proposed", output, issues: [], commands: [], audit: audit(this.id, context, "funnel-analysis-v1", metrics) };
  }
}
