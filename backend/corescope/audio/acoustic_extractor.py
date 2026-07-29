from __future__ import annotations

import math
from uuid import uuid4
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import numpy as np
import parselmouth
import soundfile as sf
from parselmouth.praat import call
from scipy.signal import find_peaks
try:
    import webrtcvad
except ImportError:  # pragma: no cover
    webrtcvad = None

from .acoustic_contract import (
    AcousticAnalysisResponse,
    AcousticFeatureMeasurement,
    CaptureKind,
    PRAAT_EXTRACTOR_VERSION,
    QualityLevel,
    VadSegment,
)
from corescope.engine.evidence import build_acoustic_evidence_ledger
from corescope.engine.versions import CURRENT_ENGINE_VERSIONS


TARGET_SAMPLE_RATE = 16000
MAX_DURATION_SECONDS = 90
MIN_DURATION_SECONDS = 2
MAX_UPLOAD_BYTES = 24 * 1024 * 1024
MIN_UPLOAD_BYTES = 2048

SUSTAINED_VOWEL_FEATURES = {
    "voice.jitter.local",
    "voice.jitter.local_absolute",
    "voice.jitter.rap",
    "voice.jitter.ppq5",
    "voice.jitter.ddp",
    "voice.shimmer.local",
    "voice.shimmer.local_db",
    "voice.shimmer.apq3",
    "voice.shimmer.apq5",
    "voice.shimmer.apq11",
    "voice.shimmer.dda",
    "voice.hnr.mean",
}


@dataclass
class DecodedAudio:
    samples: np.ndarray
    sample_rate: int
    channel_count: int
    duration_ms: int
    canonical_path: Path
    clipping_ratio: float = 0.0


def _quality_from_confidence(confidence: float) -> QualityLevel:
    if confidence >= 0.86:
        return "high"
    if confidence >= 0.68:
        return "good"
    if confidence >= 0.42:
        return "limited"
    return "poor"


def _safe_float(value: Any) -> Optional[float]:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(numeric):
        return None
    return numeric


def _percentile(values: np.ndarray, percentile: float) -> Optional[float]:
    if values.size == 0:
        return None
    return _safe_float(np.percentile(values, percentile))


def _semitone_range(low: Optional[float], high: Optional[float]) -> Optional[float]:
    if low is None or high is None or low <= 0 or high <= 0:
        return None
    return 12 * math.log2(high / low)


def _linear_resample(samples: np.ndarray, source_sr: int, target_sr: int) -> np.ndarray:
    if source_sr == target_sr:
        return samples.astype(np.float32, copy=False)
    duration = len(samples) / source_sr
    target_len = max(1, int(round(duration * target_sr)))
    source_x = np.linspace(0, duration, num=len(samples), endpoint=False)
    target_x = np.linspace(0, duration, num=target_len, endpoint=False)
    return np.interp(target_x, source_x, samples).astype(np.float32)


def decode_audio_to_canonical_wav(input_path: Path, output_path: Path) -> DecodedAudio:
    samples, sample_rate = sf.read(str(input_path), always_2d=True)
    if samples.size == 0:
        raise ValueError("audio_empty")
    channel_count = samples.shape[1]
    mono = samples.mean(axis=1).astype(np.float32)
    if not np.any(np.abs(mono) > 1e-5):
        raise ValueError("audio_silent")
    clipping_ratio = float(np.mean(np.abs(mono) >= 0.999))
    mono = _linear_resample(mono, sample_rate, TARGET_SAMPLE_RATE)
    peak = float(np.max(np.abs(mono)))
    if peak > 1:
        mono = mono / peak
    duration_ms = int(round(len(mono) / TARGET_SAMPLE_RATE * 1000))
    if duration_ms < MIN_DURATION_SECONDS * 1000:
        raise ValueError("audio_too_short")
    if duration_ms > MAX_DURATION_SECONDS * 1000:
        raise ValueError("audio_too_long")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(output_path), mono, TARGET_SAMPLE_RATE, subtype="PCM_16")
    return DecodedAudio(mono, TARGET_SAMPLE_RATE, channel_count, duration_ms, output_path, clipping_ratio)


def _frame_audio(samples: np.ndarray, sr: int, frame_ms: int = 30) -> Tuple[np.ndarray, int]:
    frame_len = max(1, int(sr * frame_ms / 1000))
    frame_count = int(math.ceil(len(samples) / frame_len))
    padded = np.pad(samples, (0, frame_count * frame_len - len(samples)))
    return padded.reshape(frame_count, frame_len), frame_len


def _segment_states(voiced: np.ndarray, frame_len: int, sample_count: int, sr: int, confidence: float, method: str) -> Tuple[List[VadSegment], Dict[str, float]]:
    if len(voiced) == 0:
        return [], {"speech_to_silence_ratio": 0, "voiced_duration_ms": 0, "vad_method": method, "vad_version": "1"}
    transitions: List[Tuple[bool, int, int]] = []
    start = 0
    state = bool(voiced[0])
    for index, current in enumerate(voiced[1:], start=1):
        if bool(current) != state:
            transitions.append((state, start, index))
            start = index
            state = bool(current)
    transitions.append((state, start, len(voiced)))
    first_speech = next((i for i, item in enumerate(transitions) if item[0]), None)
    last_speech = len(transitions) - 1 - next((i for i, item in enumerate(reversed(transitions)) if item[0]), 0)
    segments: List[VadSegment] = []
    for index, (is_speech, start_frame, end_frame) in enumerate(transitions):
        start_ms = int(round(start_frame * frame_len / sr * 1000))
        end_ms = int(round(min(end_frame * frame_len, sample_count) / sr * 1000))
        kind = "speech" if is_speech else (
            "leading_silence" if first_speech is None or index < first_speech else
            "trailing_silence" if index > last_speech else "internal_pause"
        )
        segments.append(VadSegment(kind=kind, start_ms=start_ms, end_ms=end_ms, confidence=confidence))
    speech_ms = sum(item.end_ms - item.start_ms for item in segments if item.kind == "speech")
    silence_ms = max(0, sample_count / sr * 1000 - speech_ms)
    pauses = [item.end_ms - item.start_ms for item in segments if item.kind == "internal_pause"]
    return segments, {
        "speech_to_silence_ratio": float(speech_ms / max(1, silence_ms)),
        "voiced_duration_ms": float(speech_ms),
        "pause_count": float(len(pauses)),
        "average_pause_ms": float(np.mean(pauses)) if pauses else 0.0,
        "median_pause_ms": float(np.median(pauses)) if pauses else 0.0,
        "maximum_pause_ms": float(max(pauses)) if pauses else 0.0,
        "pause_density_per_min": float(len(pauses) / max(1e-6, sample_count / sr / 60)),
        "phonation_time_ratio": float(speech_ms / max(1, sample_count / sr * 1000)),
        "vad_method": method,
        "vad_version": "webrtcvad-2.0.14" if method == "webrtc_vad" else "energy_vad_v1",
    }


def _energy_vad(samples: np.ndarray, sr: int) -> Tuple[List[VadSegment], Dict[str, float]]:
    frames, frame_len = _frame_audio(samples, sr)
    rms = np.sqrt(np.mean(frames**2, axis=1))
    zcr = np.mean(np.abs(np.diff(np.signbit(frames), axis=1)), axis=1)
    noise_floor = float(np.percentile(rms, 20))
    rms_spread = float(np.percentile(rms, 90) - np.percentile(rms, 10))
    threshold = max(0.006, noise_floor * 0.65 if rms_spread < 0.004 else noise_floor * 2.6, float(np.percentile(rms, 60)) * 0.45)
    voiced = (rms >= threshold) & (zcr < 0.26)

    # Smooth isolated frame errors.
    smoothed = voiced.copy()
    for i in range(1, len(voiced) - 1):
      if voiced[i - 1] == voiced[i + 1] and voiced[i] != voiced[i - 1]:
          smoothed[i] = voiced[i - 1]
    voiced = smoothed

    return _segment_states(voiced, frame_len, len(samples), sr, 0.62, "energy_vad")


def _webrtc_vad(samples: np.ndarray, sr: int) -> Tuple[List[VadSegment], Dict[str, float]]:
    if webrtcvad is None or sr not in {8000, 16000, 32000, 48000}:
        raise ValueError("webrtc_vad_unsupported_sample_rate")
    frames, frame_len = _frame_audio(samples, sr, 30)
    detector = webrtcvad.Vad(2)
    pcm = np.clip(frames * 32767, -32768, 32767).astype(np.int16)
    voiced = np.array([detector.is_speech(frame.tobytes(), sr) for frame in pcm], dtype=bool)
    return _segment_states(voiced, frame_len, len(samples), sr, 0.78, "webrtc_vad")


def _run_vad(samples: np.ndarray, sr: int) -> Tuple[List[VadSegment], Dict[str, float]]:
    try:
        segments, stats = _webrtc_vad(samples, sr)
        if stats.get("voiced_duration_ms", 0) > 0:
            return segments, stats
        # WebRTC can reject clean synthetic/tonal fixtures. Keep it primary for
        # ordinary speech, but use the deterministic gate when it finds nothing.
        return _energy_vad(samples, sr)
    except (ValueError, RuntimeError):
        return _energy_vad(samples, sr)


def _cpp_proxy(samples: np.ndarray, sr: int) -> Optional[float]:
    if len(samples) < sr // 2:
        return None
    window = samples[: min(len(samples), sr * 2)]
    spectrum = np.log(np.abs(np.fft.rfft(window * np.hanning(len(window)))) + 1e-12)
    cepstrum = np.fft.irfft(spectrum)
    min_quef = int(sr / 400)
    max_quef = int(sr / 60)
    if max_quef <= min_quef or max_quef >= len(cepstrum):
        return None
    peak = float(np.max(cepstrum[min_quef:max_quef]))
    baseline = float(np.median(cepstrum[min_quef:max_quef]))
    return peak - baseline


def _spectral_features(samples: np.ndarray, sr: int) -> Dict[str, Optional[float]]:
    if samples.size == 0:
        return {}
    window = samples * np.hanning(len(samples))
    spectrum = np.abs(np.fft.rfft(window))
    freqs = np.fft.rfftfreq(len(window), 1 / sr)
    power = spectrum**2
    total = float(np.sum(power))
    if total <= 1e-12:
        return {}
    centroid = float(np.sum(freqs * power) / total)
    cumulative = np.cumsum(power)
    rolloff = float(freqs[min(len(freqs) - 1, int(np.searchsorted(cumulative, total * 0.85)))])
    flatness = float(np.exp(np.mean(np.log(power + 1e-12))) / (np.mean(power) + 1e-12))
    usable = (freqs >= 100) & (freqs <= min(5000, sr / 2 - 1)) & (power > 1e-10)
    slope = None
    if np.count_nonzero(usable) > 8:
        slope = float(np.polyfit(np.log2(freqs[usable]), 10 * np.log10(power[usable]), 1)[0])
    zcr = float(np.mean(np.abs(np.diff(np.signbit(samples)))))
    rms = float(np.sqrt(np.mean(samples**2)))
    harmonic_richness = float(np.sum(power[(freqs >= 100) & (freqs <= 1200)]) / total)
    return {
        "voice.spectral_centroid": centroid,
        "voice.spectral_flatness": flatness,
        "voice.spectral_rolloff_85": rolloff,
        "voice.spectral_slope": slope,
        "voice.zero_crossing_rate": zcr,
        "voice.rms_energy": rms,
        "voice.harmonic_richness": harmonic_richness,
        "voice.cepstral_peak_prominence_proxy": _cpp_proxy(samples, sr),
    }


def _formant_summary(formant: Any, duration_s: float) -> Dict[str, Optional[float]]:
    times = np.arange(0.025, max(0.026, duration_s), 0.01)
    output: Dict[str, Optional[float]] = {}
    for index in (1, 2, 3):
        values = []
        for time in times:
            value = _safe_float(call(formant, "Get value at time", index, float(time), "Hertz", "Linear"))
            if value and 90 <= value <= 5000:
                values.append(value)
        arr = np.array(values)
        prefix = f"voice.formant.f{index}"
        output[f"{prefix}.median"] = _safe_float(np.median(arr)) if arr.size else None
        output[f"{prefix}.sd"] = _safe_float(np.std(arr)) if arr.size else None
        output[f"{prefix}.iqr"] = _safe_float(np.percentile(arr, 75) - np.percentile(arr, 25)) if arr.size else None
        output[f"{prefix}.valid_frame_ratio"] = float(arr.size / max(1, len(times)))
    f1_sd = output.get("voice.formant.f1.sd")
    f2_sd = output.get("voice.formant.f2.sd")
    output["voice.formant_stability"] = None if f1_sd is None or f2_sd is None else max(0.0, min(1.0, 1 - ((f1_sd + f2_sd) / 900)))
    output["voice.formant_dynamics"] = None if f1_sd is None or f2_sd is None else max(0.0, min(1.0, (f1_sd + f2_sd) / 650))
    return output


def _pitch_and_praat_features(samples: np.ndarray, sr: int, capture_kind: CaptureKind, floor: float, ceiling: float) -> Dict[str, Optional[float]]:
    sound = parselmouth.Sound(samples, sampling_frequency=sr)
    duration_s = sound.get_total_duration()
    pitch = call(sound, "To Pitch", 0.0, floor, ceiling)
    pitch_values = np.asarray(pitch.selected_array["frequency"], dtype=float)
    voiced = pitch_values[pitch_values > 0]
    low = _percentile(voiced, 20)
    high = _percentile(voiced, 80)
    result: Dict[str, Optional[float]] = {
        "voice.f0.mean": _safe_float(np.mean(voiced)) if voiced.size else None,
        "voice.f0.median": _safe_float(np.median(voiced)) if voiced.size else None,
        "voice.f0.sd": _safe_float(np.std(voiced)) if voiced.size else None,
        "voice.f0.p20": low,
        "voice.f0.p80": high,
        "voice.f0.range_hz": None if low is None or high is None else high - low,
        "voice.f0.range_semitones": _semitone_range(low, high),
        "voice.voiced_frame_ratio": float(voiced.size / max(1, pitch_values.size)),
        "voice.pitch_floor_used": floor,
        "voice.pitch_ceiling_used": ceiling,
    }
    if voiced.size:
        result["voice.pitch_clarity"] = max(0.0, min(1.0, float(voiced.size / max(1, pitch_values.size))))
        result["voice.pitch_stability"] = max(0.0, min(1.0, 1 - float(np.std(voiced) / max(1e-6, np.mean(voiced)))))

    harmonicity = call(sound, "To Harmonicity (cc)", 0.01, floor, 0.1, 1.0)
    result["voice.hnr.mean"] = _safe_float(call(harmonicity, "Get mean", 0.0, 0.0))

    point_process = None
    try:
        point_process = call(sound, "To PointProcess (periodic, cc)", floor, ceiling)
    except Exception:
        point_process = None
    if capture_kind == "sustained_vowel" and point_process is not None:
        # Praat PointProcess uses period bounds, not pitch bounds, for these
        # cycle-level measurements. Shimmer additionally receives the maximum
        # amplitude-factor parameter and therefore uses two Praat objects.
        jitter_args = (0.0, 0.0, 1.0 / ceiling, 1.0 / floor, 1.3)
        shimmer_args = (0.0, 0.0, 1.0 / ceiling, 1.0 / floor, 1.3, 1.6)
        praat_calls = {
            "voice.jitter.local": ("Get jitter (local)", jitter_args),
            "voice.jitter.local_absolute": ("Get jitter (local, absolute)", jitter_args),
            "voice.jitter.rap": ("Get jitter (rap)", jitter_args),
            "voice.jitter.ppq5": ("Get jitter (ppq5)", jitter_args),
            "voice.jitter.ddp": ("Get jitter (ddp)", jitter_args),
            "voice.shimmer.local": ("Get shimmer (local)", shimmer_args),
            "voice.shimmer.local_db": ("Get shimmer (local_dB)", shimmer_args),
            "voice.shimmer.apq3": ("Get shimmer (apq3)", shimmer_args),
            "voice.shimmer.apq5": ("Get shimmer (apq5)", shimmer_args),
            "voice.shimmer.apq11": ("Get shimmer (apq11)", shimmer_args),
            "voice.shimmer.dda": ("Get shimmer (dda)", shimmer_args),
        }
        for feature_id, (command, args) in praat_calls.items():
            try:
                objects = point_process if command.startswith("Get jitter") else [sound, point_process]
                result[feature_id] = _safe_float(call(objects, command, *args))
            except Exception:
                result[feature_id] = None

    formant = call(sound, "To Formant (burg)", 0.0, 5, 5500, 0.025, 50)
    result.update(_formant_summary(formant, duration_s))
    return result


def _feature_unit(feature_id: str) -> Optional[str]:
    if feature_id.endswith("range_semitones"):
        return "semitones"
    if feature_id.endswith("count"):
        return "count"
    if feature_id.endswith("density"):
        return "per_min"
    if ".f0." in feature_id or "formant" in feature_id or feature_id.endswith("centroid") or feature_id.endswith("rolloff_85"):
        if feature_id.endswith("valid_frame_ratio") or feature_id.endswith("stability") or feature_id.endswith("dynamics"):
            return "ratio"
        return "Hz"
    if feature_id.endswith("local_db"):
        return "dB"
    if "jitter.local_absolute" in feature_id:
        return "seconds"
    if "jitter" in feature_id or "shimmer.local" in feature_id or "shimmer.apq" in feature_id or "shimmer.dda" in feature_id:
        return "fraction"
    if feature_id.endswith("hnr.mean"):
        return "dB"
    if feature_id.endswith("slope"):
        return "dB_per_octave"
    if feature_id.endswith("per_min"):
        return "per_min"
    if feature_id.endswith("ms") or "pause" in feature_id:
        return "ms"
    return "ratio"


def _method(feature_id: str) -> str:
    if feature_id.startswith("voice.f0") or feature_id in SUSTAINED_VOWEL_FEATURES or feature_id.startswith("voice.formant"):
        return "Praat-Parselmouth"
    if feature_id.startswith("voice.pause") or feature_id in {"voice.phonation_time_ratio", "voice.speech_to_silence_ratio"}:
        return "webrtc_vad_2.0.14_with_energy_fallback"
    if feature_id == "voice.syllable_nuclei_rate":
        return "documented_energy_peak_proxy_v1"
    if feature_id == "voice.cepstral_peak_prominence_proxy":
        return "cepstral_peak_prominence_proxy_v1; log-spectrum cepstrum peak minus local median; not validated CPP"
    return "deterministic_spectral_summary_v1"


def _measurement(
    feature_id: str,
    value: Optional[float],
    source_capture_id: str,
    capture_kind: CaptureKind,
    duration_ms: int,
    quality: QualityLevel,
    confidence: float,
    parameters: Dict[str, Any],
    device_metadata: Dict[str, Any],
    rejection_reason: Optional[str] = None,
) -> AcousticFeatureMeasurement:
    if value is None and rejection_reason is None:
        rejection_reason = "insufficient_reliable_signal"
    return AcousticFeatureMeasurement(
        feature_id=feature_id,
        value=value,
        unit=_feature_unit(feature_id),
        method=_method(feature_id),
        source_capture_id=source_capture_id,
        capture_kind=capture_kind,
        segment_start_ms=0,
        segment_end_ms=duration_ms,
        quality=quality if value is not None else "poor",
        confidence=confidence if value is not None else 0.0,
        rejection_reason=rejection_reason,
        extractor="praat-parselmouth",
        extractor_version=PRAAT_EXTRACTOR_VERSION,
        parameters=parameters,
        device_metadata=device_metadata,
    )


def _syllable_proxy(samples: np.ndarray, sr: int, vad_segments: Iterable[VadSegment]) -> Optional[float]:
    speech_ranges = [(int(s.start_ms * sr / 1000), int(s.end_ms * sr / 1000)) for s in vad_segments if s.kind == "speech"]
    if not speech_ranges:
        return None
    speech = np.concatenate([samples[start:end] for start, end in speech_ranges if end > start])
    if speech.size < sr:
        return None
    frames, frame_len = _frame_audio(np.abs(speech), sr, frame_ms=40)
    envelope = np.sqrt(np.mean(frames**2, axis=1))
    threshold = max(float(np.percentile(envelope, 55)), float(np.max(envelope)) * 0.18)
    peaks, _ = find_peaks(envelope, height=threshold, distance=max(1, int(0.12 / (frame_len / sr))))
    minutes = len(speech) / sr / 60
    return float(len(peaks) / max(1e-6, minutes))


def analyze_canonical_audio(
    decoded: DecodedAudio,
    *,
    scan_id: str,
    user_id: str,
    source_capture_id: str,
    capture_kind: CaptureKind,
    original_content_type: str,
    storage_path: Optional[str],
    device_metadata: Dict[str, Any],
    pitch_floor_hz: float = 60.0,
    pitch_ceiling_hz: float = 400.0,
) -> AcousticAnalysisResponse:
    parameters = {
        "target_sample_rate_hz": TARGET_SAMPLE_RATE,
        "pitch_floor_hz": pitch_floor_hz,
        "pitch_ceiling_hz": pitch_ceiling_hz,
        "formant_ceiling_hz": 5500,
        "vad": "webrtc_vad_2.0.14_with_energy_fallback",
    }
    vad_segments, vad_stats = _run_vad(decoded.samples, decoded.sample_rate)
    confidence = max(0.0, min(1.0, (vad_stats.get("phonation_time_ratio", 0.0) * 0.65) + 0.28))
    quality = _quality_from_confidence(confidence)
    feature_values: Dict[str, Optional[float]] = {}
    try:
        feature_values.update(_pitch_and_praat_features(decoded.samples, decoded.sample_rate, capture_kind, pitch_floor_hz, pitch_ceiling_hz))
    except Exception:
        feature_values["voice.f0.median"] = None
        feature_values["voice.hnr.mean"] = None
    feature_values.update(_spectral_features(decoded.samples, decoded.sample_rate))
    feature_values.update(
        {
            "voice.speech_to_silence_ratio": vad_stats.get("speech_to_silence_ratio"),
            "voice.voiced_duration_ms": vad_stats.get("voiced_duration_ms"),
            "voice.pause.count": vad_stats.get("pause_count"),
            "voice.pause.duration_mean": vad_stats.get("average_pause_ms"),
            "voice.pause.duration_median": vad_stats.get("median_pause_ms"),
            "voice.pause.duration_max": vad_stats.get("maximum_pause_ms"),
            "voice.pause.density": vad_stats.get("pause_density_per_min"),
            "voice.phonation_time_ratio": vad_stats.get("phonation_time_ratio"),
            "voice.syllable_nuclei_rate": _syllable_proxy(decoded.samples, decoded.sample_rate, vad_segments),
            "voice.clipping_ratio": decoded.clipping_ratio,
        }
    )
    # Keep ineligible cycle-level values explicit and null rather than omitting
    # them or coercing them to zero. This preserves task eligibility in storage.
    if capture_kind != "sustained_vowel":
        for feature_id in SUSTAINED_VOWEL_FEATURES:
            feature_values.setdefault(feature_id, None)
    features = [
        _measurement(feature_id, _safe_float(value), source_capture_id, capture_kind, decoded.duration_ms, quality, confidence, parameters, device_metadata)
        for feature_id, value in sorted(feature_values.items())
    ]
    evidence_ledger = build_acoustic_evidence_ledger(
        scan_id=scan_id,
        source_capture_id=source_capture_id,
        measurements=features,
    )
    return AcousticAnalysisResponse(
        scan_id=scan_id,
        user_id=user_id,
        source_capture_id=source_capture_id,
        capture_kind=capture_kind,
        storage_path=storage_path,
        retention_policy="Original upload deleted after decode; private canonical WAV retained locally for a 24-hour retry window, then deleted by cleanup maintenance. No public URLs are generated.",
        original_content_type=original_content_type,
        canonical_format="mono PCM WAV, 16000 Hz",
        duration_ms=decoded.duration_ms,
        sample_rate_hz=decoded.sample_rate,
        channel_count=decoded.channel_count,
        quality=quality,
        confidence=confidence,
        features=features,
        evidence_ledger=evidence_ledger,
        engine_versions=CURRENT_ENGINE_VERSIONS,
        vad_segments=vad_segments,
        metadata={
            "vad": vad_stats,
            "parameters": parameters,
            "originalContentType": original_content_type,
            "canonicalFormat": "mono PCM WAV, 16000 Hz",
            "durationMs": decoded.duration_ms,
            "sampleRateHz": decoded.sample_rate,
            "channelCount": decoded.channel_count,
            "clippingRatio": decoded.clipping_ratio,
            "audioRetention": "original upload deleted after decode; canonical WAV retained for 24-hour retry window",
        },
    )


def analyze_upload_file(
    upload_bytes: bytes,
    *,
    filename: str,
    content_type: str,
    private_root: Path,
    user_id: str,
    scan_id: str,
    source_capture_id: str,
    capture_kind: CaptureKind,
    device_metadata: Dict[str, Any],
) -> AcousticAnalysisResponse:
    if len(upload_bytes) < MIN_UPLOAD_BYTES:
        raise ValueError("audio_file_too_small")
    if len(upload_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError("audio_file_too_large")
    safe_capture = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in source_capture_id)
    capture_dir = private_root / user_id / scan_id
    capture_dir.mkdir(parents=True, exist_ok=True)
    unique_capture = f"{safe_capture}-{uuid4().hex}"
    original_path = capture_dir / f"{unique_capture}.upload"
    canonical_path = capture_dir / f"{unique_capture}.canonical.wav"
    original_path.write_bytes(upload_bytes)
    try:
        decoded = decode_audio_to_canonical_wav(original_path, canonical_path)
        return analyze_canonical_audio(
            decoded,
            scan_id=scan_id,
            user_id=user_id,
            source_capture_id=source_capture_id,
            capture_kind=capture_kind,
            original_content_type=content_type,
            storage_path=str(canonical_path),
            device_metadata=device_metadata,
        )
    except (RuntimeError, OSError) as exc:
        raise ValueError("audio_unsupported_or_corrupt") from exc
    finally:
        # The original upload is never retained. The canonical WAV remains only
        # for the documented retry window and is removed by maintenance cleanup.
        original_path.unlink(missing_ok=True)


def cleanup_expired_private_audio(private_root: Path, *, now=None, retry_hours: int = 24) -> int:
    """Remove canonical files older than the retry window; never follows symlinks."""
    import time
    cutoff = (now.timestamp() if now else time.time()) - retry_hours * 60 * 60
    removed = 0
    if not private_root.exists():
        return removed
    for path in private_root.glob("**/*.canonical.wav"):
        if path.is_symlink():
            continue
        if path.stat().st_mtime < cutoff:
            path.unlink(missing_ok=True)
            removed += 1
    return removed
