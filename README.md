# SoulScope

SoulScope is a human pattern interpretation system.

It translates measurable resonance signals into clear, recognizable descriptions of a person's current state of functioning. The goal is not diagnosis. The goal is recognition.

SoulScope should feel less like reading a lab report and more like having a highly perceptive guide explain what your system may currently be expressing.

## Core Idea

SoulScope does not exist to show disconnected scores.

It exists to answer one question:

**What story do these measurements tell together?**

A scan should produce:
- one coherent interpretation
- one primary pattern
- optional supporting and emerging patterns
- three narrative variants for preference learning
- a clear, human-centered explanation of what may be happening right now

## Product Positioning

SoulScope is not:
- a diagnosis tool
- a generic voice analyzer
- a note dashboard
- a collection of isolated metrics

SoulScope is:
- a private pattern intelligence system
- a resonance-based reflection product
- a pattern-first user experience
- a tool for recognizing what is working, what is strained, and what may need support

## Current Product Direction

The platform is moving from **score-first reporting** to **pattern-first interpretation**.

Instead of leading with separate metrics, SoulScope now centers the user experience around:
- **Primary Pattern**
- **Supporting Pattern**
- **Emerging Pattern**
- lived experience translation
- supporting evidence
- user-selected narrative preference

Example direction:

Instead of:
- Recovery: 42
- Communication: 81
- Mental Load: 74

SoulScope should say:

> Your current scan most closely resembles **The Overextended Achiever** — a system with strong forward movement that may be asking for more restoration.

## Experience Principles

### 1. Recognition over diagnosis
The success metric is not technical completeness.
The success metric is whether the user says:

> “That sounds exactly like what I’ve been experiencing.”

### 2. Pattern-first, not fragment-first
Users should not feel like they are reading seven unrelated cards.
Each section of the report should reinforce one central story.

### 3. Human language over technical language
Technical measurements matter, but they should support the interpretation, not replace it.

### 4. Premium clarity
SoulScope should feel:
- calm
- perceptive
- trustworthy
- precise
- emotionally intelligent
- high-end

## Logged-In Product Flow

### Logged-out user
The public homepage explains:
- what SoulScope is
- why it is different
- why it matters

### Logged-in user
The app should open to the user's private home base:
- latest pattern
- pattern history
- movement over time
- favorite narrative preferences
- clear CTA to start a new scan

## Main User Surfaces

### Dashboard
The logged-in home.

Should show:
- latest pattern
- latest scan date
- pattern history
- change over time
- quick access to latest insight
- start new scan

### Pattern History
A record of how the user's internal patterns change over time.

Should lead with:
- pattern names
- human themes
- scan date
- preferred summary style

Supporting technical detail can remain available, but it should not dominate the experience.

### Results
A single scan should produce:
- one canonical interpretation
- one primary pattern
- optional supporting and emerging patterns
- three separate narrative variants of the same result:
  - Direct
  - Supportive
  - Insight

The user selects the summary that feels most accurate. That feedback helps SoulScope learn how each person prefers information to be communicated.

## Technical Architecture

SoulScope currently includes:
- a **frontend** application
- a **backend** analysis service
- **Supabase** for persistence
- **Vercel** deployment support
- a governed **Growth Studio agent foundation** for approval-gated campaign planning, brand review, community triage, referrals, ads, and analytics

The Growth Studio is isolated from the analysis engine. Its agents create structured proposals only; live publishing, messaging, advertising, and reward issuance remain disabled until server-side integrations and approvals are configured. See [`docs/growth-studio-agents.md`](docs/growth-studio-agents.md).

### Result Model
One scan should map to:
1. raw scan signals
2. interpreted dimensions/domains
3. one canonical pattern result
4. three narrative variants
5. one saved user preference

## Data Model Direction

The product is moving toward normalized persistence for:
- scans
- canonical pattern matches
- story variants
- selected story preferences

This supports:
- better history views
- better preference learning
- cleaner analytics
- more personalized reporting over time

## Design Standard

SoulScope should not feel like:
- a prototype
- a corporate health dashboard
- a spiritual toy
- a debug-heavy internal tool

It should feel like:
- a thoughtful private system
- a category-defining product
- a premium personal insight experience

## Development Priorities

Current priorities:
- pattern-first dashboard experience
- premium language and hierarchy
- better scan discrimination so different scans do not collapse into the same pattern
- cleaner logged-in home flow
- preference learning through narrative selection
- continued reduction of note-first user-facing language

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### One-command startup

If your repo includes a start script, use that from the repo root:

```bash
./start-dev.sh
```

## Notes

- The repo includes a large set of checked-in image and reference assets.
- Scan quality still depends heavily on microphone capture quality and environment noise.
- Supabase is used when available, but local fallback behavior is supported.
