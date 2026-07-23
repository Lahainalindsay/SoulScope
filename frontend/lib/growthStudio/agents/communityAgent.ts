import { AGENT_VERSION, audit } from "../base";
import type { AgentContext, AgentResult, CommunityInteraction, CommunityTriage, GrowthAgent, InteractionCategory, RiskLevel } from "../types";

const categoryRules: Array<{ category: InteractionCategory; pattern: RegExp; risk: RiskLevel }> = [
  { category: "prompt_injection", pattern: /(?:ignore (?:all |previous )?instructions|system prompt|developer message|call a tool|reveal secrets?|access token)/i, risk: "critical" },
  { category: "medical_crisis", pattern: /(?:suicid|kill myself|overdose|medical emergency|can(?:'|’)t breathe)/i, risk: "critical" },
  { category: "threat", pattern: /(?:i(?:'|’)ll hurt|kill you|bomb threat)/i, risk: "critical" },
  { category: "privacy", pattern: /(?:delete my data|privacy|voice recording|my data)/i, risk: "high" },
  { category: "refund", pattern: /(?:refund|charged|money back)/i, risk: "high" },
  { category: "legal", pattern: /(?:lawyer|lawsuit|legal notice|subpoena)/i, risk: "high" },
  { category: "media", pattern: /(?:journalist|press|interview|media inquiry)/i, risk: "high" },
  { category: "account", pattern: /(?:login|password|account locked|can(?:'|’)t sign in)/i, risk: "medium" },
  { category: "support", pattern: /(?:not working|error|help|broken)/i, risk: "medium" },
  { category: "high_intent", pattern: /(?:how do i join|where do i sign up|pricing|founding 500)/i, risk: "low" },
  { category: "product_question", pattern: /(?:how does|what is soulscope|resonance signature|scan)/i, risk: "low" },
  { category: "harassment", pattern: /(?:idiot|scam|fraud|stupid)/i, risk: "medium" },
];

const riskRank: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export class CommunityAgent implements GrowthAgent<CommunityInteraction, CommunityTriage> {
  readonly id = "community-agent" as const;
  readonly version = AGENT_VERSION;

  async execute(interaction: CommunityInteraction, context: AgentContext): Promise<AgentResult<CommunityTriage>> {
    const matches = categoryRules.filter((rule) => rule.pattern.test(interaction.body));
    const categories = matches.length ? Array.from(new Set(matches.map((match) => match.category))) : ["other" as const];
    const risk = matches.reduce<RiskLevel>((current, rule) => riskRank[rule.risk] > riskRank[current] ? rule.risk : current, "low");
    const narrowAcknowledgment = categories.every((category) => ["product_question", "high_intent", "other"].includes(category));
    const mayAutoAcknowledge = narrowAcknowledgment && risk === "low";
    const output: CommunityTriage = {
      interactionId: interaction.id,
      categories,
      risk,
      suggestedReply: risk === "critical"
        ? undefined
        : "Thanks for reaching out. We received your message and a person from SoulScope will review it.",
      mayAutoAcknowledge,
      requiresHumanReview: true,
      untrustedInput: true,
    };
    return {
      status: risk === "critical" ? "blocked" : "needs_human_review",
      output,
      issues: matches.filter((match) => match.risk === "high" || match.risk === "critical").map((match) => ({
        code: `community_${match.category}`,
        message: `${match.category.replace(/_/g, " ")} content requires human escalation.`,
        risk: match.risk,
      })),
      commands: [],
      audit: audit(this.id, context, "community-triage-v1", { ...interaction, body: "[untrusted social content redacted from audit]" }),
    };
  }
}
