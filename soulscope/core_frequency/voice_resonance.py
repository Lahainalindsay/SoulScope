
# soulscope/core_frequency/voice_resonance.py

from .models import VoiceFeatures, ResonanceComponent
from .body_resonance import normalize


def compute_soul_resonance(v: VoiceFeatures) -> ResonanceComponent:
    """
    Higher score = clearer, more stable, expressive voice.
    You’ll refine ranges based on real voice data.
    """

    # HNR: higher = clearer, less noise. Typical 0–30 dB.
    hnr_score = normalize(v.hnr, low=5.0, high=25.0, invert=False)

    # Jitter / shimmer: lower = more stable. We'll invert.
    jitter_score = normalize(v.jitter_local, low=0.0, high=0.01, invert=True)
    shimmer_score = normalize(v.shimmer_local, low=0.0, high=0.1, invert=True)

    # Pitch variability: too flat OR too chaotic is not ideal.
    # Let’s assume 10–80 Hz std is “good”; outside that declines.
    if v.f0_std < 10:
        pitch_var_score = normalize(v.f0_std, low=0.0, high=10.0, invert=False)
    elif v.f0_std <= 80:
        pitch_var_score = 1.0
    else:
        pitch_var_score = normalize(v.f0_std, low=80.0, high=200.0, invert=True)

    # Spectral centroid: mid-range "sweet spot", too low = dull, too high = strained
    # Ballpark 1500–3500 Hz.
    if v.spectral_centroid < 1500:
        bright_score = normalize(v.spectral_centroid, low=500, high=1500, invert=False)
    elif v.spectral_centroid <= 3500:
        bright_score = 1.0
    else:
        bright_score = normalize(v.spectral_centroid, low=3500, high=6000, invert=True)

    weights = [0.35, 0.2, 0.2, 0.15, 0.1]
    scores = [
        hnr_score,
        jitter_score,
        shimmer_score,
        pitch_var_score,
        bright_score,
    ]

    soul_score = float(sum(w*s for w, s in zip(weights, scores)))

    meta = {
        "hnr_score": hnr_score,
        "jitter_score": jitter_score,
        "shimmer_score": shimmer_score,
        "pitch_var_score": pitch_var_score,
        "bright_score": bright_score,
    }

    return ResonanceComponent(score=soul_score, meta=meta)
