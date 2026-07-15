# SoulScope V2 application readiness

**Do not run `supabase/manual/soulscope_v2_reset_and_rebuild.sql` until every required item below passes.**

## Canonical writes

- [x] New scan records target `public.scan_sessions`.
- [x] Capture rows target `public.sensor_captures`.
- [x] Raw measurements target `public.raw_feature_measurements`.
- [x] Evidence targets `public.evidence_signal_results`.
- [x] Observations target `public.observation_results`.
- [x] Domains target `public.domain_results`.
- [x] Patterns target `public.pattern_matches`.
- [x] All three reflection variants target `public.reflection_variants`.
- [x] No production write targets the read-only `public.scans` compatibility view.
- [x] Persistence retries use stable scan and child IDs.
- [x] A scan remains `processing` until required child writes complete.
- [x] Failed persistence marks the scan session `failed` when possible.

## Canonical reads

- [x] Result pages load through `getScanResultViewModel`.
- [x] Dashboard and history load through V2 view-model services.
- [x] Pattern, reflection, domain, preference, and baseline relationships are assembled outside React components.
- [x] Dashboard requests only recent summaries and does not query raw feature rows.
- [x] Exactly three recent scans are exposed by the dashboard service.

## Preferences

- [x] The application uses `set_scan_reflection_preference`.
- [x] Direct, Supportive, and Insight remain available.
- [x] Preference learning affects presentation only.
- [ ] The SQL RPC signature and application call signature have been verified identical in final review.
- [ ] First selection, reselection, and style change pass database-backed tests after reset.

## Baselines

- [x] Baseline inputs come from `domain_results`.
- [x] Completed scans are eligible.
- [x] Good-quality partial scans are eligible.
- [x] Limited, poor, and failed scans are excluded.
- [x] At least two eligible scans are required.
- [x] Domain orientation remains explicit in stored domain rows.

## Legacy isolation

- [x] Active scan flow does not write `public.scans`.
- [x] Active result loading does not read `public.scans`.
- [x] Active dashboard/history loading does not read `public.scans`.
- [x] Active production code does not write `scan_pattern_matches`.
- [x] Active production code does not write `scan_story_variants`.
- [x] Active production code does not read or write `scan_story_preferences`.
- [x] Active production code does not call `set_scan_story_preference`.
- [ ] Historical migrations and backup files have been classified and documented in the final audit.

## Validation

- [ ] Complete-scan persistence fixture passes.
- [ ] Partial-scan persistence fixture passes.
- [ ] Idempotent retry fixture passes.
- [ ] Result view-model fixture passes.
- [ ] Dashboard view-model fixture passes.
- [ ] History view-model fixture passes.
- [ ] Preference fixture passes.
- [ ] `npm ci` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] GitHub PR validation is green.
- [ ] Vercel preview is Ready with `NEXT_PUBLIC_SOULSCOPE_DATA_MODEL_VERSION=v2` or the branch default.

## Hosted reset gate

The hosted reset SQL must remain unexecuted until:

1. This checklist is fully green.
2. The SQL script has been reviewed for one-shot transactional execution.
3. The beta feedback table is either recreated by the script or removed from active application use.
4. The preference RPC signature exactly matches the repository call.
5. PR #7 remains draft during review.
