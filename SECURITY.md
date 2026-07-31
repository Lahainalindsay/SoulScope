# Security Policy

## Supported Versions

SoulScope is currently in active development. Security fixes are applied to the latest version on `main`.

## Reporting a Vulnerability

If you discover a security vulnerability in SoulScope, please **do not open a public GitHub issue**.

Instead, report it privately:

1. Email the repository owner directly (see the GitHub profile for contact information).
2. Include a clear description of the vulnerability.
3. Include steps to reproduce, if possible.
4. Include the potential impact.

You will receive an acknowledgement within 72 hours.

## What to Report

Please report:
- Exposed API keys, tokens, or credentials in the codebase or history
- Authentication or authorization bypass vulnerabilities
- Data exposure vulnerabilities (especially Supabase RLS bypass)
- Injection vulnerabilities in the backend API
- Insecure handling of user audio data
- Any other issue that could compromise user data or system integrity

## Out of Scope

The following are generally out of scope:
- Issues in third-party dependencies (report these to the upstream project)
- Theoretical vulnerabilities without a demonstrated proof of concept
- Issues requiring physical access to the user's device
- Rate limiting on public endpoints without demonstrated harm

## Security Design Notes

- User audio is processed server-side and not stored in the public repository.
- All Supabase access uses Row Level Security (RLS).
- The Supabase anon key is a public-facing key, by design, and is not a secret.
- Service role keys are never stored in this repository.
- Environment variables are managed outside of version control.
