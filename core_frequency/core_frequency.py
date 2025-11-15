
# soulscope/core_frequency/core_frequency.py

from .models import (
    PhysioTimeSeries,
    PhysioFeatures,
    VoiceFeatures,
    ReactivityMetrics,
    ResonanceComponent,
    CoreFrequencyResult,
)
from .body_resonance import extract_physio_features, compute_body_resonance
from .voice_resonance import compute_soul_resonance
from .reactivity_resonance import compute_heart_mind_resonance


def fuse_core_frequency(
    physio_ts: PhysioTimeSeries,
    voice_features: VoiceFeatures,
    reactivity: ReactivityMetrics,
) -> CoreFrequencyResult:
    """
    Main entrypoint: take raw-ish inputs, return fused core frequency.
    """

    physio_features: PhysioFeatures = extract_physio_features(physio_ts)
    body_res: ResonanceComponent = compute_body_resonance(physio_features)
    soul_res: ResonanceComponent = compute_soul_resonance(voice_features)
    hm_res: ResonanceComponent = compute_heart_mind_resonance(reactivity)

    # Simple weighted fusion: you can later replace with PCA or ML model.
    w_body = 0.4
    w_soul = 0.3
    w_hm = 0.3

    core_index = (
        w_body * body_res.score
        + w_soul * soul_res.score
        + w_hm * hm_res.score
    )

    # You can map this to a "dominant band" for sound design
    # Example: 0–1 mapped to 100–800 Hz
    dominant_band_hz = 100.0 + core_index * (800.0 - 100.0)

    # Crude qualitative label for UX
    if core_index >= 0.75:
        label = "Coherent / Regenerating"
    elif core_index >= 0.5:
        label = "Adaptive but Strained"
    elif core_index >= 0.3:
        label = "Fragmented / Overloaded"
    else:
        label = "Collapsed / Survival Mode"

    return CoreFrequencyResult(
        core_index=core_index,
        body_resonance=body_res,
        soul_resonance=soul_res,
        heart_mind_resonance=hm_res,
        dominant_band_hz=dominant_band_hz,
        qualitative_label=label,
    )
