
# soulscope/core_frequency/reactivity_resonance.py

import numpy as np
from .models import ReactivityMetrics, ResonanceComponent
from .body_resonance import normalize


def compute_heart_mind_resonance(r: ReactivityMetrics) -> ResonanceComponent:
    """
    Higher = healthier reactivity + recovery.
    """

    # HRV drop under challenge: smaller drop is better.
    hrv_drop = r.baseline_hrv_rmssd - r.challenge_hrv_rmssd
    # If HRV increases with challenge (some people thrive), good.
    if hrv_drop <= 0:
        hrv_reactivity_score = 1.0
    else:
        hrv_reactivity_score = normalize(hrv_drop, low=0.0, high=30.0, invert=True)

    # EDA rise under challenge: some rise is normal, huge = hyperreactive
    eda_reactivity_score = 0.5
    if r.baseline_eda_mean is not None and r.challenge_eda_mean is not None:
        eda_delta = r.challenge_eda_mean - r.baseline_eda_mean
        if eda_delta < 0:
            eda_reactivity_score = 1.0
        else:
            eda_reactivity_score = normalize(eda_delta, low=0.0, high=5.0, invert=True)

    # Breath: less spike = better
    breath_reactivity_score = 0.5
    if r.baseline_breath_rate is not None and r.challenge_breath_rate is not None:
        br_delta = r.challenge_breath_rate - r.baseline_breath_rate
        if br_delta <= 0:
            breath_reactivity_score = 1.0
        else:
            breath_reactivity_score = normalize(br_delta, low=0.0, high=8.0, invert=True)

    # Recovery index is already 0–1, 1 = perfect.
    recovery_score = r.recovery_index if r.recovery_index is not None else 0.5

    weights = np.array([0.35, 0.25, 0.15, 0.25])
    scores = np.array([
        hrv_reactivity_score,
        eda_reactivity_score,
        breath_reactivity_score,
        recovery_score,
    ])

    hm_score = float(np.average(scores, weights=weights))

    meta = {
        "hrv_reactivity_score": hrv_reactivity_score,
        "eda_reactivity_score": eda_reactivity_score,
        "breath_reactivity_score": breath_reactivity_score,
        "recovery_score": recovery_score,
    }

    return ResonanceComponent(score=hm_score, meta=meta)
