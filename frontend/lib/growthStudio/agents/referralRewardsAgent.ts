import { AGENT_VERSION, audit } from "../base";
import type { AgentContext, AgentResult, GrowthAgent, ReferralEvent, RewardProposal, ReviewIssue } from "../types";

export class ReferralRewardsAgent implements GrowthAgent<ReferralEvent, RewardProposal> {
  readonly id = "referral-rewards-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(event: ReferralEvent, context: AgentContext): Promise<AgentResult<RewardProposal>> {
    const issues: ReviewIssue[] = [];
    let blockedReason: string | undefined;
    if (event.referrerUserId === event.referredUserId) blockedReason = "Self-referrals are not eligible.";
    else if (event.previouslyProcessedEventIds.includes(event.id)) blockedReason = "This referral event was already processed.";
    else if (event.eventType !== "qualified") blockedReason = "Rewards are proposed only after the referred user qualifies.";
    else if (event.verificationMode === "unavailable") blockedReason = "The action cannot be verified.";

    if (blockedReason) issues.push({ code: "referral_ineligible", message: blockedReason, risk: "high" });
    const ledgerKey = `${event.campaignId}:${event.referrerUserId}:${event.referredUserId}:${event.eventType}`;
    const output: RewardProposal = {
      eligible: !blockedReason,
      blockedReason,
      ledgerKey,
      rewardDefinitionId: blockedReason ? undefined : "qualified-referral-1",
      requiresAdminApproval: true,
    };
    return {
      status: blockedReason ? "blocked" : "needs_human_review",
      output,
      issues,
      commands: blockedReason ? [] : [{
        kind: "issue_reward",
        payload: { ledgerKey, rewardDefinitionId: output.rewardDefinitionId },
        requiresHumanApproval: true,
        permission: "rewards:approve",
      }],
      audit: audit(this.id, context, "referral-integrity-v1", event),
    };
  }
}
