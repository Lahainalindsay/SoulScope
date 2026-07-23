import { AGENT_VERSION, audit } from "../base";
import { QUIET_INSTRUMENT_PALETTE, VISUAL_PROHIBITIONS } from "../policy";
import type { AgentContext, AgentResult, ContentDraft, CreativeBrief, GrowthAgent } from "../types";

const exportSizes: Record<string, string[]> = {
  reel: ["1080x1920"], story: ["1080x1920"], carousel: ["1080x1350", "1080x1080"], static: ["1080x1350", "1080x1080"], ad: ["1080x1350", "1200x628"], text: [], founder: ["1080x1350"], email: ["1200x628"], "landing-page": ["1920x1080"],
};

export class PremiumCreativeDirector implements GrowthAgent<ContentDraft, CreativeBrief> {
  readonly id = "premium-creative-director" as const;
  readonly version = AGENT_VERSION;

  async execute(draft: ContentDraft, context: AgentContext): Promise<AgentResult<CreativeBrief>> {
    const output: CreativeBrief = {
      campaignId: draft.campaignId,
      purpose: draft.objective,
      audienceId: draft.audienceId,
      platform: draft.platform,
      format: draft.format,
      hook: draft.hook,
      visualConcept: "A Resonance Signature emerging as a fine interference field inside a quiet observation instrument.",
      composition: "Asymmetric editorial composition with the signature as the focal point and generous negative space for copy.",
      lighting: "Soft directional cyan-white light emerging from near-black navy; realistic falloff and restrained bloom.",
      motion: ["reel", "story"].includes(draft.format) ? "Slow field emergence, deliberate macro movement, and restrained transitions." : "Still, precise, and optically dimensional.",
      typographyPlacement: "Serif display hook in the upper safe zone; Inter supporting copy; no text generated inside imagery.",
      palette: [...QUIET_INSTRUMENT_PALETTE],
      caption: draft.caption,
      cta: draft.cta,
      altText: draft.altText ?? "SoulScope Quiet Instrument campaign creative.",
      prohibitedElements: [...VISUAL_PROHIBITIONS],
      exportSizes: exportSizes[draft.format] ?? [],
      generationPrompt: [
        "Premium editorial art direction for SoulScope's Quiet Instrument visual system.",
        "A fine fingerprint-like resonance interference field emerging in a dark private observatory environment.",
        "Realistic materials and restrained cyan, signal-blue, and green light; large intentional negative space for programmatic copy.",
        "No visible text, watermark, anatomy, medical implication, chakras, fake laboratory, synthetic customer, stock-photo look, or clutter.",
      ].join(" "),
      approvalState: "draft",
    };
    return { status: "needs_human_review", output, issues: [], commands: [], audit: audit(this.id, context, "quiet-instrument-brief-v1", draft) };
  }
}
