import { AGENT_VERSION, audit } from "../base";
import type { AdProposal, AgentContext, AgentResult, ContentDraft, GrowthAgent } from "../types";

export interface AdsRequest {
  platform: "meta" | "google";
  objective: string;
  audienceHypothesis: string;
  creativeVariants: ContentDraft[];
  dailyBudgetCents: number;
}

export class AdsAgent implements GrowthAgent<AdsRequest, AdProposal> {
  readonly id = "ads-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(request: AdsRequest, context: AgentContext): Promise<AgentResult<AdProposal>> {
    const issues = request.dailyBudgetCents <= 0
      ? [{ code: "invalid_budget", message: "A proposed daily budget must be greater than zero.", risk: "high" as const }]
      : [];
    const output: AdProposal = {
      campaignId: context.campaign.id,
      platform: request.platform,
      objective: request.objective,
      audienceHypothesis: request.audienceHypothesis,
      creativeVariants: request.creativeVariants,
      dailyBudgetCents: request.dailyBudgetCents,
      activationAllowed: false,
      approvalState: "human_approval",
    };
    return {
      status: issues.length ? "blocked" : "needs_human_review",
      output,
      issues,
      commands: issues.length ? [] : [{ kind: "activate_ad", payload: { campaignId: context.campaign.id, dailyBudgetCents: request.dailyBudgetCents }, requiresHumanApproval: true, permission: "ads:activate" }],
      audit: audit(this.id, context, "ad-proposal-v1", request),
    };
  }
}
