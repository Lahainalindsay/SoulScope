import { AGENT_VERSION, audit } from "../base";
import { buildLaunchCalendar } from "../launchCampaign";
import type { AgentContext, AgentResult, EditorialPlan, GrowthAgent } from "../types";

export interface ContentStrategyRequest {
  from: string;
  through: string;
}

export class ContentStrategist implements GrowthAgent<ContentStrategyRequest, EditorialPlan> {
  readonly id = "content-strategist" as const;
  readonly version = AGENT_VERSION;

  async execute(input: ContentStrategyRequest, context: AgentContext): Promise<AgentResult<EditorialPlan>> {
    const items = buildLaunchCalendar().filter((item) => item.date >= input.from && item.date <= input.through);
    const output: EditorialPlan = {
      timezone: context.timezone,
      items,
      narrativeProgression: context.campaign.phases.flatMap((phase) => phase.narrative),
      cautions: [
        "Use only verified Founding 500 availability.",
        "Do not repeat the same hook, visual asset, or caption.",
        "Keep every item approval-gated during the launch period.",
      ],
    };
    return { status: "proposed", output, issues: [], commands: [], audit: audit(this.id, context, "launch-editorial-plan-v1", input) };
  }
}
