import { audit } from "./base";
import { GROWTH_POLICY_VERSION } from "./policy";
import { BrandGuardian } from "./agents/brandGuardian";
import { ComplianceSafetyAgent } from "./agents/complianceSafetyAgent";
import { ContentStrategist, type ContentStrategyRequest } from "./agents/contentStrategist";
import { CopyAgent } from "./agents/copyAgent";
import type {
  AgentContext,
  CampaignBrainReview,
  CampaignDefinition,
  CampaignMemory,
  ContentDraft,
  CopyRequest,
  EditorialPlan,
  ProposedCommand,
} from "./types";
import { GROWTH_STUDIO_TIMEZONE } from "./types";

export interface CampaignBrainDependencies {
  campaign: CampaignDefinition;
  memory: CampaignMemory;
  now: string;
  brandGuardian?: BrandGuardian;
  complianceSafety?: ComplianceSafetyAgent;
  contentStrategist?: ContentStrategist;
  copyAgent?: CopyAgent;
}

export class CampaignBrain {
  private readonly brandGuardian: BrandGuardian;
  private readonly complianceSafety: ComplianceSafetyAgent;
  private readonly contentStrategist: ContentStrategist;
  private readonly copyAgent: CopyAgent;
  private memory: CampaignMemory;

  constructor(private readonly dependencies: CampaignBrainDependencies) {
    this.memory = structuredClone(dependencies.memory);
    this.brandGuardian = dependencies.brandGuardian ?? new BrandGuardian();
    this.complianceSafety = dependencies.complianceSafety ?? new ComplianceSafetyAgent();
    this.contentStrategist = dependencies.contentStrategist ?? new ContentStrategist();
    this.copyAgent = dependencies.copyAgent ?? new CopyAgent();
  }

  context(): AgentContext {
    return {
      now: this.dependencies.now,
      timezone: GROWTH_STUDIO_TIMEZONE,
      campaign: this.dependencies.campaign,
      memory: structuredClone(this.memory),
      policyVersion: GROWTH_POLICY_VERSION,
    };
  }

  getMemory(): CampaignMemory {
    return structuredClone(this.memory);
  }

  async plan(input: ContentStrategyRequest): Promise<EditorialPlan> {
    const result = await this.contentStrategist.execute(input, this.context());
    return result.output;
  }

  async draft(request: CopyRequest): Promise<CampaignBrainReview> {
    const result = await this.copyAgent.execute(request, this.context());
    return this.review(result.output);
  }

  async review(draft: ContentDraft): Promise<CampaignBrainReview> {
    const immutableVersion = structuredClone(draft);
    const [brandResult, complianceResult] = await Promise.all([
      this.brandGuardian.execute(immutableVersion, this.context()),
      this.complianceSafety.execute(immutableVersion, this.context()),
    ]);
    const passed = brandResult.output.approved && complianceResult.output.approved;
    return {
      draft: immutableVersion,
      brand: brandResult.output,
      compliance: complianceResult.output,
      finalState: passed ? "human_approval" : "rejected",
      nextAction: passed ? "human_approval" : "revise",
    };
  }

  proposeSchedule(review: CampaignBrainReview, scheduledFor: string): ProposedCommand | null {
    if (review.finalState !== "human_approval") return null;
    return {
      kind: "schedule_content",
      payload: { contentId: review.draft.id, version: review.draft.version, scheduledFor },
      requiresHumanApproval: true,
      permission: "publishing:schedule",
    };
  }

  recordPublished(content: ContentDraft, publishedAt: string, visualAssetId?: string): CampaignMemory {
    this.memory = {
      ...this.memory,
      previousContent: [
        ...this.memory.previousContent,
        { id: content.id, hook: content.hook, caption: content.caption, publishedAt, visualAssetId },
      ],
      usedThemes: Array.from(new Set(this.memory.usedThemes.concat(content.pillar))),
      usedAssetIds: visualAssetId ? Array.from(new Set(this.memory.usedAssetIds.concat(visualAssetId))) : this.memory.usedAssetIds,
      updatedAt: publishedAt,
    };
    return this.getMemory();
  }

  audit() {
    return audit("campaign-brain", this.context(), "campaign-orchestration-v1", this.memory);
  }
}
