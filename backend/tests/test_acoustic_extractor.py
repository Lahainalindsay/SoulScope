from pathlib import Path

import numpy as np
import parselmouth
import pytest
import soundfile as sf
from parselmouth.praat import call

from corescope.audio.acoustic_extractor import (
    MAX_UPLOAD_BYTES,
    analyze_canonical_audio,
    analyze_upload_file,
    cleanup_expired_private_audio,
    decode_audio_to_canonical_wav,
)


def vowel_audio(hz=180.0, seconds=3.0, sr=16000, amplitude_modulation=0.0, noise_db=None):
    t = np.arange(int(sr * seconds)) / sr
    audio = np.zeros_like(t)
    for harmonic in range(1, 80):
        frequency = harmonic * hz
        envelope = sum(np.exp(-0.5 * ((frequency - center) / bandwidth) ** 2) for center, bandwidth in ((500, 180), (1500, 250), (2500, 300)))
        audio += envelope * np.sin(2 * np.pi * frequency * t) / harmonic
    if amplitude_modulation:
        audio *= 1 + amplitude_modulation * np.sin(2 * np.pi * 2 * t)
    audio *= 0.25 / max(np.max(np.abs(audio)), 1e-6)
    if noise_db is not None:
        rng = np.random.default_rng(42)
        noise = rng.normal(size=audio.size)
        noise *= np.sqrt(np.mean(audio**2)) / (10 ** (noise_db / 20) * max(np.sqrt(np.mean(noise**2)), 1e-6))
        audio += noise
    return audio.astype(np.float32), sr


def feature(response, feature_id: str):
    return next(item for item in response.features if item.feature_id == feature_id)


def response_for(tmp_path: Path, audio, capture_kind="sustained_vowel", floor=60, ceiling=400):
    source = tmp_path / f"source-{capture_kind}.wav"
    canonical = tmp_path / f"canonical-{capture_kind}.wav"
    sf.write(source, audio, 16000, subtype="PCM_16")
    decoded = decode_audio_to_canonical_wav(source, canonical)
    return analyze_canonical_audio(
        decoded,
        scan_id="00000000-0000-0000-0000-000000000001",
        user_id="00000000-0000-0000-0000-000000000002",
        source_capture_id="test:voice:reference",
        capture_kind=capture_kind,
        original_content_type="audio/wav",
        storage_path=str(canonical),
        device_metadata={"fixture": "controlled"},
        pitch_floor_hz=floor,
        pitch_ceiling_hz=ceiling,
    )


def test_authentic_f0_and_pitch_parameters(tmp_path):
    response = response_for(tmp_path, vowel_audio(180)[0])
    assert abs(feature(response, "voice.f0.median").value - 180) < 1.0
    assert feature(response, "voice.f0.median").unit == "Hz"
    assert feature(response, "voice.pitch_floor_used").value == 60
    assert feature(response, "voice.pitch_ceiling_used").value == 400
    restricted = response_for(tmp_path, vowel_audio(180)[0], floor=300, ceiling=400)
    assert feature(restricted, "voice.f0.median").value is None


def test_jitter_shimmer_hnr_and_units(tmp_path):
    response = response_for(tmp_path, vowel_audio(180, amplitude_modulation=0.12)[0])
    expected = {
        "voice.jitter.local": "fraction", "voice.jitter.local_absolute": "seconds",
        "voice.jitter.rap": "fraction", "voice.jitter.ppq5": "fraction", "voice.jitter.ddp": "fraction",
        "voice.shimmer.local": "fraction", "voice.shimmer.local_db": "dB",
        "voice.shimmer.apq3": "fraction", "voice.shimmer.apq5": "fraction", "voice.shimmer.apq11": "fraction", "voice.shimmer.dda": "fraction",
        "voice.hnr.mean": "dB",
    }
    for feature_id, unit in expected.items():
        item = feature(response, feature_id)
        assert item.unit == unit
        assert item.value is not None, feature_id
        assert item.rejection_reason is None


def test_direct_praat_reference_comparison_for_f0_jitter_shimmer_and_formants(tmp_path):
    audio, sr = vowel_audio(180, amplitude_modulation=0.1)
    response = response_for(tmp_path, audio)
    sound = parselmouth.Sound(audio, sampling_frequency=sr)
    pitch = call(sound, "To Pitch", 0.0, 60, 400)
    direct_f0 = float(np.median(pitch.selected_array["frequency"][pitch.selected_array["frequency"] > 0]))
    assert abs(feature(response, "voice.f0.median").value - direct_f0) < 1.0
    formant = call(sound, "To Formant (burg)", 0.0, 5, 5500, 0.025, 50)
    for index in (1, 2, 3):
        direct = float(call(formant, "Get value at time", index, 1.5, "Hertz", "Linear"))
        measured = feature(response, f"voice.formant.f{index}.median").value
        assert measured is not None and abs(measured - direct) < 120.0
    point_process = call(sound, "To PointProcess (periodic, cc)", 60, 400)
    jitter_args = (0.0, 0.0, 1 / 400, 1 / 60, 1.3)
    shimmer_args = (0.0, 0.0, 1 / 400, 1 / 60, 1.3, 1.6)
    calls = {
        "voice.jitter.local": (point_process, "Get jitter (local)", jitter_args),
        "voice.jitter.local_absolute": (point_process, "Get jitter (local, absolute)", jitter_args),
        "voice.jitter.rap": (point_process, "Get jitter (rap)", jitter_args),
        "voice.jitter.ppq5": (point_process, "Get jitter (ppq5)", jitter_args),
        "voice.jitter.ddp": (point_process, "Get jitter (ddp)", jitter_args),
        "voice.shimmer.local": ([sound, point_process], "Get shimmer (local)", shimmer_args),
        "voice.shimmer.local_db": ([sound, point_process], "Get shimmer (local_dB)", shimmer_args),
        "voice.shimmer.apq3": ([sound, point_process], "Get shimmer (apq3)", shimmer_args),
        "voice.shimmer.apq5": ([sound, point_process], "Get shimmer (apq5)", shimmer_args),
        "voice.shimmer.apq11": ([sound, point_process], "Get shimmer (apq11)", shimmer_args),
        "voice.shimmer.dda": ([sound, point_process], "Get shimmer (dda)", shimmer_args),
    }
    for feature_id, (objects, command, args) in calls.items():
        direct = float(call(objects, command, *args))
        measured = feature(response, feature_id).value
        assert measured is not None and abs(measured - direct) <= 1e-5, feature_id


def test_formant_spectral_slope_and_cpp_proxy_provenance(tmp_path):
    response = response_for(tmp_path, vowel_audio(180)[0])
    assert feature(response, "voice.spectral_slope").unit == "dB_per_octave"
    cpp = feature(response, "voice.cepstral_peak_prominence_proxy")
    assert cpp.method.startswith("cepstral_peak_prominence_proxy")
    assert "not validated CPP" in cpp.method


def test_silence_short_noise_and_clipping_failure_paths(tmp_path):
    silence = tmp_path / "silence.wav"
    sf.write(silence, np.zeros(16000 * 3), 16000, subtype="PCM_16")
    with pytest.raises(ValueError, match="audio_silent"):
        decode_audio_to_canonical_wav(silence, tmp_path / "silent-canonical.wav")
    short = tmp_path / "short.wav"
    sf.write(short, np.ones(16000), 16000, subtype="PCM_16")
    with pytest.raises(ValueError, match="audio_too_short"):
        decode_audio_to_canonical_wav(short, tmp_path / "short-canonical.wav")
    noisy, _ = vowel_audio(180, noise_db=5)
    assert response_for(tmp_path, noisy).metadata["vad"]["vad_method"] in {"webrtc_vad", "energy_vad"}
    clipped = np.clip(noisy * 8, -1, 1)
    assert response_for(tmp_path, clipped).metadata["clippingRatio"] > 0


def test_vad_leading_internal_trailing_pause_and_provenance(tmp_path):
    tone, _ = vowel_audio(170, seconds=1.0)
    audio = np.concatenate([np.zeros(16000 // 2), tone, np.zeros(16000), tone, np.zeros(16000 // 2)])
    response = response_for(tmp_path, audio, capture_kind="guided_speech")
    kinds = [segment.kind for segment in response.vad_segments]
    assert "leading_silence" in kinds
    assert "internal_pause" in kinds
    assert "trailing_silence" in kinds
    assert response.metadata["parameters"]["vad"].startswith("webrtc_vad")
    assert feature(response, "voice.jitter.local").value is None


def test_invalid_corrupt_unsupported_and_oversized_uploads(tmp_path):
    with pytest.raises(ValueError, match="audio_file_too_large"):
        analyze_upload_file(b"x" * (MAX_UPLOAD_BYTES + 1), filename="x.wav", content_type="audio/wav", private_root=tmp_path, user_id="u", scan_id="s", source_capture_id="c", capture_kind="guided_speech", device_metadata={})
    with pytest.raises(ValueError, match="audio_unsupported_or_corrupt"):
        analyze_upload_file(b"not audio" * 500, filename="x.mp3", content_type="audio/mpeg", private_root=tmp_path, user_id="u", scan_id="s", source_capture_id="c", capture_kind="guided_speech", device_metadata={})


def test_original_upload_is_deleted_and_expired_canonical_files_are_cleaned(tmp_path):
    audio, _ = vowel_audio(180)
    source = tmp_path / "capture.wav"
    sf.write(source, audio, 16000, subtype="PCM_16")
    result = analyze_upload_file(source.read_bytes(), filename="capture.wav", content_type="audio/wav", private_root=tmp_path, user_id="u", scan_id="s", source_capture_id="c", capture_kind="guided_speech", device_metadata={})
    assert result.storage_path and Path(result.storage_path).exists()
    assert not list((tmp_path / "u" / "s").glob("*.upload"))
    old = Path(result.storage_path)
    old.touch()
    old_mtime = old.stat().st_mtime - 48 * 60 * 60
    import os
    os.utime(old, (old_mtime, old_mtime))
    assert cleanup_expired_private_audio(tmp_path, retry_hours=24) == 1
    assert not old.exists()


def test_capture_kind_eligibility_keeps_cycle_measurements_null_for_speech(tmp_path):
    response = response_for(tmp_path, vowel_audio(150)[0], capture_kind="guided_speech")
    assert feature(response, "voice.jitter.local").value is None
    assert feature(response, "voice.jitter.local").rejection_reason == "insufficient_reliable_signal"
    assert feature(response, "voice.syllable_nuclei_rate").method == "documented_energy_peak_proxy_v1"
