"""Deterministic semantic geometry for the Resonant Field.

This module is intentionally renderer-free. It accepts completed, normalized
canonical scan results and returns explainable geometry that SVG/WebGL layers
can render later without recalculating meaning.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
import hashlib
import json
import math
from typing import Dict, Iterable, List, Literal, Sequence

from pydantic import Field, model_validator

from corescope.engine.contracts import ImmutableModel


RESONANT_FIELD_VERSION = "resonant-field-geometry-v0.1.0"
HISTORY_AGGREGATION_VERSION = "resonant-history-aggregation-v0.1.0"
AXIS_COUNT = 6
POINTS_PER_AXIS = 3
BOUNDS = {"min_x": -1.0, "min_y": -1.0, "max_x": 1.0, "max_y": 1.0}

PointRole = Literal["primary", "supporting", "contradictory"]


class ResonantAxis(ImmutableModel):
    axis_id: str
    value: float = Field(ge=-1.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    uncertainty: float = Field(ge=0.0, le=1.0)
    evidence_coverage: float = Field(ge=0.0, le=1.0)


class ResonantPlottedPoint(ImmutableModel):
    point_id: str
    axis_id: str
    value: float = Field(ge=-1.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    role: PointRole


class ResonantFieldInput(ImmutableModel):
    result_id: str
    generated_at: str
    geometry_version: str
    axes: List[ResonantAxis]
    plotted_points: List[ResonantPlottedPoint]
    overall_confidence: float = Field(ge=0.0, le=1.0)
    unresolved: bool

    @model_validator(mode="after")
    def validate_completed_geometry_contract(self) -> "ResonantFieldInput":
        if len(self.axes) != AXIS_COUNT:
            raise ValueError("ResonantFieldInput requires exactly six resolved axes.")

        axis_ids = [axis.axis_id for axis in self.axes]
        if len(set(axis_ids)) != AXIS_COUNT:
            raise ValueError("ResonantFieldInput axis_id values must be unique.")

        if len(self.plotted_points) != AXIS_COUNT * POINTS_PER_AXIS:
            raise ValueError("ResonantFieldInput requires exactly eighteen plotted points.")

        grouped: Dict[str, List[ResonantPlottedPoint]] = defaultdict(list)
        for point in self.plotted_points:
            if point.axis_id not in axis_ids:
                raise ValueError(f"Plotted point {point.point_id} references unknown axis {point.axis_id}.")
            grouped[point.axis_id].append(point)

        for axis_id in axis_ids:
            if len(grouped[axis_id]) != POINTS_PER_AXIS:
                raise ValueError(f"Axis {axis_id} requires exactly three plotted points.")

        return self


class GeometryPoint(ImmutableModel):
    x: float
    y: float


class Bounds(ImmutableModel):
    min_x: float
    min_y: float
    max_x: float
    max_y: float


class WaveSource(ImmutableModel):
    source_id: str
    result_id: str
    axis_id: str
    point_id: str
    role: PointRole
    axis_index: int
    point_index: int
    position: GeometryPoint
    amplitude: float
    frequency: float
    phase: float
    radius: float
    confidence: float
    uncertainty: float
    evidence_coverage: float


class ScalarFieldDefinition(ImmutableModel):
    field_type: Literal["radial_wave_interference"]
    equation: str
    contour_angle_steps: int
    contour_radial_steps: int
    levels: List[float]
    source_ids: List[str]
    normalization: str


class ContourProvenance(ImmutableModel):
    contributing_result_ids: List[str]
    axis_ids: List[str]
    plotted_point_ids: List[str]
    confidence_values: List[float]
    recurrence_count: int
    recency_weight: float
    geometry_engine_version: str


class ResonantContour(ImmutableModel):
    contour_id: str
    level: float
    points: List[GeometryPoint]
    strength: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    source_axis_ids: List[str]
    provenance: ContourProvenance


class SymmetryDefinition(ImmutableModel):
    order: Literal[6]
    rotation_offset: float


class ResonantFieldGeometry(ImmutableModel):
    version: str
    seed: str
    center: GeometryPoint
    sources: List[WaveSource]
    scalar_field: ScalarFieldDefinition
    contours: List[ResonantContour]
    symmetry: SymmetryDefinition
    bounds: Bounds


class HistoricalResonantField(ImmutableModel):
    input: ResonantFieldInput
    geometry: ResonantFieldGeometry
    age_days: float = Field(ge=0.0)
    relevance: float = Field(default=1.0, ge=0.0, le=1.0)


class GeometryCluster(ImmutableModel):
    cluster_id: str
    member_result_ids: List[str]
    centroid_axes: Dict[str, float]
    recurrence_count: int
    average_similarity: float = Field(ge=0.0, le=1.0)
    persistence: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    contributing_axis_ids: List[str]


class StructuralRegion(ImmutableModel):
    region_id: str
    cluster_id: str
    contour_ids: List[str]
    contributing_result_ids: List[str]
    thickness: float = Field(ge=0.0, le=1.0)
    continuity: float = Field(ge=0.0, le=1.0)
    stability: float = Field(ge=0.0, le=1.0)
    prominence: float = Field(ge=0.0, le=1.0)
    provenance: ContourProvenance


class LightRegion(ImmutableModel):
    region_id: str
    result_id: str
    contour_ids: List[str]
    activity_weight: float = Field(ge=0.0, le=1.0)
    recency_weight: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    provenance: ContourProvenance


class ResonantHistoryGeometry(ImmutableModel):
    version: str
    history_id: str
    generated_at: str
    geometry_engine_version: str
    history_aggregation_version: str
    clusters: List[GeometryCluster]
    structural_layer: List[StructuralRegion]
    light_layer: List[LightRegion]
    contributor_result_ids: List[str]
    bounds: Bounds


def build_resonant_field_geometry(
    field_input: ResonantFieldInput,
    *,
    contour_angle_steps: int = 72,
    contour_radial_steps: int = 48,
    contour_levels: Sequence[float] = (0.24, 0.36, 0.48, 0.60, 0.72),
) -> ResonantFieldGeometry:
    """Translate a completed canonical result into semantic wave geometry."""

    if contour_angle_steps < 12:
        raise ValueError("contour_angle_steps must be at least 12.")
    if contour_radial_steps < 8:
        raise ValueError("contour_radial_steps must be at least 8.")

    levels = [round(float(level), 4) for level in contour_levels]
    seed = _stable_seed(field_input)
    rotation_offset = 0.0
    sources = _build_wave_sources(field_input, rotation_offset)
    contours = _extract_radial_contours(
        field_input=field_input,
        sources=sources,
        levels=levels,
        contour_angle_steps=contour_angle_steps,
        contour_radial_steps=contour_radial_steps,
    )

    return ResonantFieldGeometry(
        version=RESONANT_FIELD_VERSION,
        seed=seed,
        center=GeometryPoint(x=0.0, y=0.0),
        sources=sources,
        scalar_field=ScalarFieldDefinition(
            field_type="radial_wave_interference",
            equation="abs(sum(amplitude * cos(frequency * distance + phase) * exp(-distance / radius))) / normalization",
            contour_angle_steps=contour_angle_steps,
            contour_radial_steps=contour_radial_steps,
            levels=levels,
            source_ids=[source.source_id for source in sources],
            normalization="sum(abs(source.amplitude)) with unresolved attenuation retained",
        ),
        contours=contours,
        symmetry=SymmetryDefinition(order=6, rotation_offset=rotation_offset),
        bounds=Bounds(**BOUNDS),
    )


def build_resonant_history_geometry(
    history_id: str,
    fields: Sequence[HistoricalResonantField],
    *,
    similarity_threshold: float = 0.24,
    light_half_life_days: float = 30.0,
) -> ResonantHistoryGeometry:
    """Aggregate semantic fields into structural and current-activity layers."""

    if not fields:
        raise ValueError("build_resonant_history_geometry requires at least one historical field.")
    if not 0.0 < similarity_threshold <= 1.0:
        raise ValueError("similarity_threshold must be in the range (0, 1].")
    if light_half_life_days <= 0:
        raise ValueError("light_half_life_days must be positive.")

    clusters = _cluster_fields(fields, similarity_threshold)
    structural_layer = [_build_structural_region(cluster, fields) for cluster in clusters]
    light_layer = [
        _build_light_region(item, light_half_life_days)
        for item in sorted(fields, key=lambda field: (field.age_days, field.input.result_id))
    ]

    return ResonantHistoryGeometry(
        version=HISTORY_AGGREGATION_VERSION,
        history_id=history_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        geometry_engine_version=RESONANT_FIELD_VERSION,
        history_aggregation_version=HISTORY_AGGREGATION_VERSION,
        clusters=clusters,
        structural_layer=structural_layer,
        light_layer=light_layer,
        contributor_result_ids=[field.input.result_id for field in fields],
        bounds=Bounds(**BOUNDS),
    )


def _stable_seed(field_input: ResonantFieldInput) -> str:
    payload = {
        "result_id": field_input.result_id,
        "geometry_version": field_input.geometry_version,
        "axes": [axis.model_dump() for axis in field_input.axes],
        "plotted_points": [point.model_dump() for point in field_input.plotted_points],
        "overall_confidence": field_input.overall_confidence,
        "unresolved": field_input.unresolved,
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:24]


def _build_wave_sources(field_input: ResonantFieldInput, rotation_offset: float) -> List[WaveSource]:
    axis_by_id = {axis.axis_id: axis for axis in field_input.axes}
    axis_index_by_id = {axis.axis_id: index for index, axis in enumerate(field_input.axes)}
    points_by_axis: Dict[str, List[ResonantPlottedPoint]] = defaultdict(list)
    for point in field_input.plotted_points:
        points_by_axis[point.axis_id].append(point)

    sources: List[WaveSource] = []
    for axis in field_input.axes:
        axis_index = axis_index_by_id[axis.axis_id]
        base_angle = rotation_offset + axis_index * (2.0 * math.pi / AXIS_COUNT)
        role_order = {"primary": 0, "supporting": 1, "contradictory": 2}
        for point_index, point in enumerate(sorted(points_by_axis[axis.axis_id], key=lambda item: (role_order[item.role], item.point_id))):
            role_offset = {"primary": 0.0, "supporting": 0.08, "contradictory": -0.08}[point.role]
            role_weight = {"primary": 1.0, "supporting": 0.76, "contradictory": 0.58}[point.role]
            signed_axis_value = _to_unit(axis.value)
            signed_point_value = _to_unit(point.value)
            radial_position = 0.22 + 0.68 * ((signed_axis_value + signed_point_value) / 2.0)
            angle = base_angle + role_offset
            confidence = _clamp01(axis.confidence * point.confidence * field_input.overall_confidence)
            unresolved_factor = 0.36 if field_input.unresolved else 1.0
            amplitude = _round6(signed_point_value * role_weight * confidence * axis.evidence_coverage * unresolved_factor)
            if point.role == "contradictory":
                amplitude *= -1.0

            sources.append(
                WaveSource(
                    source_id=f"{field_input.result_id}:{axis.axis_id}:{point.point_id}",
                    result_id=field_input.result_id,
                    axis_id=axis.axis_id,
                    point_id=point.point_id,
                    role=point.role,
                    axis_index=axis_index,
                    point_index=point_index,
                    position=GeometryPoint(x=_round6(radial_position * math.cos(angle)), y=_round6(radial_position * math.sin(angle))),
                    amplitude=_round6(amplitude),
                    frequency=_round6(2.4 + axis_index * 0.19 + point_index * 0.31 + (1.0 - signed_point_value) * 1.3),
                    phase=_round6((math.pi if point.role == "contradictory" else 0.0) + axis_index * 0.17 + point_index * 0.11),
                    radius=_round6(0.32 + axis.evidence_coverage * 0.36 + (1.0 - axis.uncertainty) * 0.22),
                    confidence=_round6(confidence),
                    uncertainty=_round6(axis.uncertainty),
                    evidence_coverage=_round6(axis.evidence_coverage),
                )
            )
    return sources


def _extract_radial_contours(
    *,
    field_input: ResonantFieldInput,
    sources: Sequence[WaveSource],
    levels: Sequence[float],
    contour_angle_steps: int,
    contour_radial_steps: int,
) -> List[ResonantContour]:
    if not sources:
        return []

    contours: List[ResonantContour] = []
    max_level = max(levels) if levels else 1.0
    for level in levels:
        points: List[GeometryPoint] = []
        contributing_sources = _contributing_sources(sources, min_level=level)
        for angle_index in range(contour_angle_steps):
            angle = angle_index * (2.0 * math.pi / contour_angle_steps)
            radius = _radius_for_level(angle, level, sources, contour_radial_steps)
            points.append(GeometryPoint(x=_round6(radius * math.cos(angle)), y=_round6(radius * math.sin(angle))))

        confidence = _round6(_mean(source.confidence for source in contributing_sources) if contributing_sources else 0.0)
        strength = _round6(_clamp01((level / max_level) * confidence))
        contours.append(
            ResonantContour(
                contour_id=f"{field_input.result_id}:contour:{level:.4f}",
                level=level,
                points=points,
                strength=strength,
                confidence=confidence,
                source_axis_ids=sorted({source.axis_id for source in contributing_sources}),
                provenance=ContourProvenance(
                    contributing_result_ids=[field_input.result_id],
                    axis_ids=sorted({source.axis_id for source in contributing_sources}),
                    plotted_point_ids=sorted({source.point_id for source in contributing_sources}),
                    confidence_values=[source.confidence for source in contributing_sources],
                    recurrence_count=1,
                    recency_weight=1.0,
                    geometry_engine_version=RESONANT_FIELD_VERSION,
                ),
            )
        )
    return contours


def _radius_for_level(angle: float, level: float, sources: Sequence[WaveSource], radial_steps: int) -> float:
    best_radius = 0.0
    best_delta = 1.0
    for step in range(1, radial_steps + 1):
        radius = step / radial_steps
        value = _scalar_value(radius * math.cos(angle), radius * math.sin(angle), sources)
        delta = abs(value - level)
        if delta < best_delta:
            best_delta = delta
            best_radius = radius
    return _round6(best_radius)


def _scalar_value(x: float, y: float, sources: Sequence[WaveSource]) -> float:
    normalizer = sum(abs(source.amplitude) for source in sources) or 1.0
    total = 0.0
    for source in sources:
        distance = math.hypot(x - source.position.x, y - source.position.y)
        total += source.amplitude * math.cos(source.frequency * distance + source.phase) * math.exp(-distance / max(source.radius, 0.001))
    return _clamp01(abs(total) / normalizer)


def _contributing_sources(sources: Sequence[WaveSource], *, min_level: float) -> List[WaveSource]:
    sorted_sources = sorted(sources, key=lambda source: abs(source.amplitude) * source.confidence, reverse=True)
    minimum = max(0.02, min_level * 0.08)
    return [source for source in sorted_sources if abs(source.amplitude) >= minimum][:8]


def _cluster_fields(fields: Sequence[HistoricalResonantField], threshold: float) -> List[GeometryCluster]:
    clusters: List[List[HistoricalResonantField]] = []
    for item in sorted(fields, key=lambda field: (field.age_days, field.input.result_id)):
        target = None
        best_distance = 1.0
        for cluster in clusters:
            distance = _state_space_distance(item.input, _cluster_centroid_input(cluster))
            if distance < best_distance:
                best_distance = distance
                target = cluster
        if target is not None and best_distance <= threshold:
            target.append(item)
        else:
            clusters.append([item])

    return [_cluster_model(index, cluster) for index, cluster in enumerate(clusters)]


def _cluster_model(index: int, fields: Sequence[HistoricalResonantField]) -> GeometryCluster:
    axis_ids = [axis.axis_id for axis in fields[0].input.axes]
    centroid = {
        axis_id: _round6(_mean(_axis_value(field.input, axis_id) for field in fields))
        for axis_id in axis_ids
    }
    pair_similarities = []
    for left_index, left in enumerate(fields):
        for right in fields[left_index + 1 :]:
            pair_similarities.append(1.0 - _state_space_distance(left.input, right.input))
    average_similarity = _mean(pair_similarities) if pair_similarities else 1.0
    confidence = _mean(field.input.overall_confidence for field in fields)
    age_span = max(field.age_days for field in fields) - min(field.age_days for field in fields)
    persistence = _clamp01((len(fields) / 6.0) + min(age_span / 180.0, 0.35))
    seed = hashlib.sha1("|".join(field.input.result_id for field in fields).encode("utf-8")).hexdigest()[:10]
    return GeometryCluster(
        cluster_id=f"cluster-{index + 1}-{seed}",
        member_result_ids=[field.input.result_id for field in fields],
        centroid_axes=centroid,
        recurrence_count=len(fields),
        average_similarity=_round6(average_similarity),
        persistence=_round6(persistence),
        confidence=_round6(confidence),
        contributing_axis_ids=axis_ids,
    )


def _cluster_centroid_input(fields: Sequence[HistoricalResonantField]) -> ResonantFieldInput:
    representative = fields[0].input
    axes = [
        axis.model_copy(update={"value": _mean(_axis_value(field.input, axis.axis_id) for field in fields)})
        for axis in representative.axes
    ]
    points = [
        point.model_copy(update={"value": _mean(_point_value(field.input, point.axis_id, point.point_id) for field in fields)})
        for point in representative.plotted_points
    ]
    return representative.model_copy(update={"axes": axes, "plotted_points": points})


def _build_structural_region(cluster: GeometryCluster, fields: Sequence[HistoricalResonantField]) -> StructuralRegion:
    members = [field for field in fields if field.input.result_id in cluster.member_result_ids]
    contour_ids = [contour.contour_id for field in members for contour in field.geometry.contours]
    confidence_values = [field.input.overall_confidence for field in members]
    recurrence_weight = _clamp01(cluster.recurrence_count / 5.0)
    continuity = _clamp01(cluster.average_similarity * cluster.confidence)
    stability = _clamp01(cluster.average_similarity * (1.0 - _mean(1.0 if field.input.unresolved else 0.0 for field in members)))
    thickness = _clamp01(0.25 * recurrence_weight + 0.35 * cluster.persistence + 0.25 * cluster.confidence + 0.15 * cluster.average_similarity)
    return StructuralRegion(
        region_id=f"{cluster.cluster_id}:structure",
        cluster_id=cluster.cluster_id,
        contour_ids=contour_ids,
        contributing_result_ids=cluster.member_result_ids,
        thickness=_round6(thickness),
        continuity=_round6(continuity),
        stability=_round6(stability),
        prominence=_round6(_clamp01((thickness + continuity + stability) / 3.0)),
        provenance=ContourProvenance(
            contributing_result_ids=cluster.member_result_ids,
            axis_ids=cluster.contributing_axis_ids,
            plotted_point_ids=sorted({point.point_id for field in members for point in field.input.plotted_points}),
            confidence_values=[_round6(value) for value in confidence_values],
            recurrence_count=cluster.recurrence_count,
            recency_weight=_round6(_mean(_recency_weight(field.age_days, 30.0) for field in members)),
            geometry_engine_version=RESONANT_FIELD_VERSION,
        ),
    )


def _build_light_region(item: HistoricalResonantField, half_life_days: float) -> LightRegion:
    recency_weight = _recency_weight(item.age_days, half_life_days)
    activity = _clamp01(recency_weight * item.input.overall_confidence * item.relevance * (0.45 if item.input.unresolved else 1.0))
    return LightRegion(
        region_id=f"{item.input.result_id}:light",
        result_id=item.input.result_id,
        contour_ids=[contour.contour_id for contour in item.geometry.contours],
        activity_weight=_round6(activity),
        recency_weight=_round6(recency_weight),
        confidence=_round6(item.input.overall_confidence),
        provenance=ContourProvenance(
            contributing_result_ids=[item.input.result_id],
            axis_ids=[axis.axis_id for axis in item.input.axes],
            plotted_point_ids=[point.point_id for point in item.input.plotted_points],
            confidence_values=[point.confidence for point in item.input.plotted_points],
            recurrence_count=1,
            recency_weight=_round6(recency_weight),
            geometry_engine_version=RESONANT_FIELD_VERSION,
        ),
    )


def _state_space_distance(left: ResonantFieldInput, right: ResonantFieldInput) -> float:
    left_axes = {axis.axis_id: axis for axis in left.axes}
    right_axes = {axis.axis_id: axis for axis in right.axes}
    shared_axes = sorted(set(left_axes) & set(right_axes))
    axis_distance = _mean(abs(_to_unit(left_axes[axis_id].value) - _to_unit(right_axes[axis_id].value)) for axis_id in shared_axes)

    left_points = {(point.axis_id, point.point_id): point for point in left.plotted_points}
    right_points = {(point.axis_id, point.point_id): point for point in right.plotted_points}
    shared_points = sorted(set(left_points) & set(right_points))
    point_distance = _mean(abs(_to_unit(left_points[key].value) - _to_unit(right_points[key].value)) for key in shared_points)

    unresolved_penalty = 0.12 if left.unresolved != right.unresolved else 0.0
    confidence_distance = abs(left.overall_confidence - right.overall_confidence) * 0.12
    return _clamp01(axis_distance * 0.58 + point_distance * 0.30 + unresolved_penalty + confidence_distance)


def _axis_value(field_input: ResonantFieldInput, axis_id: str) -> float:
    return next(axis.value for axis in field_input.axes if axis.axis_id == axis_id)


def _point_value(field_input: ResonantFieldInput, axis_id: str, point_id: str) -> float:
    return next(point.value for point in field_input.plotted_points if point.axis_id == axis_id and point.point_id == point_id)


def _recency_weight(age_days: float, half_life_days: float) -> float:
    return _clamp01(0.5 ** (age_days / half_life_days))


def _to_unit(value: float) -> float:
    return _clamp01((value + 1.0) / 2.0 if value < 0.0 else value)


def _mean(values: Iterable[float]) -> float:
    collected = list(values)
    return sum(collected) / len(collected) if collected else 0.0


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _round6(value: float) -> float:
    return round(float(value), 6)
