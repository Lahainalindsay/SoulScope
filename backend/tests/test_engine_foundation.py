from pydantic import ValidationError
import pytest

from corescope.audio.acoustic_contract import AcousticFeatureMeasurement
from corescope.engine.evidence import build_acoustic_evidence_ledger
from corescope.engine.versions import CURRENT_ENGINE_VERSIONS


def measurement(**overrides):
    values = {
        "feature_id": "voice.f0.median",
        "value": 180.0,
        "unit": "Hz",
        "method": "fixture",
        "source_capture_id": "capture-1",
        "capture_kind": "guided_speech",
        "segment_start_ms": 0,
        "segment_end_ms": 3000,
        "quality": "good",
        "confidence": 0.8,
        "extractor": "fixture",
        "extractor_version": "fixture-1",
    }
    values.update(overrides)
    return AcousticFeatureMeasurement(**values)


def test_evidence_ledger_is_deterministic_and_versioned():
    ledger = build_acoustic_evidence_ledger(
        scan_id="scan-1",
        source_capture_id="capture-1",
        measurements=[measurement()],
    )
    assert ledger.ledger_id == "scan-1:capture-1:evidence"
    assert ledger.versions == CURRENT_ENGINE_VERSIONS
    assert ledger.records[0].evidence_id == "capture-1:voice.f0.median:1.0.0"
    assert ledger.records[0].magnitude == 180.0
    assert ledger.records[0].measured_value == 180.0
    assert ledger.records[0].units == "Hz"
    assert ledger.records[0].uncertainty == 0.2
    assert ledger.records[0].missing_evidence is False
    assert ledger.records[0].provenance["source_capture_id"] == "capture-1"


def test_missing_measurements_remain_unavailable_not_neutral():
    ledger = build_acoustic_evidence_ledger(
        scan_id="scan-1",
        source_capture_id="capture-1",
        measurements=[measurement(value=None, confidence=0, quality="poor", rejection_reason="insufficient_signal")],
    )
    record = ledger.records[0]
    assert record.direction == "unavailable"
    assert record.magnitude is None
    assert record.confounds == ["insufficient_signal"]
    assert record.missing_evidence is True


def test_evidence_records_are_immutable():
    record = build_acoustic_evidence_ledger(
        scan_id="scan-1",
        source_capture_id="capture-1",
        measurements=[measurement()],
    ).records[0]
    with pytest.raises((TypeError, ValidationError)):
        record.confidence = 0.2
