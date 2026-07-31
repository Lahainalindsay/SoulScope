# Resonance Signature Renderer

## Architecture

The Phase F1 renderer is downstream only:

Canonical immutable scan result -> signature input mapper -> normalized visual parameters -> deterministic scalar field -> marching-squares contours -> SVG renderer -> reproducibility manifest.

It does not inspect raw audio, recalculate evidence, alter dimensions, select patterns, write schemas, or reinterpret meaning. The result dashboard now maps `CanonicalSoulScopeResult` through `mapCanonicalResultToSignatureInput`.

Local references used during implementation:

- `SoulScope_Resonant_Signature_Rendering_Specification_v1.docx`
- `Neon SoulScope Resonance Dashboard.png`

The PNG is a visual-language reference only. It is not embedded in production rendering and does not drive geometry.

## Contract

`frontend/lib/resonanceSignature/types.ts` defines `ResonanceSignatureInputV1`, four constellations (`COG`, `REG`, `CAP`, `EXP`), and 16 dimensions. `schema.ts` validates runtime input and deep-freezes accepted objects.

## Coordinate System

SVG uses `viewBox="0 0 1200 1200"`, center `600,600`, maximum field radius `500`, and safe visual radius `455`.

Constellation anchors:

- `COG`: 270 degrees (north / upper)
- `REG`: 0 degrees (east / right)
- `CAP`: 90 degrees (south / lower)
- `EXP`: 180 degrees (west / left)

Each constellation starts as a field family, but contours are extracted from one unified scalar field.

## Visual Mappings

- Dimension mean maps to radial extent.
- Confidence maps to opacity, edge precision, and node intensity.
- Evidence coverage maps to contour count and continuity.
- Posterior interval width maps to uncertainty and line spread.
- Contradiction maps to localized counter-phase contours.
- Coherence maps to smooth alignment and symmetry persistence.
- Temporal momentum is carried by the contract and registry for reveal and longitudinal extension.
- Baseline trust controls whether a faint baseline ghost can render. Trust below `0.70` suppresses it.

Missing dimensions keep `mean: null`, become unresolved, and produce interrupted structure rather than neutral values.

## Palette

The renderer uses a black field and cool luminous family:

- `COG`: electric blue/cyan
- `REG`: cyan/aqua
- `CAP`: pale mint/white
- `EXP`: violet/periwinkle
- convergence: near-white

Color identifies constellation family only. It never means good, bad, healthy, or unhealthy.

## Seed

`seed.ts` builds seed material from contract version, renderer version, the normalized 16-dimension vector, confidence, evidence coverage, contradiction, momentum, unresolved flags, and approved acoustic visual inputs. Scan ID only breaks ties when all dimensions are missing.

No `Math.random()`, current time, or device entropy is used.

## Contours

`scalarField.ts` samples a fixed grid. `marchingSquares.ts` extracts deterministic contour segments at renderer-version thresholds. `contours.ts` sorts paths stably and rounds coordinates to three decimals.

Contours are ranked by `confidence × evidenceCoverage × continuity × multiSourceSupport × coherence` and rendered in four deterministic tiers:

- Tier A convergence spine (brightest, thickest)
- Tier B primary constellation contours
- Tier C secondary contours
- Tier D uncertainty/background traces

## SVG Layers

Serialized SVG uses stable groups:

- `radial-guides`
- `outer-bloom`
- `contour-support`
- `contours`
- `convergence-nodes`
- `confidence-overlay`
- `missingness-overlay`

Each contour is rendered in three passes (bloom/support/core) to preserve crisp geometry with restrained glow.

## Manifest

`manifest.ts` records contract version, renderer version, canonical result version, seed, normalized parameters, contour thresholds, missing dimensions, warnings, SVG checksum, and visual mapping entries such as dimension radial extent and contour count.

## Longitudinal Plan

Ten-scan Resonance Field support should cluster equivalent contour structures rather than overlay full SVGs. Older scans become dimmer and thinner; repeated geometry becomes a stable bright spine; recent emerging patterns become bright but not thick; missing evidence remains missing.

## Accessibility

The component renders a single labeled SVG. Explanatory labels and dashboard copy remain outside the core renderer. Reveal animation respects reduced-motion CSS.

## Versioning

Renderer v1.1.0 introduces directional field separation, central harmonic convergence, contour tiering, and denser convergence nodes while preserving immutable input mappings and determinism.

Renderer changes must update `RENDERER_VERSION` in `registry.ts` when visual geometry or mappings change. Tests assert seed, scalar checksum, directional family separation, convergence behavior, missingness, contradiction, and sensitivity.
