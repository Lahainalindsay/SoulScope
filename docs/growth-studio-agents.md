# SoulScope Growth Studio agents

## Status

The repository contains the governed agent foundation for the SoulScope Growth Studio. It is deliberately isolated under `frontend/lib/growthStudio`; it does not import or modify the Sensor Capture, Raw Feature, Evidence Signal, Observation, Domain, Pattern, Resonance Scan, or Reflection pipelines.

The initial implementation creates validated proposals. It does not publish posts, send replies or direct messages, activate advertisements, change budgets, award rewards, or write campaign state to Supabase.

## Architecture

The `CampaignBrain` holds campaign memory and coordinates specialist outputs. Content passes through this lifecycle:

1. The Content Strategist proposes a connected editorial plan.
2. The Copy Agent creates a structured draft.
3. The Brand Guardian and Compliance and Safety Agent review the same immutable draft.
4. Failed content returns to revision with specific issues.
5. Passed content stops at `human_approval`.
6. Scheduling and external actions are represented as permission-scoped commands that still require a human approval record.

Approved content is never silently regenerated. A changed draft must increment its version and be reviewed again.

## Agent responsibilities

| Agent | Current responsibility | External authority |
| --- | --- | --- |
| Brand Guardian | Detect prohibited claims, missing accessibility text, unapproved CTAs, synthetic-customer depictions, and repetition | None |
| Content Strategist | Produce the July 22–August 10 editorial sequence in `Pacific/Honolulu` | None |
| Premium Creative Director | Produce Quiet Instrument creative briefs and generation prompts | None |
| Copy Agent | Produce structured platform drafts from approved facts | None |
| Founder Voice Agent | Draft founder content and identify facts the founder must confirm | None |
| Community Agent | Treat comments and DMs as untrusted, classify risk, and propose safe acknowledgments | None |
| Referral and Rewards Agent | Check self-referrals, duplicate events, verification, and qualification before proposing a ledger entry | None |
| Ads Agent | Create an approval-gated ad proposal with `activationAllowed: false` | None |
| Analytics Agent | Calculate funnel conversion and evidence-based recommendations | None |
| Compliance and Safety Agent | Check claims, offer disclosures, and unverified scarcity | None |

## Campaign Brain memory

Campaign memory records the current phase, prior and scheduled content, CTAs, used themes and assets, experiments, learnings, verified Founder counts, and unanswered interaction count. The foundation currently accepts memory as typed application data. Persist it only after an additive Supabase migration and role-based policies are reviewed.

`recordPublished` updates an in-memory snapshot only. A production repository must store versioned campaign state and audit events server-side.

## Founding 500 configuration

`launchCampaign.ts` is the canonical launch fixture:

- prelaunch: July 22–27, 2026
- launch: July 28, 2026
- week one: July 29–August 3, 2026
- week two: August 4–10, 2026
- post-campaign: begins August 11, 2026
- timezone: `Pacific/Honolulu`

Qualification requires an account, onboarding, one valid Resonance Scan, brief feedback, and acceptance of Founding Member terms. Founder Numbers and rewards are not issued by these modules.

## Security boundaries

- Social comments and messages are always marked as untrusted data.
- Prompt-injection phrases create a critical escalation; social text is not copied into audit metadata.
- External commands always carry `requiresHumanApproval: true` and a permission name.
- Platform passwords and OAuth tokens are not accepted by agent inputs.
- The development platform adapter reports that integrations are not configured and cannot publish.
- No private scan, voice, Reflection, mental-state, health, or wellness inference is accepted by the advertising interfaces.
- First-person founder claims are surfaced for manual confirmation.

## Platform integration requirements

Production Meta integration still requires a Meta app, Facebook Page, Instagram professional account linked to that Page, approved OAuth scopes, webhook verification, server-side encrypted token storage, token rotation, platform review where required, and an explicit per-action approval workflow.

Use OAuth access tokens. Never store a Facebook or Instagram account password in source control or environment files.

Google or YouTube adapters must be added only after confirming which account and product are actually being connected. The development adapter is the honest fallback until then.

## AI provider integration

`StructuredGenerationProvider` is vendor-neutral. Any provider implementation must:

1. run server-side;
2. request structured output;
3. validate the response before returning it;
4. record provider, model, prompt version, and output ID in audit metadata;
5. treat generated external actions as proposals rather than commands;
6. omit private scan and Reflection data.

The current agents are deterministic and do not require an AI credential.

## Testing

Run from `frontend`:

```bash
TZ=Pacific/Honolulu node --import tsx --test tests/*.test.ts
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

The Growth Studio tests cover prohibited claims, observational phrasing, human approval, prompt injection, self-referrals, duplicate reward prevention, ad activation boundaries, Quiet Instrument creative rules, launch dates, and honest integration degradation.

## Next implementation phase

Before live operation, add:

1. additive Supabase tables and RLS for campaigns, content versions, approvals, platform connections, publishing jobs, referrals, Founder reservations, reward ledgers, and audit events;
2. server-only administrator authorization rather than the current client-visible admin-email convention;
3. encrypted OAuth token storage and webhook signature verification;
4. idempotent publishing jobs with retry and failure states;
5. the Growth Studio admin UI;
6. live platform adapters after credentials, scopes, and app review are complete.

Do not connect external publishing before those controls exist.
