# backend/main.py
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from uuid import uuid4

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from corescope.core_frequency.core_frequency import fuse_core_frequency
from corescope.core_frequency.models import (
    PhysioTimeSeries,
    VoiceFeatures,
    ReactivityMetrics,
)

app = FastAPI()

# Allow local dev + production frontends
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://soul-scope-lime.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CoreFrequencyResponse(BaseModel):
    core_index: float
    body_resonance: float
    soul_resonance: float
    heart_mind_resonance: float
    qualitative_label: str


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
    session = SESSIONS[session_id]

    physio_ts = _build_physio(session.get("physio"))
    voice_features = _mock_voice_features()
    reactivity = _build_reactivity(session.get("reactivity"))

    result = fuse_core_frequency(
        physio_ts=physio_ts,
        voice_features=voice_features,
        reactivity=reactivity,
    )

    return CoreFrequencyResponse(
        core_index=round(result.core_index, 4),
        body_resonance=round(result.body_resonance.score, 4),
        soul_resonance=round(result.soul_resonance.score, 4),
        heart_mind_resonance=round(result.heart_mind_resonance.score, 4),
        qualitative_label=result.qualitative_label or "Pending interpretation",
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


def _mock_voice_features() -> VoiceFeatures:
    return VoiceFeatures(
        mean_f0=205.0,
        f0_std=18.0,
        spectral_centroid=3200.0,
        jitter_local=0.35,
        shimmer_local=3.1,
        hnr=19.5,
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
