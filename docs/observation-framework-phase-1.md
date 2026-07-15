# SoulScope Observation Framework — Phase One

## Purpose

Phase One introduces a deterministic, versioned interpretation layer beneath the existing pattern and reflection system:

`Sensor Captures → Raw Features → Evidence Signals → Observations → Domains → Existing Patterns → Existing Reflections`

The framework separates what was measured from what was cautiously inferred. It does not diagnose, identify disease, define personality, or imply causation.

## Audit findings

- Raw voice features originate in `frontend/lib/voiceSpectrum.ts` after browser audio decoding and frame analysis.
- Current aggregate measurements include pitch, pitch range, pitch stability, pitch clarity, jitter, shimmer, HNR, harmonic richness, spectral centroid, spectral flatness, zero-crossing rate, pause timing, voiced-frame ratios, clipping, formant stability/dynamics, resonance score, and note-energy distributions.
- Prompt-level analyses are retained in `analysisDebug.promptAnalyses` when available.
- The former interpretation jump occurs in `frontend/lib/systemDimensions.ts`, where note scores and a few voice-dynamics values are converted directly into domains and user language.
- Pattern ranking remains in `frontend/lib/resonancePatterns.ts`.
- Canonical report assembly and personalization occur in `frontend/lib/buildSoulScopeReport.ts`.
- Scan results are stored in `scans.result`; canonical patterns and narrative variants are persisted separately.
- Many acoustic fields are optional. Camera blink values have previously required sanity filtering and are not part of Phase One domain generation.

## Layer definitions

### Sensor captures

References to the recordings that contributed to the scan. Phase One creates voice capture references from prompt analysis records when available, otherwise one aggregate voice capture reference.

### Raw features

Normalized records for values that already exist in the current engine. Missing fields are omitted rather than fabricated.

Currently supported feature IDs include:

- `voice.f0.median`
- `voice.f0.range_hz`
- `voice.f0.range_semitones`
- `voice.pitch_stability`
- `voice.pitch_clarity`
- `voice.jitter`
- `voice.shimmer`
- `voice.hnr`
- `voice.harmonic_richness`
- `voice.spectral_centroid`
- `voice.spectral_flatness`
- `voice.zero_crossing_rate`
- `voice.active_frame_ratio`
- `voice.voiced_frame_ratio`
- `voice.voiced_frame_count`
- `voice.voiced_duration`
- `voice.pause.count`
- `voice.pause.duration_mean`
- `voice.pause.duration_max`
- `voice.pause.density`
- `voice.speech_rate_proxy`
- `voice.formant_stability`
- `voice.formant_dynamics`
- `voice.clipping_ratio`
- `voice.resonance_score`
- `voice.core_frequency`
- existing note-energy records

### Evidence signals

Evidence describes signal behavior, not psychological or medical conditions.

Initial evidence signals:

- Vocal activation
- Vocal stability
- Harmonic clarity
- Processing pauses
- Expressive variability
- Vocal energy
- Response consistency
- Signal balance

### Observations

Observations are cautious human-readable interpretations. They preserve contributing evidence IDs, capture IDs, confidence, alternatives, and rule versions.

Initial observations cover:

- current vocal activation
- current vocal stability
- response consistency
- processing pauses
- expressive variability
- vocal energy
- harmonic clarity
- signal concentration/distribution
- possible recovery demand
- possible mental demand
- possible expression effort
- relative regulation steadiness

Functional observations require multiple agreeing evidence signals.

### Domains

Phase One domains:

1. Energy & Vitality
2. Recovery & Restoration
3. Focus & Mental Demand
4. Expression & Communication
5. Emotional Flexibility
6. Regulation & Stability
7. Adaptability & Direction

`Engagement & Connection` is intentionally excluded because current voice evidence does not defensibly measure whether a user has social support or connection.

Every domain declares whether its score represents availability or demand. Higher Mental Demand means more load; higher Recovery means more availability.

## Confidence model

Three confidence concepts remain separate:

- **Capture confidence:** whether source recordings were usable.
- **Evidence confidence:** whether enough measured features agreed.
- **Interpretation confidence:** whether enough evidence supported an observation.

Values are `high`, `moderate`, or `exploratory`. Research validity is represented separately as `supported`, `emerging`, or `exploratory`; it is not converted into a fake percentage.

## Versioning

Central versions are defined in `frontend/lib/observationFramework/versions.ts`:

- Observation engine: `1.0.0`
- Raw feature schema: `1.0.0`
- Evidence rules: `1.0.0`
- Observation rules: `1.0.0`
- Domain rules: `1.0.0`

## Compatibility behavior

`buildSoulScopeReport` runs the observation pipeline and adapts valid V2 domains into the existing `UserResultDomain` shape. If fewer than four V2 domains are available, it retains the legacy domains and records a warning. Existing patterns, pattern expressions, three narrative choices, preference learning, baseline comparison, partial scans, history, and results UI remain in place.

Phase One does not remove the legacy pattern classifier. Pattern ranking still retains some legacy note-based logic while the new domain layer stabilizes. A later phase can move pattern ranking fully onto observation-backed domains without changing the public report contract.

## Persistence

The additive migration stores the generated pipeline on the owning scan row:

- `observation_engine_version text`
- `observation_pipeline jsonb`
- `observation_pipeline_created_at timestamptz`

Existing scan rows and result tables are preserved. Existing scan RLS continues to enforce ownership.

## Prohibited inference types

The Phase One engine does not generate claims about:

- Parkinson’s disease
- depression
- anxiety disorders
- trauma
- burnout
- organ-specific frequencies
- personality traits
- clinical fatigue
- medical recovery capacity

## Known limitations

- There is no population-normalized reference model in Phase One.
- Thresholds are explicit product rules and require future validation.
- Note-energy balance remains an exploratory internal representation.
- Camera data is preserved elsewhere but is not used to generate Phase One domains.
- Prompt-level consistency is approximated by currently stored aggregate consistency features; deeper task-by-task comparison is a later phase.
- The existing pattern ranker still uses legacy inputs; the compatibility layer currently improves report domains and personalization while preserving behavior.

## Deterministic status

Phase One remains deterministic and rules-based. It does not become scientifically more accurate automatically as more users join. User preference learning changes presentation, not raw evidence.
