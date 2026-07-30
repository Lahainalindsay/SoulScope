import json
from pathlib import Path

from pydantic import ValidationError
import pytest

from corescope.engine.resonance import (
    HistoricalResonantField,
    ResonantAxis,
    ResonantFieldInput,
    ResonantPlottedPoint,
    build_resonant_field_geometry,
    build_resonant_history_geometry,
)


FIXTURE_PATH = Path(__file__).parent / "fixtures" / "resonant_field" / "cases.json"
ROLES = ["primary", "supporting", "contradictory"]


def load_fixtures():
    return json.loads(FIXTURE_PATH.read_text())


def fixture_case(case_id: str) -> dict:
    fixtures = load_fixtures()
    return next(case for case in fixtures["cases"] if case["caseId"] == case_id)


def field_input(case_id: str) -> ResonantFieldInput:
    fixtures = load_fixtures()
    case = next(case for case in fixtures["cases"] if case["caseId"] == case_id)
    axes = [
        ResonantAxis(
            axis_id=axis_id,
            value=value,
            confidence=case["axisConfidence"],
            uncertainty=case["uncertainty"],
            evidence_coverage=case["coverage"],
        )
        for axis_id, value in zip(fixtures["axisIds"], case["axes"])
    ]
    points = [
        ResonantPlottedPoint(
            point_id=f"{axis_id}:{role}",
            axis_id=axis_id,
            value=case["points"][axis_index][role_index],
            confidence=max(0.0, case["axisConfidence"] - role_index * 0.04),
            role=role,
        )
        for axis_index, axis_id in enumerate(fixtures["axisIds"])
        for role_index, role in enumerate(ROLES)
    ]
    return ResonantFieldInput(
        result_id=case["resultId"],
        generated_at="2026-07-30T00:00:00+00:00",
        geometry_version="fixture-contract-v0.1",
        axes=axes,
        plotted_points=points,
        overall_confidence=case["overallConfidence"],
        unresolved=case["unresolved"],
    )


def shifted_input(case_id: str, result_id: str, delta: float) -> ResonantFieldInput:
    base = field_input(case_id)
    axes = [axis.model_copy(update={"value": max(0.0, min(1.0, axis.value + delta))}) for axis in base.axes]
    points = [point.model_copy(update={"value": max(0.0, min(1.0, point.value + delta))}) for point in base.plotted_points]
    return base.model_copy(update={"result_id": result_id, "axes": axes, "plotted_points": points})


def dominant_axis(geometry):
    totals = {}
    for source in geometry.sources:
        totals[source.axis_id] = totals.get(source.axis_id, 0.0) + abs(source.amplitude)
    return max(totals, key=totals.get)


def test_geometry_input_contract_requires_six_axes_and_eighteen_points():
    valid = field_input("evenly_balanced_result")

    assert len(valid.axes) == 6
    assert len(valid.plotted_points) == 18

    with pytest.raises(ValidationError, match="exactly six"):
        ResonantFieldInput(
            result_id="bad",
            generated_at="2026-07-30T00:00:00+00:00",
            geometry_version="fixture-contract-v0.1",
            axes=valid.axes[:5],
            plotted_points=valid.plotted_points,
            overall_confidence=0.8,
            unresolved=False,
        )

    with pytest.raises(ValidationError, match="exactly eighteen"):
        ResonantFieldInput(
            result_id="bad",
            generated_at="2026-07-30T00:00:00+00:00",
            geometry_version="fixture-contract-v0.1",
            axes=valid.axes,
            plotted_points=valid.plotted_points[:17],
            overall_confidence=0.8,
            unresolved=False,
        )


def test_field_geometry_uses_completed_result_contract_not_loose_scan_arguments():
    with pytest.raises(TypeError):
        build_resonant_field_geometry(scan_id="scan-1", points=[])


def test_frozen_fixture_snapshots_produce_semantic_geometry_only():
    for case in load_fixtures()["cases"]:
        geometry = build_resonant_field_geometry(field_input(case["caseId"]), contour_angle_steps=36, contour_radial_steps=24)
        expected = case["expectedGeometrySnapshot"]
        dumped = geometry.model_dump()

        assert geometry.version == "resonant-field-geometry-v0.1.0"
        assert len(geometry.sources) == expected["sourceCount"]
        assert geometry.symmetry.order == expected["symmetryOrder"]
        assert len(geometry.contours) == expected["contourCount"]
        assert geometry.bounds.min_x == -1.0
        assert "svg" not in dumped
        assert "canvas" not in dumped
        assert "image_data" not in dumped
        assert "samples" not in dumped
        assert "color" not in dumped
        assert "glow" not in dumped

        if expected["expectedDominantAxis"]:
            assert dominant_axis(geometry) == expected["expectedDominantAxis"]


def test_identical_input_always_produces_identical_geometry():
    source = field_input("two_reinforcing_points")
    first = build_resonant_field_geometry(source, contour_angle_steps=36, contour_radial_steps=24)
    second = build_resonant_field_geometry(source, contour_angle_steps=36, contour_radial_steps=24)

    assert first == second


def test_similar_inputs_produce_related_but_not_identical_fields():
    original = build_resonant_field_geometry(field_input("gradual_recovery_over_time"), contour_angle_steps=36, contour_radial_steps=24)
    shifted = build_resonant_field_geometry(shifted_input("gradual_recovery_over_time", "fixture-recovery-2", 0.03), contour_angle_steps=36, contour_radial_steps=24)

    assert original.seed != shifted.seed
    assert dominant_axis(original) == dominant_axis(shifted)
    assert abs(original.sources[0].amplitude - shifted.sources[0].amplitude) < 0.04


def test_low_confidence_and_unresolved_results_do_not_look_complete_or_authoritative():
    balanced = build_resonant_field_geometry(field_input("evenly_balanced_result"), contour_angle_steps=36, contour_radial_steps=24)
    low_confidence = build_resonant_field_geometry(field_input("low_confidence_result"), contour_angle_steps=36, contour_radial_steps=24)
    unresolved = build_resonant_field_geometry(field_input("unresolved_result"), contour_angle_steps=36, contour_radial_steps=24)

    assert max(abs(source.amplitude) for source in low_confidence.sources) < max(abs(source.amplitude) for source in balanced.sources)
    assert max(abs(source.amplitude) for source in unresolved.sources) < max(abs(source.amplitude) for source in low_confidence.sources)
    assert max(contour.confidence for contour in unresolved.contours) < max(contour.confidence for contour in balanced.contours)


def test_every_contour_has_explicit_provenance():
    source = field_input("one_strongly_dominant_axis")
    geometry = build_resonant_field_geometry(source, contour_angle_steps=36, contour_radial_steps=24)

    for contour in geometry.contours:
        assert contour.provenance.contributing_result_ids == [source.result_id]
        assert contour.provenance.axis_ids
        assert contour.provenance.plotted_point_ids
        assert contour.provenance.confidence_values
        assert contour.provenance.recurrence_count == 1
        assert contour.provenance.recency_weight == 1.0
        assert contour.provenance.geometry_engine_version == geometry.version


def test_history_separates_recurring_structure_from_current_light():
    repeated_old = shifted_input("repeated_historical_result", "fixture-repeat-0", -0.01)
    repeated_recent = shifted_input("repeated_historical_result", "fixture-repeat-2", 0.02)
    deviation = field_input("sudden_recent_deviation")
    fields = [
        HistoricalResonantField(input=repeated_old, geometry=build_resonant_field_geometry(repeated_old, contour_angle_steps=36, contour_radial_steps=24), age_days=90),
        HistoricalResonantField(input=repeated_recent, geometry=build_resonant_field_geometry(repeated_recent, contour_angle_steps=36, contour_radial_steps=24), age_days=25),
        HistoricalResonantField(input=deviation, geometry=build_resonant_field_geometry(deviation, contour_angle_steps=36, contour_radial_steps=24), age_days=0),
    ]

    history = build_resonant_history_geometry("user-1", fields, similarity_threshold=0.18, light_half_life_days=30)

    assert len(history.clusters) >= 2
    assert history.structural_layer
    assert history.light_layer
    recurring_structure = max(history.structural_layer, key=lambda region: region.provenance.recurrence_count)
    recent_light = max(history.light_layer, key=lambda region: region.activity_weight)
    old_light = next(region for region in history.light_layer if region.result_id == repeated_old.result_id)

    assert recurring_structure.provenance.recurrence_count == 2
    assert recent_light.result_id == deviation.result_id
    assert old_light.activity_weight < recent_light.activity_weight


def test_history_clusters_gradual_recovery_as_movement_not_random_replacement():
    first = shifted_input("gradual_recovery_over_time", "fixture-recovery-early", -0.04)
    second = shifted_input("gradual_recovery_over_time", "fixture-recovery-middle", 0.0)
    third = shifted_input("gradual_recovery_over_time", "fixture-recovery-late", 0.04)
    fields = [
        HistoricalResonantField(input=first, geometry=build_resonant_field_geometry(first, contour_angle_steps=36, contour_radial_steps=24), age_days=60),
        HistoricalResonantField(input=second, geometry=build_resonant_field_geometry(second, contour_angle_steps=36, contour_radial_steps=24), age_days=30),
        HistoricalResonantField(input=third, geometry=build_resonant_field_geometry(third, contour_angle_steps=36, contour_radial_steps=24), age_days=0),
    ]

    history = build_resonant_history_geometry("user-1-recovery", fields, similarity_threshold=0.2, light_half_life_days=30)

    assert len(history.clusters) == 1
    assert history.structural_layer[0].provenance.recurrence_count == 3
    assert history.structural_layer[0].thickness > 0.55
    newest = next(region for region in history.light_layer if region.result_id == third.result_id)
    oldest = next(region for region in history.light_layer if region.result_id == first.result_id)
    assert newest.activity_weight > oldest.activity_weight


def test_resonant_field_contracts_are_immutable():
    geometry = build_resonant_field_geometry(field_input("evenly_balanced_result"), contour_angle_steps=36, contour_radial_steps=24)

    with pytest.raises((TypeError, ValidationError)):
        geometry.sources[0].amplitude = 0.1
