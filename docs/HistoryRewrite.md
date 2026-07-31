# History Rewrite Plan — SoulScope Phase 0.5

**Date:** 2026-07-31
**Purpose:** Document all files that exist in git history but should not, and provide exact commands for a future controlled history rewrite.

---

## Overview

Phase 0 removed several problematic files from git tracking (the index and future commits). However, these files still exist in git history. This document inventories every such file, assesses the risk, and provides the exact `git-filter-repo` commands needed to purge them.

**Important:** Do NOT run these commands automatically. A history rewrite requires:
1. Coordination with all active contributors (they must re-clone after the rewrite).
2. Merging all open PRs or rebasing them before the rewrite.
3. Force-pushing to all affected branches after the rewrite.
4. Re-applying branch protection rules after force-push.

---

## Files That Should Be Purged from History

### Priority 1 — Before Any Public Repository Access

| File Path in History | First Committed | Content | Risk Level |
|----------------------|----------------|---------|-----------|
| `supabase/.temp/pooler-url` | Early commits | Database pooler connection string (`postgresql://postgres.jhamqpfxblybshjmgvsy@aws-0-us-west-2.pooler.supabase.com:5432/postgres`) | **Medium** — exposes infrastructure hostname, no password |
| `supabase/.temp/project-ref` | Early commits | Supabase project reference ID (`jhamqpfxblybshjmgvsy`) | Low — this is public in browser network traffic anyway |
| `frontend/.env.local` | Commits `82201eb`, `6410db0`, `a11145b` | `NEXT_PUBLIC_SUPABASE_URL` (confirmed real URL) + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (placeholder `******`) | **Low** — URL is public; anon key value is a placeholder |
| `.env.local` (root) | Commit `86152c9` | Same as above — Supabase URL + placeholder anon key | **Low** — same as above |

### Priority 2 — Housekeeping (No Security Risk)

| File Path in History | Content | Risk Level |
|----------------------|---------|-----------|
| `frontend/tsconfig.tsbuildinfo` | TypeScript incremental build cache (108KB, many commits) | None — build artifact |
| `frontend/pages/scan.tsx.save` | Editor backup of early scan page | None — editor backup |
| `docs/archive/scan.tsx.save` | Editor backup of early scan page | None — editor backup |
| `supabase/.temp/cli-latest` | Supabase CLI version pin | None |
| `supabase/.temp/gotrue-version` | GoTrue version pin | None |
| `supabase/.temp/postgres-version` | Postgres version pin | None |
| `supabase/.temp/rest-version` | REST version pin | None |
| `supabase/.temp/storage-migration` | Storage migration marker | None |
| `supabase/.temp/storage-version` | Storage version pin | None |

---

## Commits Involved

The following commits introduced or modified these files:

| Commit | Message | Files |
|--------|---------|-------|
| `86152c9` | Add Meyda recorder and Supabase auth | `.env.local` (root) |
| `82201eb` | Add vocal scan flow MVP | `frontend/.env.local.example` |
| `6410db0` | UI design and voice recorder hook to supabase | `frontend/.env.local` |
| `a11145b` | Implement guided voice scan and results redesign | `frontend/.env.local`, `frontend/tsconfig.tsbuildinfo` |
| `594072290` | syncing UI with supabase data | `frontend/pages/scan.tsx.save` |
| `f6e0d52` | Remove archived scan backup from Next.js pages | `frontend/pages/scan.tsx.save` |
| `0c553c09` | Archive obsolete scan page backup | `docs/archive/scan.tsx.save` |
| `f3c1bc3` | Commit generated build metadata | `frontend/tsconfig.tsbuildinfo` |
| Multiple commits | Various | `supabase/.temp/*`, `frontend/tsconfig.tsbuildinfo` |

---

## Rewrite Commands

### Prerequisites

```bash
# Install git-filter-repo
pip install git-filter-repo

# Ensure you have a full (non-shallow) clone
git fetch --unshallow origin

# Ensure all open PRs are merged or closed before proceeding
# Create a backup of the repository first
cp -r /path/to/SoulScope /path/to/SoulScope.backup
```

### Option A — Minimal Rewrite (Security Priority Only)

Purge only the files with infrastructure information:

```bash
git filter-repo \
  --path supabase/.temp/ \
  --path frontend/.env.local \
  --path .env.local \
  --invert-paths \
  --force
```

### Option B — Full Housekeeping Rewrite (Recommended)

Purge all files that should never have been committed:

```bash
git filter-repo \
  --path supabase/.temp/ \
  --path frontend/.env.local \
  --path .env.local \
  --path frontend/tsconfig.tsbuildinfo \
  --path frontend/pages/scan.tsx.save \
  --path docs/archive/scan.tsx.save \
  --invert-paths \
  --force
```

### After the Rewrite

```bash
# Force push to remote (requires branch protection to be temporarily disabled)
git remote add origin https://github.com/Lahainalindsay/SoulScope.git
git push origin main --force

# Re-protect main branch immediately after

# All contributors must re-clone:
git clone https://github.com/Lahainalindsay/SoulScope.git
```

---

## Anon Key Rotation Recommendation

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` value stored in historical commits is a placeholder (`******`), not a real credential. **No confirmed credential was exposed.**

However, because the Supabase project URL (`jhamqpfxblybshjmgvsy.supabase.co`) is confirmed real and present in history, rotating the anon key is recommended as a precautionary measure, particularly if the repository becomes public.

**Why rotation is recommended:**
- The project URL is confirmed real and historically committed.
- The placeholder in history may give a false sense of security; future auditors should not need to verify whether the placeholder is real.
- Anon key rotation is low-risk (it only affects client apps, and the new key can be deployed immediately).
- Rotation eliminates any residual uncertainty.

**Why rotation is not urgent:**
- The Supabase anon key is a public-facing key by design. It is not a secret — it is safe to expose to browser clients.
- No service role key, JWT secret, or database password was found in any commit.
- The current repository is private.

---

## No Action Required For

- Service role keys — none found in any commit
- Database passwords — none found in any commit
- JWT secrets — none found in any commit
- Firebase keys — not used in this project
- AWS credentials — not used in this project
- OpenAI / Anthropic keys — not used in tracked files
- GitHub PATs — none found in any commit
