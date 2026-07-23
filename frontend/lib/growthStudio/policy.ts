import type { ContentDraft, ReviewIssue } from "./types";

export const GROWTH_POLICY_VERSION = "2026-07-22.1";

export const APPROVED_TERMS = [
  "Observe your inner world.",
  "Recognition, not diagnosis.",
  "One scan reveals a moment. Many scans reveal a story.",
  "Recognition begins with noticing.",
  "A private instrument for self-understanding.",
  "See the patterns beneath the moment.",
  "Your voice carries context. SoulScope helps you reflect on it.",
  "Your voice. Your pattern. Your signature.",
  "SoulScope offers a lens—not a label.",
] as const;

export const PROHIBITED_CLAIMS: Array<{ pattern: RegExp; code: string; replacement?: string }> = [
  { pattern: /(?:diagnose|diagnoses|diagnosed|diagnostic test)/i, code: "diagnostic_wording", replacement: "offers a non-diagnostic Reflection" },
  { pattern: /(?:cure|cures|heals?|fixes?)\b/i, code: "treatment_claim", replacement: "supports self-reflection" },
  { pattern: /(?:medical[- ]grade|clinically proven|scientifically certain|proves?)\b/i, code: "unsupported_science" },
  { pattern: /(?:trauma|burnout|anxiety|depression)\s+(?:detected|diagnosed|confirmed)/i, code: "sensitive_inference" },
  { pattern: /(?:chakra imbalance|energetic blockage|aura reading|reads? your soul|spiritual certainty)/i, code: "spiritual_certainty" },
  { pattern: /(?:guaranteed|always|never fails|100\s*%\s*(?:accurate|accuracy))/i, code: "false_certainty" },
  { pattern: /(?:reveal(?:s)? your true self|your body is telling you)/i, code: "identity_claim" },
  { pattern: /(?:only today|act now|last chance)\b/i, code: "unverified_urgency" },
  { pattern: /(?:tag\s+\d+\s+friends|dm everyone|mass dm)/i, code: "spam_mechanic" },
];

export const QUIET_INSTRUMENT_PALETTE = ["#030B14", "#07111F", "#06101E", "#67E8F9", "#34D399", "#71CEE6", "#F4F6FF", "#CCD8E6"] as const;

export const VISUAL_PROHIBITIONS = [
  "rainbow chakra colors",
  "glowing anatomy",
  "medical overlays",
  "generic mystical person",
  "fake laboratory",
  "cheap neon cyberpunk",
  "watermark",
  "visible generated text",
  "synthetic customer presented as real",
] as const;

export function inspectCopy(text: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const rule of PROHIBITED_CLAIMS) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    issues.push({
      code: rule.code,
      message: `Copy contains prohibited or unsupported wording: “${match[0]}”.`,
      risk: rule.code === "spam_mechanic" || rule.code === "unverified_urgency" ? "high" : "critical",
      evidence: match[0],
      suggestedReplacement: rule.replacement,
    });
  }

  if (/(?:may|might|could|suggests|appears|helps you reflect|offers a lens)/i.test(text) === false && /\b(?:pattern|signal|scan|reflection)\b/i.test(text)) {
    issues.push({
      code: "missing_uncertainty",
      message: "Interpretive copy should preserve context and uncertainty with observational language.",
      risk: "medium",
      suggestedReplacement: "Use “may,” “could reflect,” or “appears” where the copy interprets a pattern.",
    });
  }
  return issues;
}

export function inspectDraft(draft: ContentDraft): ReviewIssue[] {
  const text = [draft.hook, draft.headline, draft.body, draft.caption, draft.cta, ...draft.claims].filter(Boolean).join("\n");
  const issues = inspectCopy(text);

  if (draft.syntheticCustomerDepiction) {
    issues.push({
      code: "synthetic_customer",
      message: "Synthetic people cannot be presented as real SoulScope customers.",
      risk: "critical",
    });
  }
  if (!draft.cta.trim()) {
    issues.push({ code: "missing_cta", message: "Content needs one clear approved call to action.", risk: "medium", field: "cta" });
  }
  if (!draft.altText?.trim() && ["reel", "carousel", "static", "story", "ad"].includes(draft.format)) {
    issues.push({ code: "missing_alt_text", message: "Visual content needs useful accessibility text.", risk: "high", field: "altText" });
  }
  return issues;
}

export function scoreBrand(issues: ReviewIssue[]) {
  const deductions = issues.reduce((sum, issue) => sum + ({ low: 4, medium: 10, high: 22, critical: 40 }[issue.risk]), 0);
  return Math.max(0, 100 - deductions);
}

export function normalizeForNovelty(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function similarity(left: string, right: string) {
  const a = new Set(normalizeForNovelty(left).split(" ").filter((word) => word.length > 3));
  const b = new Set(normalizeForNovelty(right).split(" ").filter((word) => word.length > 3));
  if (!a.size || !b.size) return 0;
  const intersection = Array.from(a).filter((word) => b.has(word)).length;
  const union = new Set(Array.from(a).concat(Array.from(b))).size;
  return intersection / union;
}
