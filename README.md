# SoulScope

SoulScope is a voice-based reflection and resonance app. It guides users through a spoken scan, analyzes vocal pitch and note energy, and returns a personalized results experience built around soul tone, voice mandala, note expression, and grouped vocal-tone patterns.

## Overview

The project currently includes:

- a Next.js frontend for the homepage, scan flow, and results UI
- a FastAPI backend for session, sensor, and fusion endpoints
- Supabase project files for migrations and function scaffolding
- browser-based voice analysis using Web Audio and Meyda

## Features

- redesigned homepage and onboarding flow
- guided multi-prompt voice scan
- browser-side audio analysis
- local fallback results when capture quality is weak
- soul tone card with playable reference tone
- voice mandala visualization
- note key with note frequencies and expression descriptions
- grouped results for base tone, emotional tone, and future tone

## Project Structure

```text
soulscope/
├── backend/
├── frontend/
├── scripts/
├── start-dev.sh
└── supabase/
```

## Local Setup

### Requirements

- Node.js 18+
- Python 3.11+
- npm

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` if needed:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If you are using Supabase locally, keep your public Supabase env vars in this file as well.

### Backend

From the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

## Run Locally

### One-command startup

```bash
./start-dev.sh
```

This starts:

- frontend at `http://localhost:3000`
- backend at `http://localhost:8000`

### Manual startup

Backend:

```bash
cd backend
source ../.venv/bin/activate
PYTHONPATH=. uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev
```

## How The Scan Works

1. The user enters the guided scan.
2. The app records spoken prompt responses.
3. Answers are stored locally in browser session helpers.
4. The analyzing step runs voice-spectrum analysis in the browser.
5. Results are saved locally and optionally to Supabase.
6. The user is routed to the results page.

If the signal is weak, SoulScope can still complete the flow with a fallback result instead of dead-ending.

## Results Experience

The results flow currently includes:

- a soul tone summary card
- a playable tone button
- the voice mandala
- note-by-note expression cards
- grouped prompt-tone summaries

Main files:

- `frontend/pages/results/index.tsx`
- `frontend/pages/results/[id].tsx`
- `frontend/components/ResonanceResultsDashboard.tsx`
- `frontend/components/NoteAuraMap.tsx`

## Voice Analysis

Voice analysis is centered in:

- `frontend/lib/voiceSpectrum.ts`

Current processing includes:

- frame-based audio decoding
- RMS, spectral centroid, flatness, and zero-crossing analysis
- pitch tracking when available
- spectral fallback when pitch tracking is weak
- note-energy mapping across the 12 chromatic notes
- merged analysis across multiple prompts

## Backend

The FastAPI backend in `backend/main.py` currently exposes APIs for:

- sensor/session readiness checks
- phase startup
- voice clip persistence
- physio ingestion
- reactivity updates
- scan finalization through `corescope`

The current user-facing voice scan results are primarily driven by the frontend analysis layer.

## Helpful Commands

Type check:

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
```

Production build:

```bash
cd frontend
npm run build
```

## Notes

- The repo includes a large set of checked-in image and reference assets.
- Scan quality still depends heavily on microphone capture quality and environment noise.
- Supabase is used when available, but local fallback behavior is supported.

## License

See `LICENSE`.
