
# soulscope/core_frequency/body_resonance.py

import numpy as np
from typing import Tuple
from .models import PhysioTimeSeries, PhysioFeatures, ResonanceComponent


def compute_hrv_rmssd(rr_intervals_ms: np.ndarray) -> float:
    diffs = np.diff(rr_intervals_ms)
    return np.sqrt(np.mean(diffs ** 2))


def estimate_lf_hf(rr_intervals_ms: np.ndarray, fs: float = 4.0) -> Tuple[float, float, float]:
    """
    Very rough LF/HF estimation from RR intervals.
    In production, use a proper HRV library (e.g. neurokit2).
    """
    # Interpolate RR to evenly sampled signal
    t = np.cumsum(rr_intervals_ms) / 1000.0
    t_resampled = np.arange(t[0], t[-1], 1.0/fs)
    rr_interp = np.interp(t_resampled, t, rr_intervals_ms)

    # Remove mean
    rr_detrended = rr_interp - np.mean(rr_interp)

    # FFT
    freqs = np.fft.rfftfreq(len(rr_detrended), d=1.0/fs)
    psd = np.abs(np.fft.rfft(rr_detrended)) ** 2

    # LF: 0.04–0.15 Hz, HF: 0.15–0.4 Hz
    lf_mask = (freqs >= 0.04) & (freqs < 0.15)
    hf_mask = (freqs >= 0.15) & (freqs < 0.40)

    lf_power = psd[lf_mask].sum()
    hf_power = psd[hf_mask].sum()
    lf_hf_ratio = lf_power / hf_power if hf_power > 0 else np.inf

    return lf_power, hf_power, lf_hf_ratio


def extract_physio_features(ts: PhysioTimeSeries) -> PhysioFeatures:
    rr = ts.rr_intervals
    hrv_rmssd = compute_hrv_rmssd(rr)
    lf_power, hf_power, lf_hf_ratio = estimate_lf_hf(rr)
    mean_rr = np.mean(rr)
    mean_hr = 60000.0 / mean_rr  # bpm

    eda_tonic_mean = None
    eda_phasic_peaks_per_min = None
    if ts.eda is not None:
        eda_tonic_mean = float(np.mean(ts.eda))
        # crude phasic peak detection: count large positive diffs
        eda_diff = np.diff(ts.eda)
        peaks = (eda_diff > np.percentile(eda_diff, 90)).sum()
        duration_min = (ts.timestamps[-1] - ts.timestamps[0]) / 60.0
        eda_phasic_peaks_per_min = peaks / duration_min if duration_min > 0 else 0.0

    breath_rate_mean = None
    if ts.breath_rate is not None:
        breath_rate_mean = float(np.mean(ts.breath_rate))

    return PhysioFeatures(
        hrv_rmssd=hrv_rmssd,
        lf_power=lf_power,
        hf_power=hf_power,
        lf_hf_ratio=lf_hf_ratio,
        mean_hr=mean_hr,
        eda_tonic_mean=eda_tonic_mean,
        eda_phasic_peaks_per_min=eda_phasic_peaks_per_min,
        breath_rate_mean=breath_rate_mean
    )


def normalize(value: float, low: float, high: float, invert: bool = False) -> float:
    """
    Map value to 0–1, with optional inversion (for metrics where lower is better).
    """
    if high == low:
        return 0.5
    x = (value - low) / (high - low)
    x = max(0.0, min(1.0, x))
    return 1.0 - x if invert else x


def compute_body_resonance(features: PhysioFeatures) -> ResonanceComponent:
    """
    Combine HRV, LF/HF, heart rate, EDA into a 0–1 resonance score.
    Higher = more regulated, coherent.
    Ranges below are heuristic, you’ll calibrate on real data.
    """

    # HRV: higher is better. Typical RMSSD: 10–80+ ms
    hrv_score = normalize(features.hrv_rmssd, low=10, high=80, invert=False)

    # LF/HF: mid-range often considered balanced, extreme ratios less so.
    # We'll treat 0.5–3 as "good", beyond that lower score.
    lf_hf = features.lf_hf_ratio if np.isfinite(features.lf_hf_ratio) else 10.0
    if lf_hf <= 0:
        lf_hf_score = 0.0
    elif lf_hf < 0.5:
        lf_hf_score = normalize(lf_hf, low=0.1, high=0.5, invert=False)
    elif lf_hf <= 3.0:
        lf_hf_score = 1.0
    else:
        lf_hf_score = normalize(lf_hf, low=3.0, high=8.0, invert=True)

    # Mean heart rate: moderate is better at rest (55–85 bpm)
    hr_score = normalize(features.mean_hr, low=55, high=85, invert=True)

    # EDA tonic: lower baseline suggests less chronic arousal (rough)
    eda_score = 0.5
    if features.eda_tonic_mean is not None:
        eda_score = normalize(features.eda_tonic_mean, low=2.0, high=15.0, invert=True)

    # Combine with weights
    weights = np.array([0.4, 0.2, 0.2, 0.2])
    scores = np.array([hrv_score, lf_hf_score, hr_score, eda_score])
    body_score = float(np.average(scores, weights=weights))

    meta = {
        "hrv_score": hrv_score,
        "lf_hf_score": lf_hf_score,
        "hr_score": hr_score,
        "eda_score": eda_score,
    }

    return ResonanceComponent(score=body_score, meta=meta)
