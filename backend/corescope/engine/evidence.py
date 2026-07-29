"""The only acoustic-feature-to-evidence boundary in Phase A."""

from __future__ import annotations

from typing import Iterable

from corescope.audio.acoustic_contract import AcousticFeatureMeasurement

from .contracts import EvidenceLedger, EvidenceRecord
from .versions import CURRENT_ENGINE_VERSIONS


def build_acoustic_evidence_ledger(
    *,
    scan_id: str,
    source_capture_id: str,
    measurements: Iterable[AcousticFeatureMeasurement],
) -> EvidenceLedger:
    records = []
    for measurement in measurements:
        available = measurement.value is not None and measurement.rejection_reason is None
        confounds = [measurement.rejection_reason] if measurement.rejection_reason else []
        records.append(
            EvidenceRecord(
                evidence_id=f"{source_capture_id}:{measurement.feature_id}:{measurement.feature_version}",
                feature_source=measurement.feature_id,
                observation=(
                    f"Measured {measurement.feature_id} at {measurement.value} {measurement.unit or ''}".strip()
                    if available
                    else f"{measurement.feature_id} was unavailable"
                ),
                direction="stable" if available else "unavailable",
                magnitude=measurement.value,
                quality=measurement.quality,
                baseline=None,
                confidence=measurement.confidence,
                support=[],
                contradiction=[],
                confounds=confounds,
                timestamp=measurement.created_at,
                extractor_version=measurement.extractor_version,
            )
        )
    return EvidenceLedger(
        ledger_id=f"{scan_id}:{source_capture_id}:evidence",
        scan_id=scan_id,
        records=records,
        versions=CURRENT_ENGINE_VERSIONS,
    )
