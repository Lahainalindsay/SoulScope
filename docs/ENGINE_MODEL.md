# SoulScope Engine Model

## Purpose

SoulScope is a voice-first self-reflection instrument. It does not treat a single acoustic measurement as a final emotional answer. It builds meaning in layers.

The engine converts a recorded voice into a compact body of acoustic evidence, organizes that evidence into primary dimensions, resolves groups of dimensions inside multidimensional constellations, combines the constellation states into a whole-scan pattern, and then expresses that pattern as both a human reflection and a Resonance Fingerprint.

The image and the written reflection are two expressions of the same underlying state. The visual is not decoration added after the report. It is generated from the same constellation geometry, frequency structure, confidence, recurrence, and personal-history relationships that shape the written result.

## Voice-first scope

The current production engine uses voice only.

Future evidence providers may include facial tension, pupil behavior, respiration, camera-derived pulse, heart-rate variability, movement, and other physiological signals. These future providers will not replace or rewrite the decision architecture. They will contribute additional evidence to the same primary dimensions.

## Canonical decision flow

```text
Recorded Voice
    ↓
Signal Quality and Acoustic Evidence
    ↓
Primary Dimensions
    ↓
Four-Point Constellations
    ↓
Constellation States
    ↓
Cross-Constellation Interaction
    ↓
Whole-Scan Pattern
    ↓
Human Reflection + Resonance Fingerprint
    ↓
Longitudinal Resonance Signature
```

## Layer 1: Recorded voice

Each scan contains the current guided voice responses and the user's account-linked Reference Signature. The Reference Signature supplies personal continuity and helps the system distinguish a meaningful shift from a stable individual speaking style.

## Layer 2: Signal quality and acoustic evidence

The evidence layer extracts only measurements that are useful to interpretation, confidence, or visualization. Typical evidence families include:

- pitch range and stability
- intensity and energy distribution
- spectral balance and harmonic structure
- timing, pauses, cadence, and speech rate
- vocal onset and micro-instability
- breath-linked timing and voiced/unvoiced behavior
- consistency across prompts
- similarity to the Reference Signature

Raw frame-by-frame values should be temporary unless required for reproducibility. The persistent scan record should store compact summaries rather than duplicate raw arrays, intermediate model outputs, and obsolete diagnostics.

## Layer 3: Primary dimensions

Primary dimensions are synthesized evidence states. They are not direct emotions and should not be presented as diagnoses.

Current working dimensions include:

- Mental Load
- Organization
- Direction
- Cognitive Flexibility
- Recovery
- Capacity
- Activation
- Regulation
- Expression
- Adaptability
- Social Orientation
- Reference Similarity
- Longitudinal Stability
- Identity Confidence
- Baseline Deviation

Each dimension contains:

- score
- confidence
- supporting evidence references
- contradictory evidence references
- missing-evidence limitations

## Layer 4: Four-point constellations

A constellation is a four-dimensional decision space. Its result is determined by the simultaneous balance, tension, dominance, symmetry, and interaction of all four inputs.

A constellation is not a chain of two-variable rules. It does not calculate A plus B and then attach a label. Four related dimensions create a geometric state, and that state resolves into a named, meaningful human pattern.

The planned production constellations are:

### Cognitive

- Mental Load
- Organization
- Direction
- Cognitive Flexibility

### Energy

- Recovery
- Capacity
- Activation
- Regulation

### Expression

- Expression
- Adaptability
- Social Orientation
- Emotional Regulation

### Resonance

- Reference Similarity
- Longitudinal Stability
- Identity Confidence
- Baseline Deviation

Every constellation result includes:

- named state
- coordinate or geometry
- score
- confidence
- dominant and supporting inputs
- tensions and contradictions
- nearby alternative states
- human meaning
- daily-life expressions
- awareness point
- reflection prompts
- visual parameters

## Layer 5: Cross-constellation interaction

The engine next evaluates how the four constellation states affect one another.

A highly organized cognitive state can mean something very different when paired with restored energy than when paired with reduced reserve. Open expression can represent grounded connection in one scan and strained overflow in another. A large baseline deviation may describe a significant present shift even when the population-normalized scores look moderate.

The interaction layer therefore evaluates:

- reinforcement
- compensation
- contradiction
- resource cost
- regulation
- momentum
- protection
- transition

This layer produces the whole-scan pattern. The pattern name is a display label derived last; it never controls the evidence.

## Layer 6: Human reflection

The report should sound personal, recognizable, and grounded in daily life. It should avoid clinical constructions such as “your cognitive state suggests.”

The preferred report structure is:

### What feels most present

A direct, natural description of the primary whole-scan pattern.

### How this may show up in daily life

Several realistic examples that may include strengths, friction, mixed experiences, and ordinary behavior.

### What may be happening underneath

A human explanation of the constellation interactions driving the visible pattern.

### Something worth noticing

For a supportive scan, this may identify momentum worth protecting or strain beginning to accumulate. For a difficult scan, it may gently name the pressure, depletion, guarding, or confusion that deserves attention.

### A question to sit with

One or more reflection questions grounded in the actual evidence and current scan.

The writing must remain non-diagnostic, avoid certainty beyond the evidence, and preserve user agency.

## Layer 7: Resonance Fingerprint

A Resonance Fingerprint is the energetic timestamp of one scan.

It is a visual expression of:

- current frequency structure
- constellation geometry
- harmonic strength
- symmetry and asymmetry
- coherence and tension
- state confidence
- Reference Signature relationship
- current novelty

The rendering may use cymatic and wave-interference principles, but it should be described accurately as a data-driven resonance visualization unless it is physically validated as a literal laboratory cymatic reconstruction.

## Layer 8: Longitudinal Resonance Signature

Across repeated scans, fingerprints accumulate into a Resonance Signature.

The signature represents the person's recurring inner output rather than a permanent personality label. Consistent patterns strengthen and become brighter. Temporary states remain lighter. Older patterns gradually lose intensity when they stop recurring. New stable frequencies and geometries become more visible as they repeat.

The signature should preserve:

- persistent traits
- present state
- recurring transitions
- recently emerging patterns
- fading historical patterns
- patterns that appear to have been released

The result is intended to become increasingly recognizable as that individual's characteristic energetic pattern over time.

## Data and performance rules

The production engine should follow these rules:

1. One authoritative reasoning path.
2. No legacy result engine may overwrite the canonical output.
3. Do not persist duplicate narratives or obsolete candidate models.
4. Store compact acoustic summaries, not unnecessary frame-level arrays.
5. Persist evidence provenance sufficient to explain every dimension and result.
6. Keep raw audio only according to an explicit retention policy.
7. Compute visual parameters from the canonical constellation state.
8. Version the evidence schema, constellation definitions, narrative rules, and signature renderer.
9. Gracefully degrade when evidence is missing.
10. Never generate confidence that exceeds the supporting evidence.
