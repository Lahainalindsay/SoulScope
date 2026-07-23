import { AGENT_VERSION, audit, statusFromIssues } from "../base";
import { inspectCopy } from "../policy";
import type { AgentContext, AgentResult, ComplianceReview, ContentDraft, GrowthAgent, ReviewIssue } from "../types";

export class ComplianceSafetyAgent implements GrowthAgent<ContentDraft, ComplianceReview> {
  readonly id = "compliance-safety-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(draft: ContentDraft, context: AgentContext): Promise<AgentResult<ComplianceReview>> {
    const issues: ReviewIssue[] = inspectCopy([draft.hook, draft.caption, ...draft.claims].join("\n"));
    const requiredDisclosures: string[] = [];

    if (/first 500|founding 500|free|reward|bonus|gift/i.test(`${draft.hook} ${draft.caption}`)) {
      requiredDisclosures.push("Eligibility, qualification, availability, and reward terms apply.");
      if (!draft.disclosures.some((value) => /terms|eligib|qualif|availability/i.test(value))) {
        issues.push({
          code: "missing_offer_disclosure",
          message: "Founding-member or reward copy must link to clear eligibility and availability terms.",
          risk: "high",
          field: "disclosures",
        });
      }
    }
    if (/remaining|left|spots/i.test(`${draft.hook} ${draft.caption}`) && context.memory.foundingMemberCount === 0) {
      issues.push({
        code: "unverified_scarcity",
        message: "Availability language needs a live verified count; zero data cannot support a scarcity claim.",
        risk: "critical",
      });
    }
    if (draft.platform === "instagram" || draft.platform === "facebook") {
      requiredDisclosures.push("This content is not medical or psychological advice.");
    }

    const output: ComplianceReview = {
      approved: issues.length === 0,
      issues,
      requiredDisclosures,
    };
    return { status: statusFromIssues(issues), output, issues, commands: [], audit: audit(this.id, context, "compliance-review-v1", draft) };
  }
}
