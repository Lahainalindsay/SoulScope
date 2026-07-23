export const GROWTH_STUDIO_TIMEZONE = "Pacific/Honolulu" as const;

export type Platform = "instagram" | "facebook" | "youtube" | "google" | "email" | "web";
export type ContentFormat =
  | "reel"
  | "carousel"
  | "static"
  | "story"
  | "text"
  | "founder"
  | "ad"
  | "email"
  | "landing-page";
export type ApprovalState =
  | "draft"
  | "brand_review"
  | "compliance_review"
  | "human_approval"
  | "approved"
  | "rejected";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AgentStatus = "proposed" | "blocked" | "needs_human_review";
export type CampaignPhaseId = "prelaunch" | "launch" | "week_one" | "week_two" | "post_campaign";

export type AgentId =
  | "brand-guardian"
  | "content-strategist"
  | "premium-creative-director"
  | "copy-agent"
  | "founder-voice-agent"
  | "community-agent"
  | "referral-rewards-agent"
  | "ads-agent"
  | "analytics-agent"
  | "compliance-safety-agent";

export interface AuditMetadata {
  agentId: AgentId | "campaign-brain";
  agentVersion: string;
  policyVersion: string;
  promptVersion: string;
  createdAt: string;
  inputDigest?: string;
  provider?: string;
  model?: string;
}

export interface ReviewIssue {
  code: string;
  message: string;
  risk: RiskLevel;
  field?: string;
  evidence?: string;
  suggestedReplacement?: string;
}

export interface ProposedCommand {
  kind:
    | "save_draft"
    | "request_approval"
    | "schedule_content"
    | "publish_content"
    | "send_reply"
    | "send_message"
    | "activate_ad"
    | "change_budget"
    | "issue_reward";
  payload: Record<string, unknown>;
  requiresHumanApproval: true;
  permission: string;
}

export interface AgentResult<T> {
  status: AgentStatus;
  output: T;
  issues: ReviewIssue[];
  commands: ProposedCommand[];
  audit: AuditMetadata;
}

export interface GrowthAgent<TInput, TOutput> {
  readonly id: AgentId;
  readonly version: string;
  execute(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
}

export interface AgentContext {
  now: string;
  timezone: typeof GROWTH_STUDIO_TIMEZONE;
  campaign: CampaignDefinition;
  memory: CampaignMemory;
  policyVersion: string;
  provider?: StructuredGenerationProvider;
}

export interface StructuredGenerationRequest<T> {
  task: string;
  system: string;
  input: unknown;
  schemaName: string;
  validate: (value: unknown) => T;
  metadata: Record<string, string>;
}

export interface StructuredGenerationResponse<T> {
  value: T;
  provider: string;
  model: string;
  outputId?: string;
}

export interface StructuredGenerationProvider {
  generate<T>(request: StructuredGenerationRequest<T>): Promise<StructuredGenerationResponse<T>>;
}

export interface CampaignPhase {
  id: CampaignPhaseId;
  startsOn: string;
  endsOn?: string;
  objective: string;
  narrative: string[];
  allowedCtas: string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  nonSensitiveInterests: string[];
}

export interface CampaignDefinition {
  id: string;
  name: string;
  communityName: string;
  timezone: typeof GROWTH_STUDIO_TIMEZONE;
  launchDate: string;
  campaignEndsOn: string;
  objective: string;
  invitation: string;
  phases: CampaignPhase[];
  audiences: AudienceSegment[];
  approvedCtas: string[];
  successMetrics: string[];
  stopConditions: string[];
  promise: string;
  qualificationCriteria: string[];
}

export interface CampaignMemory {
  currentCampaignId: string;
  currentPhaseId: CampaignPhaseId;
  previousContent: Array<{
    id: string;
    hook: string;
    caption: string;
    visualAssetId?: string;
    publishedAt?: string;
  }>;
  scheduledContent: Array<{ id: string; scheduledFor: string; platform: Platform }>;
  activeCtas: string[];
  usedThemes: string[];
  usedAssetIds: string[];
  experiments: Array<{ id: string; status: "draft" | "running" | "paused" | "complete" }>;
  learnings: string[];
  foundingMemberCount: number;
  reservedFounderCount: number;
  unansweredInteractionCount: number;
  updatedAt: string;
}

export interface ContentDraft {
  id: string;
  campaignId: string;
  phaseId: CampaignPhaseId;
  platform: Platform;
  format: ContentFormat;
  pillar: string;
  objective: string;
  audienceId: string;
  hook: string;
  headline?: string;
  body?: string;
  caption: string;
  cta: string;
  hashtags: string[];
  altText?: string;
  disclosures: string[];
  approvalState: ApprovalState;
  sourceContentId?: string;
  syntheticCustomerDepiction: boolean;
  claims: string[];
  createdBy: AgentId | "human";
  version: number;
}

export interface BrandReview {
  approved: boolean;
  score: number;
  issues: ReviewIssue[];
  correctedCopy?: string;
}

export interface ComplianceReview {
  approved: boolean;
  issues: ReviewIssue[];
  requiredDisclosures: string[];
  policyCheckedAt?: string;
  policySource?: string;
}

export interface EditorialPlanItem {
  date: string;
  platform: Platform;
  format: ContentFormat;
  pillar: string;
  objective: string;
  hookDirection: string;
  cta: string;
  phaseId: CampaignPhaseId;
}

export interface EditorialPlan {
  timezone: typeof GROWTH_STUDIO_TIMEZONE;
  items: EditorialPlanItem[];
  narrativeProgression: string[];
  cautions: string[];
}

export interface CreativeBrief {
  campaignId: string;
  purpose: string;
  audienceId: string;
  platform: Platform;
  format: ContentFormat;
  hook: string;
  visualConcept: string;
  composition: string;
  lighting: string;
  motion: string;
  typographyPlacement: string;
  palette: string[];
  caption: string;
  cta: string;
  altText: string;
  prohibitedElements: string[];
  exportSizes: string[];
  generationPrompt: string;
  approvalState: ApprovalState;
}

export interface CopyRequest {
  platform: Platform;
  format: ContentFormat;
  phaseId: CampaignPhaseId;
  pillar: string;
  audienceId: string;
  objective: string;
  facts: string[];
  cta: string;
  founderMode?: boolean;
}

export interface FounderDraft {
  draft: ContentDraft;
  unverifiableClaims: string[];
  requiredFounderConfirmations: string[];
}

export type InteractionCategory =
  | "product_question"
  | "support"
  | "high_intent"
  | "ambassador"
  | "harassment"
  | "threat"
  | "medical_crisis"
  | "legal"
  | "account"
  | "refund"
  | "privacy"
  | "media"
  | "prompt_injection"
  | "other";

export interface CommunityInteraction {
  id: string;
  platform: Platform;
  kind: "comment" | "direct_message";
  body: string;
  receivedAt: string;
  authorId?: string;
}

export interface CommunityTriage {
  interactionId: string;
  categories: InteractionCategory[];
  risk: RiskLevel;
  suggestedReply?: string;
  mayAutoAcknowledge: boolean;
  requiresHumanReview: boolean;
  untrustedInput: true;
}

export type VerificationMode = "automatic_api" | "referral_event" | "user_evidence" | "admin" | "honor" | "unavailable";

export interface ReferralEvent {
  id: string;
  campaignId: string;
  referrerUserId: string;
  referredUserId: string;
  eventType: "signup" | "onboarding" | "valid_scan" | "feedback" | "qualified";
  occurredAt: string;
  verificationMode: VerificationMode;
  previouslyProcessedEventIds: string[];
}

export interface RewardProposal {
  eligible: boolean;
  blockedReason?: string;
  ledgerKey: string;
  rewardDefinitionId?: string;
  requiresAdminApproval: true;
}

export interface AdProposal {
  campaignId: string;
  platform: "meta" | "google";
  objective: string;
  audienceHypothesis: string;
  creativeVariants: ContentDraft[];
  dailyBudgetCents: number;
  activationAllowed: false;
  approvalState: ApprovalState;
}

export interface FunnelMetrics {
  impressions: number;
  profileVisits: number;
  landingPageVisits: number;
  signups: number;
  accountsCreated: number;
  onboardingCompleted: number;
  firstScansCompleted: number;
  feedbackCompleted: number;
  qualifiedReferrals: number;
  retainedUsers: number;
}

export interface AnalyticsInsight {
  funnelRates: Record<string, number | null>;
  vanityMetrics: string[];
  businessOutcomes: string[];
  recommendations: string[];
  insufficientData: string[];
}

export interface CampaignBrainReview {
  draft: ContentDraft;
  brand: BrandReview;
  compliance: ComplianceReview;
  finalState: ApprovalState;
  nextAction: "revise" | "human_approval";
}
