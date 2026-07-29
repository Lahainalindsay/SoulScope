"""Immutable contracts shared by every SoulScope reasoning stage."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


Direction = Literal["elevated", "reduced", "stable", "mixed", "unavailable"]


class ImmutableModel(BaseModel):
    model_config = ConfigDict(frozen=True)


class EngineVersions(ImmutableModel):
    engine_version: str
    registry_version: str
    feature_version: str
    rule_version: str


class EvidenceRecord(ImmutableModel):
    evidence_id: str
    feature_source: str
    observation: str
    direction: Direction
    magnitude: Optional[float] = None
    quality: str
    baseline: Optional[Dict[str, Any]] = None
    confidence: float = Field(ge=0.0, le=1.0)
    support: List[str] = Field(default_factory=list)
    contradiction: List[str] = Field(default_factory=list)
    confounds: List[str] = Field(default_factory=list)
    timestamp: str
    extractor_version: str


class EvidenceLedger(ImmutableModel):
    ledger_id: str
    scan_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    records: List[EvidenceRecord] = Field(default_factory=list)
    versions: EngineVersions


class CandidateDecision(ImmutableModel):
    candidate_id: str
    status: Literal["selected", "rejected", "unresolved"]
    reasons_won: List[str] = Field(default_factory=list)
    reasons_lost: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    contradictory_evidence: List[str] = Field(default_factory=list)
    missing_evidence: List[str] = Field(default_factory=list)
    confounds: List[str] = Field(default_factory=list)


class DecisionLedger(ImmutableModel):
    ledger_id: str
    scan_id: str
    evaluated_dimensions: List[str] = Field(default_factory=list)
    candidate_states: List[CandidateDecision] = Field(default_factory=list)
    selected_result: Optional[str] = None
    engine_version: str
    rule_version: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
