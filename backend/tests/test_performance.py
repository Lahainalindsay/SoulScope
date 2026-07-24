import time

import soundfile as sf

from corescope.audio.acoustic_extractor import analyze_upload_file
from test_acoustic_extractor import vowel_audio


def test_three_second_analysis_completes_within_request_budget(tmp_path):
    audio, sr = vowel_audio(180)
    source = tmp_path / "performance.wav"
    sf.write(source, audio, sr, subtype="PCM_16")
    started = time.perf_counter()
    result = analyze_upload_file(
        source.read_bytes(),
        filename="performance.wav",
        content_type="audio/wav",
        private_root=tmp_path,
        user_id="performance-user",
        scan_id="performance-scan",
        source_capture_id="performance-capture",
        capture_kind="sustained_vowel",
        device_metadata={"fixture": "performance"},
    )
    elapsed = time.perf_counter() - started
    assert result.features
    # This is a request-budget guard, not a clinical or accuracy claim.
    assert elapsed < 20.0
