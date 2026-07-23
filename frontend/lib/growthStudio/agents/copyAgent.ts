import { AGENT_VERSION, audit, safeId } from "../base";
import type { AgentContext, AgentResult, ContentDraft, CopyRequest, GrowthAgent } from "../types";

function platformCaption(request: CopyRequest) {
  const fact = request.facts[0] ?? "SoulScope is a private reflection instrument.";
  const middle = request.facts.slice(1).join(" ");
  const base = `${fact} ${middle}`.trim();
  if (request.format === "story") return `${base}\n\n${request.cta}`;
  if (request.platform === "facebook") return `${base}\n\nSoulScope offers a lens—not a label.\n\n${request.cta}`;
  return `${base}\n\nRecognition begins with noticing.\n\n${request.cta}`;
}

export class CopyAgent implements GrowthAgent<CopyRequest, ContentDraft> {
  readonly id = "copy-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(request: CopyRequest, context: AgentContext): Promise<AgentResult<ContentDraft>> {
    const hook = request.pillar === "Resonance Signature"
      ? "Your voice. Your pattern. Your signature."
      : request.pillar === "The Founding 500"
        ? context.campaign.invitation
        : "Observe your inner world.";
    const draft: ContentDraft = {
      id: safeId(context.campaign.id, request.platform, request.phaseId, request.pillar, String(context.memory.previousContent.length + 1)),
      campaignId: context.campaign.id,
      phaseId: request.phaseId,
      platform: request.platform,
      format: request.format,
      pillar: request.pillar,
      objective: request.objective,
      audienceId: request.audienceId,
      hook,
      caption: platformCaption(request),
      cta: request.cta,
      hashtags: request.platform === "instagram" ? ["#SoulScope", "#SelfReflection", "#ResonanceSignature"] : [],
      altText: ["reel", "carousel", "static", "story", "ad"].includes(request.format)
        ? "SoulScope editorial graphic with restrained cyan signal detail on a deep navy field."
        : undefined,
      disclosures: request.pillar === "The Founding 500" ? ["Eligibility, qualification, availability, and reward terms apply."] : [],
      approvalState: "draft",
      syntheticCustomerDepiction: false,
      claims: request.facts,
      createdBy: this.id,
      version: 1,
    };
    return {
      status: "needs_human_review",
      output: draft,
      issues: [],
      commands: [{ kind: "save_draft", payload: { contentId: draft.id }, requiresHumanApproval: true, permission: "content:write" }],
      audit: audit(this.id, context, "platform-copy-v1", request),
    };
  }
}
