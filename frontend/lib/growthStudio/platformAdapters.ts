import type { CommunityInteraction, ContentDraft, Platform } from "./types";

export interface PlatformCapabilityStatus {
  platform: Platform;
  connected: boolean;
  accountLabel?: string;
  permissionsGranted: string[];
  permissionsMissing: string[];
  tokenExpiresAt?: string;
  lastSuccessfulSync?: string;
  lastError?: string;
  canPublish: boolean;
  canRead: boolean;
  canMessage: boolean;
  canAdvertise: boolean;
}

export interface ApprovedExternalAction {
  commandId: string;
  approvedByUserId: string;
  approvedAt: string;
  contentVersion: number;
}

export interface PublishResult {
  status: "published" | "not_configured" | "failed";
  platformPostId?: string;
  url?: string;
  error?: string;
}

export interface SocialPlatformAdapter {
  status(): Promise<PlatformCapabilityStatus>;
  publish(draft: ContentDraft, approval: ApprovedExternalAction): Promise<PublishResult>;
  readInteractions(since: string): Promise<CommunityInteraction[]>;
}

export class DevelopmentPlatformAdapter implements SocialPlatformAdapter {
  constructor(private readonly platform: Platform) {}

  async status(): Promise<PlatformCapabilityStatus> {
    return {
      platform: this.platform,
      connected: false,
      permissionsGranted: [],
      permissionsMissing: ["OAuth connection and platform review are not configured."],
      canPublish: false,
      canRead: false,
      canMessage: false,
      canAdvertise: false,
    };
  }

  async publish(_draft: ContentDraft, _approval: ApprovedExternalAction): Promise<PublishResult> {
    return { status: "not_configured", error: "Development adapter never publishes externally." };
  }

  async readInteractions(_since: string): Promise<CommunityInteraction[]> {
    return [];
  }
}
