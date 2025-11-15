# backend/main.py
from datetime import datetime, timezone
from typing import Dict, Literal, Optional
from uuid import uuid4

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from corescope.core_frequency.core_frequency import fuse_core_frequency
from corescope.core_frequency.models import (
    PhysioTimeSeries,
    VoiceFeatures,
    ReactivityMetrics,
)

app = FastAPI()

# Allow your React dev server to talk to this API
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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


@app.get("/api/core-frequency/mock", response_model=CoreFrequencyResponse)
def get_mock_core_frequency():
    # For now just return fake data that matches what the UI expects
    return CoreFrequencyResponse(
        core_index=0.63,
        body_resonance=0.58,
        soul_resonance=0.71,
        heart_mind_resonance=0.54,
        qualitative_label="Adaptive but Strained",
    )


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


@app.post("/api/sensors/check", response_model=SensorCheckResponse)
def check_sensors():
    sensors = {
        "heart": SensorSnapshot(
            status="stable",
            detail="Clean PPG waveform locked for 12 seconds.",
        ),
        "eda": SensorSnapshot(
            status="stable",
            detail="Skin conductance drift within ±0.12 μS.",
        ),
        "breath": SensorSnapshot(
            status="stable",
            detail="Breathing belt optional signal detected.",
        ),
    }
    preview = SensorPreview(
        heart_rate=72,
        hrv_rmssd=41.0,
        eda_drift=0.12,
        breath_rate=12.0,
    )
    ready = True
    return SensorCheckResponse(ready=ready, sensors=sensors, preview=preview)


PhaseLiteral = Literal["baseline", "challenge", "recovery"]


class PhaseStartRequest(BaseModel):
    duration_seconds: Optional[int] = None


class PhaseStartResponse(BaseModel):
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
    "challenge": "Mark timestamps for emotional recall window.",
    "recovery": "Guide inhale 4 / exhale 6 to observe recovery index.",
}


@app.post("/api/phases/{phase}/start", response_model=PhaseStartResponse)
def start_phase(phase: PhaseLiteral, payload: PhaseStartRequest):
    if phase not in PHASE_DEFAULTS:
        raise HTTPException(status_code=404, detail="Unknown phase")
    duration = payload.duration_seconds or PHASE_DEFAULTS[phase]
    return PhaseStartResponse(
        phase=phase,
        duration_seconds=duration,
        started_at=datetime.now(timezone.utc),
        instructions=PHASE_INSTRUCTIONS[phase],
    )


class VoiceClipRequest(BaseModel):
    prompt_label: str
    script: str


class VoiceClipResponse(BaseModel):
    clip_id: str
    status: Literal["saved", "error"] = "saved"


@app.post("/api/voice-clips", response_model=VoiceClipResponse)
def save_voice_clip(payload: VoiceClipRequest):
    # In production you would persist the audio and return storage metadata.
    clip_id = f"clip_{uuid4().hex}"
    return VoiceClipResponse(clip_id=clip_id)


def _mock_physio_timeseries() -> PhysioTimeSeries:
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


def _mock_reactivity_metrics() -> ReactivityMetrics:
    return ReactivityMetrics(
        baseline_hrv_rmssd=56.0,
        challenge_hrv_rmssd=34.0,
        baseline_eda_mean=0.28,
        challenge_eda_mean=0.41,
        baseline_breath_rate=11.5,
        challenge_breath_rate=17.0,
        recovery_index=0.62,
    )


@app.post("/api/scan/finalize", response_model=CoreFrequencyResponse)
def finalize_scan():
    """
    Assemble mocked PhysioTimeSeries, VoiceFeatures, and ReactivityMetrics and
    return the fused core frequency result. Replace the mock generators with
    real data captures once the hardware integrations are complete.
    """
    physio_ts = _mock_physio_timeseries()
    voice_features = _mock_voice_features()
    reactivity = _mock_reactivity_metrics()

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
