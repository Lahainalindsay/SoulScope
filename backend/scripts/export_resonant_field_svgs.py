"""Export dev SVG previews for frozen Resonant Field fixtures.

This is a temporary inspection tool. It renders already-generated semantic
geometry and does not participate in the canonical geometry contract.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from corescope.engine.resonance import (  # noqa: E402
    ResonantAxis,
    ResonantFieldGeometry,
    ResonantFieldInput,
    ResonantPlottedPoint,
    WaveSource,
    build_resonant_field_geometry,
)


ROLES = ["primary", "supporting", "contradictory"]
DEFAULT_FIXTURES = ROOT / "backend" / "tests" / "fixtures" / "resonant_field" / "cases.json"
DEFAULT_OUT_DIR = ROOT / "backend" / "dev_output" / "resonant_field_svgs"


def build_input(fixtures: dict, case: dict) -> ResonantFieldInput:
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


def source_color(source: WaveSource) -> str:
    if source.role == "contradictory":
        return "#f59e0b"
    if source.role == "supporting":
        return "#7dd3fc"
    return "#f8fafc"


def to_screen(value: float, size: int, padding: int) -> float:
    radius = (size - padding * 2) / 2
    return size / 2 + value * radius


def point_path(points, size: int, padding: int) -> str:
    if not points:
        return ""
    commands = []
    for index, point in enumerate(points):
        x = to_screen(point.x, size, padding)
        y = to_screen(-point.y, size, padding)
        prefix = "M" if index == 0 else "L"
        commands.append(f"{prefix}{x:.2f},{y:.2f}")
    commands.append("Z")
    return " ".join(commands)


def render_svg(case_id: str, field_input: ResonantFieldInput, geometry: ResonantFieldGeometry, size: int = 720) -> str:
    padding = 72
    center = size / 2
    guide_radius = (size - padding * 2) / 2
    axis_guides = []
    for index, axis in enumerate(field_input.axes):
        angle = index * math.pi * 2 / 6
        x = center + guide_radius * 0.94 * math.cos(angle)
        y = center - guide_radius * 0.94 * math.sin(angle)
        tx = center + guide_radius * 1.04 * math.cos(angle)
        ty = center - guide_radius * 1.04 * math.sin(angle)
        axis_guides.append(
            f'<line x1="{center:.2f}" y1="{center:.2f}" x2="{x:.2f}" y2="{y:.2f}" stroke="#334155" stroke-width="1" opacity="0.42" />'
        )
        axis_guides.append(
            f'<text x="{tx:.2f}" y="{ty:.2f}" fill="#94a3b8" font-size="12" text-anchor="middle" dominant-baseline="middle">{escape(axis.axis_id)}</text>'
        )

    contour_paths = []
    for index, contour in enumerate(geometry.contours):
        stroke_width = 1.0 + contour.strength * 5.0
        opacity = 0.18 + contour.confidence * 0.62
        hue = 194 + index * 18
        contour_paths.append(
            f'<path d="{point_path(contour.points, size, padding)}" fill="none" stroke="hsl({hue} 85% 72%)" '
            f'stroke-width="{stroke_width:.2f}" opacity="{opacity:.3f}" stroke-linejoin="round" />'
        )

    source_marks = []
    for source in geometry.sources:
        x = to_screen(source.position.x, size, padding)
        y = to_screen(-source.position.y, size, padding)
        radius = 3.2 + abs(source.amplitude) * 10.0
        opacity = 0.25 + source.confidence * 0.7
        source_marks.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{radius:.2f}" fill="{source_color(source)}" opacity="{opacity:.3f}">'
            f"<title>{escape(source.axis_id)} {escape(source.role)} amp={source.amplitude:.3f} conf={source.confidence:.3f}</title></circle>"
        )

    title = escape(case_id.replace("_", " ").title())
    subtitle = escape(f"{field_input.result_id} | seed {geometry.seed} | confidence {field_input.overall_confidence:.2f}")
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}" role="img" aria-label="{title}">
  <rect width="100%" height="100%" fill="#020617" />
  <circle cx="{center:.2f}" cy="{center:.2f}" r="{guide_radius:.2f}" fill="none" stroke="#1e293b" stroke-width="1.5" />
  <circle cx="{center:.2f}" cy="{center:.2f}" r="{guide_radius * 0.66:.2f}" fill="none" stroke="#1e293b" stroke-width="1" opacity="0.65" />
  <circle cx="{center:.2f}" cy="{center:.2f}" r="{guide_radius * 0.33:.2f}" fill="none" stroke="#1e293b" stroke-width="1" opacity="0.45" />
  {"".join(axis_guides)}
  <g>{''.join(contour_paths)}</g>
  <g>{''.join(source_marks)}</g>
  <text x="32" y="42" fill="#e2e8f0" font-size="22" font-family="Inter, system-ui, sans-serif" font-weight="700">{title}</text>
  <text x="32" y="70" fill="#94a3b8" font-size="13" font-family="Inter, system-ui, sans-serif">{subtitle}</text>
</svg>
"""


def export_svgs(fixtures_path: Path, out_dir: Path) -> list[Path]:
    fixtures = json.loads(fixtures_path.read_text())
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for case in fixtures["cases"]:
        field_input = build_input(fixtures, case)
        geometry = build_resonant_field_geometry(field_input)
        svg = render_svg(case["caseId"], field_input, geometry)
        target = out_dir / f"{case['caseId']}.svg"
        target.write_text(svg)
        written.append(target)

    index = "\n".join(
        f'<li><a href="{path.name}">{escape(path.stem.replace("_", " ").title())}</a></li>'
        for path in written
    )
    (out_dir / "index.html").write_text(
        f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Resonant Field Fixture Previews</title>
  <style>
    body {{ margin: 32px; background: #020617; color: #e2e8f0; font-family: Inter, system-ui, sans-serif; }}
    a {{ color: #7dd3fc; }}
    li {{ margin: 10px 0; }}
  </style>
</head>
<body>
  <h1>Resonant Field Fixture Previews</h1>
  <p>Temporary SVG previews rendered from semantic backend geometry.</p>
  <ul>{index}</ul>
</body>
</html>
"""
    )
    written.append(out_dir / "index.html")
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Export dev SVG previews for resonant-field fixtures.")
    parser.add_argument("--fixtures", type=Path, default=DEFAULT_FIXTURES)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args()
    written = export_svgs(args.fixtures, args.out_dir)
    print(f"Wrote {len(written)} files to {args.out_dir}")
    for path in written:
        print(path)


if __name__ == "__main__":
    main()
