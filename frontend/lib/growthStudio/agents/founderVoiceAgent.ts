import { AGENT_VERSION, audit } from "../base";
import { CopyAgent } from "./copyAgent";
import type { AgentContext, AgentResult, CopyRequest, FounderDraft, GrowthAgent } from "../types";

export class FounderVoiceAgent implements GrowthAgent<CopyRequest, FounderDraft> {
  readonly id = "founder-voice-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(request: CopyRequest, context: AgentContext): Promise<AgentResult<FounderDraft>> {
    const result = await new CopyAgent().execute({ ...request, founderMode: true, format: "founder" }, context);
    const unverifiableClaims = request.facts.filter((fact) => /\b(?:I|my|we|our)\b/i.test(fact));
    result.output.createdBy = this.id;
    result.output.approvalState = "human_approval";
    const output: FounderDraft = {
      draft: result.output,
      unverifiableClaims,
      requiredFounderConfirmations: [
        "Confirm every first-person fact and personal experience.",
        "Confirm this wording sounds like the founder's real voice.",
        "Confirm no qualification, partnership, hardship, testimonial, or milestone was invented.",
      ],
    };
    return {
      status: "needs_human_review",
      output,
      issues: unverifiableClaims.length ? [{ code: "founder_fact_confirmation", message: "First-person claims require founder confirmation.", risk: "high" }] : [],
      commands: [{ kind: "request_approval", payload: { contentId: result.output.id, reviewer: "founder" }, requiresHumanApproval: true, permission: "content:approve_founder" }],
      audit: audit(this.id, context, "founder-voice-v1", request),
    };
  }
}
