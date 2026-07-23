import { AGENT_VERSION, audit, statusFromIssues } from "../base";
import { inspectDraft, scoreBrand, similarity } from "../policy";
import type { AgentContext, AgentResult, BrandReview, ContentDraft, GrowthAgent, ReviewIssue } from "../types";

export class BrandGuardian implements GrowthAgent<ContentDraft, BrandReview> {
  readonly id = "brand-guardian" as const;
  readonly version = AGENT_VERSION;

  async execute(draft: ContentDraft, context: AgentContext): Promise<AgentResult<BrandReview>> {
    const issues: ReviewIssue[] = inspectDraft(draft);
    const duplicate = context.memory.previousContent.find((item) =>
      similarity(`${draft.hook} ${draft.caption}`, `${item.hook} ${item.caption}`) >= 0.72
    );
    if (duplicate) {
      issues.push({
        code: "repetitive_content",
        message: `This draft is too similar to earlier content ${duplicate.id}.`,
        risk: "high",
      });
    }
    if (!context.campaign.approvedCtas.includes(draft.cta)) {
      issues.push({
        code: "unapproved_cta",
        message: `“${draft.cta}” is not an approved CTA for this campaign.`,
        risk: "high",
        field: "cta",
        suggestedReplacement: context.campaign.approvedCtas[0],
      });
    }

    const output: BrandReview = {
      approved: issues.length === 0,
      score: scoreBrand(issues),
      issues,
    };
    return { status: statusFromIssues(issues), output, issues, commands: [], audit: audit(this.id, context, "brand-review-v1", draft) };
  }
}
