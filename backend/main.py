# backend/main.py
import json
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from uuid import uuid4

import numpy as np
import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from corescope.audio.acoustic_contract import AcousticAnalysisResponse, CaptureKind
from corescope.audio.acoustic_extractor import analyze_upload_file
from corescope.core_frequency.models import (
    PhysioTimeSeries,
    ReactivityMetrics,
)

app = FastAPI()

# Allow local development, the production frontend, and Vercel preview deployments.
# Preview URLs change per deployment, so use a constrained regex rather than manually
# updating Render for every preview hostname.
configured_origins = [origin.strip().rstrip("/") for origin in os.getenv("SOULSCOPE_ALLOWED_ORIGINS", "").split(",") if origin.strip()]
origins = configured_origins or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://soul-scope-lime.vercel.app",
]
vercel_origin_regex = os.getenv(
    "SOULSCOPE_ALLOWED_ORIGIN_REGEX",
    r"https://[a-zA-Z0-9-]+\.vercel\.app",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=vercel_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRIVATE_AUDIO_ROOT = Path(os.getenv("SOULSCOPE_PRIVATE_AUDIO_ROOT", "backend/.private_audio"))
REQUIRE_SUPABASE_AUTH = os.getenv("SOULSCOPE_REQUIRE_SUPABASE_AUTH", "true").lower() != "false"
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")


class CoreFrequencyResponse(BaseModel):
    core_index: float
    body_resonance: float
    soul_resonance: float
    heart_mind_resonance: float
    qualitative_label: str


async def _authenticate_user(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        if REQUIRE_SUPABASE_AUTH:
            raise HTTPException(status_code=401, detail="Missing bearer token")
        return "local-dev-user"
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        if REQUIRE_SUPABASE_AUTH:
            raise HTTPException(status_code=500, detail="Supabase auth is not configured")
        return "local-dev-user"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{SUPABASE_URL.rstrip('/')}/auth/v1/user",
                headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Could not verify Supabase session") from exc
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Supabase session")
    payload = response.json()
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid Supabase user")
    return user_id


async def _verify_scan_ownership(scan_id: str, user_id: str, authorization: Optional[str]) -> None:
    """Use the caller's bearer token and RLS-backed REST query to enforce ownership."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not authorization:
        if REQUIRE_SUPABASE_AUTH:
            raise HTTPException(status_code=500, detail="Scan ownership verification is not configured")
        return
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{SUPABASE_URL.rstrip('/')}/rest/v1/scan_sessions",
                params={"id": f"eq.{scan_id}", "select": "id,user_id"},
                headers={"apikey": SUPABASE_ANON_KEY, "Authorization": authorization},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Could not verify scan ownership") from exc
    if response.status_code != 200:
        raise HTTPException(status_code=503, detail="Could not verify scan ownership")
    rows = response.json()
    if not isinstance(rows, list) or not rows or rows[0].get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Scan is not owned by the authenticated user")


# ---------------------------------------------------------------------------
# Sensor + Session bootstrap
# ---------------------------------------------------------------------------
SensorStatus = Literal["idle", "checking", "stable"]


class SensorSnapshot(BaseModel):
    status: SensorStatus
    detail: str


class SensorPreview(BaseModel):
    heart_rate: int
    hrv_rmssd: float
    eda_drift: float
    breath_rate: Optional[float] = None


class SensorCheckResponse(BaseModel):
    ready: bool
    sensors: Dict[str, SensorSnapshot]
    preview: SensorPreview
    session_id: str


SESSIONS: Dict[str, Dict] = {}


@app.post("/api/sensors/check", response_model=SensorCheckResponse)
def check_sensors():
    session_id = uuid4().hex
    SESSIONS[session_id] = {
        "physio": [],
        "voice_prompts": [],
        "reactivity": {},
    }
    sensors = {
        "heart": SensorSnapshot(
            status="stable",
            detail="Camera PPG waveform locked for 10s.",
        ),
        "eda": SensorSnapshot(
            status="stable",
            detail="Micro hand tremor + temp proxies steady.",
        ),
        "breath": SensorSnapshot(
            status="stable",
            detail="Mic + accelerometer breath cadence detected.",
        ),
    }
    preview = SensorPreview(
        heart_rate=72,
        hrv_rmssd=41.0,
        eda_drift=0.12,
        breath_rate=12.0,
    )
    return SensorCheckResponse(
        ready=True,
        sensors=sensors,
        preview=preview,
        session_id=session_id,
    )


# ---------------------------------------------------------------------------
# Phase handling
# ---------------------------------------------------------------------------
PhaseLiteral = Literal["baseline", "challenge", "recovery"]


class PhaseStartRequest(BaseModel):
    session_id: str
    duration_seconds: Optional[int] = None


class PhaseStartResponse(BaseModel):
    session_id: str
    phase: PhaseLiteral
    duration_seconds: int
    started_at: datetime
    instructions: str


PHASE_DEFAULTS: Dict[PhaseLiteral, int] = {
    "baseline": 120,
    "challenge": 120,
    "recovery": 90,
}

PHASE_INSTRUCTIONS: Dict[PhaseLiteral, str] = {
    "baseline": "Capture resting HRV, EDA, and breath cadence.",
    "challenge": "Guide gentle emotional recall and mark the peak window.",
    "recovery": "Coach inhale 4 / exhale 6 breathing to watch recovery index.",
}


@app.post("/api/phases/{phase}/start", response_model=PhaseStartResponse)
def start_phase(phase: PhaseLiteral, payload: PhaseStartRequest):
    if phase not in PHASE_DEFAULTS:
        raise HTTPException(status_code=404, detail="Unknown phase")
    if payload.session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session")
    duration = payload.duration_seconds or PHASE_DEFAULTS[phase]
    SESSIONS[payload.session_id]["current_phase"] = phase
    return PhaseStartResponse(
        session_id=payload.session_id,
        phase=phase,
        duration_seconds=duration,
        started_at=datetime.now(timezone.utc),
        instructions=PHASE_INSTRUCTIONS[phase],
    )


# ---------------------------------------------------------------------------
# Voice prompts + physio ingestion
# ---------------------------------------------------------------------------
class VoiceClipRequest(BaseModel):
    session_id: str
    prompt_label: str
    script: str


class VoiceClipResponse(BaseModel):
    clip_id: str
    status: Literal["saved", "error"] = "saved"


@app.post("/api/voice-clips", response_model=VoiceClipResponse)
def save_voice_clip(payload: VoiceClipRequest):
    if payload.session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session")
    clip_id = f"clip_{uuid4().hex}"
    SESSIONS[payload.session_id]["voice_prompts"].append(
        {"prompt": payload.prompt_label, "script": payload.script, "clip_id": clip_id}
    )
    return VoiceClipResponse(clip_id=clip_id)


@app.post("/api/acoustic/analyze", response_model=AcousticAnalysisResponse)
async def analyze_voice_audio(
    file: UploadFile = File(...),
    scan_id: str = Form(...),
    source_capture_id: str = Form(...),
    capture_kind: CaptureKind = Form(...),
    device_metadata: str = Form("{}"),
    authorization: Optional[str] = Header(default=None),
):
    user_id = await _authenticate_user(authorization)
    await _verify_scan_ownership(scan_id, user_id, authorization)
    content_type = file.content_type or "application/octet-stream"
    if content_type not in {
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
    }:
        raise HTTPException(status_code=415, detail="Unsupported audio content type; submit canonical PCM WAV")
    try:
        metadata = json.loads(device_metadata) if device_metadata else {}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid device metadata") from exc
    if not isinstance(metadata, dict):
        raise HTTPException(status_code=400, detail="Device metadata must be an object")
    upload_bytes = await file.read()
    try:
        return analyze_upload_file(
            upload_bytes,
            filename=file.filename or "capture",
            content_type=content_type,
            private_root=PRIVATE_AUDIO_ROOT,
            user_id=user_id,
            scan_id=scan_id,
            source_capture_id=source_capture_id,
            capture_kind=capture_kind,
            device_metadata=metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Canonical acoustic analysis failed") from exc


class PhysioSample(BaseModel):
    timestamp: float
    rr_interval_ms: float
    eda_micro_siemens: Optional[float]
    breath_rate_bpm: Optional[float]


class PhysioIngestRequest(BaseModel):
    session_id: str
    samples: List[PhysioSample] = Field(default_factory=list)


@app.post("/api/physio/ingest")
def ingest_physio(payload: PhysioIngestRequest):
    if payload.session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session")
    SESSIONS[payload.session_id]["physio"].extend(payload.samples)
    return {"received": len(payload.samples)}


class ReactivityUpdate(BaseModel):
    session_id: str
    baseline_hrv_rmssd: Optional[float] = None
    challenge_hrv_rmssd: Optional[float] = None
    baseline_eda_mean: Optional[float] = None
    challenge_eda_mean: Optional[float] = None
    baseline_breath_rate: Optional[float] = None
    challenge_breath_rate: Optional[float] = None
    recovery_index: Optional[float] = None


@app.post("/api/reactivity", response_model=ReactivityUpdate)
def update_reactivity(payload: ReactivityUpdate):
    if payload.session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session")
    SESSIONS[payload.session_id]["reactivity"] = payload.dict()
    return payload


# ---------------------------------------------------------------------------
# Final fusion
# ---------------------------------------------------------------------------
@app.post("/api/scan/finalize", response_model=CoreFrequencyResponse)
def finalize_scan(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Unknown session")
    raise HTTPException(
        status_code=410,
        detail=(
            "Legacy scan finalization is disabled because it used mocked voice features. "
            "Use /api/acoustic/analyze and the canonical SoulScope report pipeline."
        ),
    )


# ---------------------------------------------------------------------------
# Helpers / mocks
# ---------------------------------------------------------------------------
def _build_physio(samples: Optional[List[PhysioSample]]) -> PhysioTimeSeries:
    if samples:
        timestamps = np.array([sample.timestamp for sample in samples])
        rr_intervals = np.array([sample.rr_interval_ms for sample in samples])
        eda = (
            np.array([sample.eda_micro_siemens or 0.0 for sample in samples])
            if any(sample.eda_micro_siemens for sample in samples)
            else None
        )
        breath = (
            np.array([sample.breath_rate_bpm or 0.0 for sample in samples])
            if any(sample.breath_rate_bpm for sample in samples)
            else None
        )
        return PhysioTimeSeries(
            timestamps=timestamps,
            rr_intervals=rr_intervals,
            eda=eda,
            breath_rate=breath,
        )
    duration_seconds = 8 * 60
    timestamps = np.linspace(0, duration_seconds, duration_seconds + 1)
    rr_intervals = 780 + 40 * np.sin(np.linspace(0, 12, timestamps.size))
    eda = 0.25 + 0.03 * np.sin(np.linspace(0, 6, timestamps.size)) + 0.01 * np.random.default_rng(
        42
    ).normal(size=timestamps.size)
    breath_rate = 12 + 1.5 * np.sin(np.linspace(0, 10, timestamps.size))
    return PhysioTimeSeries(
        timestamps=timestamps,
        rr_intervals=rr_intervals,
        eda=eda,
        breath_rate=breath_rate,
    )


def _build_reactivity(payload: Optional[dict]) -> ReactivityMetrics:
    if payload:
        return ReactivityMetrics(
            baseline_hrv_rmssd=payload.get("baseline_hrv_rmssd") or 56.0,
            challenge_hrv_rmssd=payload.get("challenge_hrv_rmssd") or 34.0,
            baseline_eda_mean=payload.get("baseline_eda_mean") or 0.28,
            challenge_eda_mean=payload.get("challenge_eda_mean") or 0.41,
            baseline_breath_rate=payload.get("baseline_breath_rate") or 11.5,
            challenge_breath_rate=payload.get("challenge_breath_rate") or 17.0,
            recovery_index=payload.get("recovery_index") or 0.62,
        )
    return ReactivityMetrics(
        baseline_hrv_rmssd=56.0,
        challenge_hrv_rmssd=34.0,
        baseline_eda_mean=0.28,
        challenge_eda_mean=0.41,
        baseline_breath_rate=11.5,
        challenge_breath_rate=17.0,
        recovery_index=0.62,
    )
