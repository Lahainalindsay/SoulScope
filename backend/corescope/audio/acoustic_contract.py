"""Canonical acoustic measurement contract for SoulScope.

Praat-Parselmouth is approved only for hosted server-side extraction. Do not
bundle this module or its GPL-covered runtime dependencies into client software.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


CaptureKind = Literal[
    "sustained_vowel",
    "guided_speech",
    "neutral_baseline",
    "challenge_response",
    "recovery_response",
]
QualityLevel = Literal["high", "good", "limited", "poor"]


ACOUSTIC_SCHEMA_VERSION = "soulscope.acoustic.v1"
PRAAT_EXTRACTOR_VERSION = "praat-parselmouth-0.4.6/soulscope-1.0.0"


class AcousticFeatureMeasurement(BaseModel):
    feature_id: str
    feature_version: str = "1.0.0"
    value: Optional[float]
    unit: Optional[str]
    method: str
    source_capture_id: str
    capture_kind: CaptureKind
    segment_start_ms: int
    segment_end_ms: int
    quality: QualityLevel
    confidence: float = Field(ge=0.0, le=1.0)
    rejection_reason: Optional[str] = None
    extractor: str
    extractor_version: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    device_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class VadSegment(BaseModel):
    kind: Literal["speech", "silence", "leading_silence", "internal_pause", "trailing_silence"]
    start_ms: int
    end_ms: int
    confidence: float = Field(ge=0.0, le=1.0)


class AcousticAnalysisResponse(BaseModel):
    schema_version: str = ACOUSTIC_SCHEMA_VERSION
    scan_id: str
    user_id: str
    source_capture_id: str
    capture_kind: CaptureKind
    storage_path: Optional[str] = None
    retention_policy: str
    original_content_type: str
    canonical_format: str
    duration_ms: int
    sample_rate_hz: int
    channel_count: int
    extractor: str = "praat-parselmouth"
    extractor_version: str = PRAAT_EXTRACTOR_VERSION
    quality: QualityLevel
    confidence: float = Field(ge=0.0, le=1.0)
    failure_reason: Optional[str] = None
    features: List[AcousticFeatureMeasurement] = Field(default_factory=list)
    vad_segments: List[VadSegment] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
