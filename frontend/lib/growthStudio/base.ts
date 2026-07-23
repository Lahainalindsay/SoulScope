import { createHash } from "node:crypto";
import type { AgentContext, AgentId, AgentResult, ReviewIssue } from "./types";

export const AGENT_VERSION = "1.0.0";

export function audit(agentId: AgentId | "campaign-brain", context: AgentContext, promptVersion: string, input?: unknown) {
  return {
    agentId,
    agentVersion: AGENT_VERSION,
    policyVersion: context.policyVersion,
    promptVersion,
    createdAt: context.now,
    inputDigest: input === undefined ? undefined : createHash("sha256").update(JSON.stringify(input)).digest("hex"),
  };
}

export function statusFromIssues(issues: ReviewIssue[]): AgentResult<unknown>["status"] {
  if (issues.some((issue) => issue.risk === "critical")) return "blocked";
  if (issues.length) return "needs_human_review";
  return "proposed";
}

export function assertNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
  return value.trim();
}

export function safeId(...parts: string[]) {
  return parts.join("-").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}
