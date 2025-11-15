
# soulscope/core_frequency/models.py

from dataclasses import dataclass
from typing import Optional, Dict, List
import numpy as np


@dataclass
class PhysioTimeSeries:
    """
    Raw or pre-processed physiological data over time.
    Assumes synchronized timestamps for simplicity.
    """
    timestamps: np.ndarray          # shape (T,)
    rr_intervals: np.ndarray        # ms between heart beats, shape (T_rr,)
    eda: Optional[np.ndarray] = None  # skin conductance, shape (T,)
    breath_rate: Optional[np.ndarray] = None  # breaths per minute over time


@dataclass
class PhysioFeatures:
    """
    Extracted features used for core frequency calculation.
    """
    hrv_rmssd: float
    lf_power: float
    hf_power: float
    lf_hf_ratio: float
    mean_hr: float
    eda_tonic_mean: Optional[float] = None
    eda_phasic_peaks_per_min: Optional[float] = None
    breath_rate_mean: Optional[float] = None


@dataclass
class VoiceFeatures:
    """
    Features extracted from one or more voice clips.
    These can be aggregated (mean/median) for the session.
    """
    mean_f0: float                  # average fundamental frequency
    f0_std: float                   # variability in pitch
    spectral_centroid: float        # "brightness"
    jitter_local: float             # short-term pitch instability
    shimmer_local: float            # short-term amplitude instability
    hnr: float                      # harmonic-to-noise ratio (voice clarity)


@dataclass
class ReactivityMetrics:
    """
    Emotional reactivity to prompts.
    baseline_* from neutral segment,
    challenge_* from emotionally loaded segment.
    """
    baseline_hrv_rmssd: float
    challenge_hrv_rmssd: float

    baseline_eda_mean: Optional[float] = None
    challenge_eda_mean: Optional[float] = None

    baseline_breath_rate: Optional[float] = None
    challenge_breath_rate: Optional[float] = None

    # How fast they return to baseline after challenge, 0–1 (1 = perfect recovery)
    recovery_index: Optional[float] = None


@dataclass
class ResonanceComponent:
    """
    Scalar 0–1 score plus optional metadata.
    """
    score: float          # 0–1, where closer to 1 = more coherent / regulated
    meta: Dict[str, float]


@dataclass
class CoreFrequencyResult:
    """
    Final fused result.
    """
    core_index: float                  # 0–1 overall index
    body_resonance: ResonanceComponent
    soul_resonance: ResonanceComponent
    heart_mind_resonance: ResonanceComponent
    # Optional: a "tone" or label for UX
    dominant_band_hz: Optional[float] = None
    qualitative_label: Optional[str] = None
