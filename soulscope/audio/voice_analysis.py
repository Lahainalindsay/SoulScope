# soulscope/audio/voice_analysis.py

import numpy as np
import librosa
import parselmouth  # Praat wrapper
from parselmouth.praat import call

from soulscope.core_frequency.models import VoiceFeatures


def load_audio_mono(path: str, target_sr: int = 16000) -> tuple[np.ndarray, int]:
    """
    Load audio file as mono, resampled to target_sr.
    Returns (audio, sr).
    """
    audio, sr = librosa.load(path, sr=target_sr, mono=True)
    return audio, sr


def compute_spectral_centroid(audio: np.ndarray, sr: int) -> float:
    centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)
    return float(np.mean(centroid))


def compute_pitch_praat(audio: np.ndarray, sr: int, floor: float = 60.0, ceiling: float = 400.0):
    """
    Use Praat via parselmouth to get pitch and derive jitter, shimmer, HNR.
    """
    snd = parselmouth.Sound(audio, sampling_frequency=sr)

    pitch = call(snd, "To Pitch", 0.0, floor, ceiling)
    pitch_values = pitch.selected_array['frequency']
    pitch_values = pitch_values[pitch_values > 0]  # remove unvoiced
    if len(pitch_values) == 0:
        mean_f0 = 0.0
        f0_std = 0.0
    else:
        mean_f0 = float(np.mean(pitch_values))
        f0_std = float(np.std(pitch_values))

    # PointProcess for jitter/shimmer
    point_process = call(snd, "To PointProcess (periodic, cc)", floor, ceiling)

    # Jitter (local)
    jitter_local = call([snd, point_process], "Get jitter (local)", 0.0, 0.0, floor, ceiling, 1.3, 1.6)

    # Shimmer (local)
    shimmer_local = call([snd, point_process], "Get shimmer (local)", 0.0, 0.0, floor, ceiling, 1.3, 1.6, 1.6)

    # Harmonicity (HNR)
    harmonicity = call(snd, "To Harmonicity (cc)", 0.01, floor, 0.1, 1.0)
    hnr = call(harmonicity, "Get mean", 0.0, 0.0)

    return mean_f0, f0_std, jitter_local, shimmer_local, hnr


def extract_voice_features_from_file(path: str) -> VoiceFeatures:
    """
    High-level helper: given a .wav file path,
    return VoiceFeatures suitable for SoulScope.
    """
    audio, sr = load_audio_mono(path)

    # Optional: trim leading/trailing silence
    audio, _ = librosa.effects.trim(audio, top_db=30)

    # Spectral centroid
    spectral_centroid = compute_spectral_centroid(audio, sr)

    # Pitch + jitter/shimmer/HNR via Praat
    mean_f0, f0_std, jitter_local, shimmer_local, hnr = compute_pitch_praat(audio, sr)

    return VoiceFeatures(
        mean_f0=mean_f0,
        f0_std=f0_std,
        spectral_centroid=spectral_centroid,
        jitter_local=jitter_local,
        shimmer_local=shimmer_local,
        hnr=hnr,
    )
