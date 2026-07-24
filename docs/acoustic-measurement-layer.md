# SoulScope Acoustic Measurement Layer

## Boundary

SoulScope uses Praat-Parselmouth only inside the private hosted backend acoustic analysis service. It must not be bundled into browser code, mobile clients, downloadable SDKs, desktop builds, on-premises distributions, or container images distributed outside the hosted service without a separate license review.

The frontend may use browser audio analysis only for immediate capture feedback, microphone level, clipping/duration checks, retry guidance, note visualization, and backward-compatible rendering. Canonical biomarker-style acoustic values come from the server contract.

## Deployment constraints

The backend requires Python 3.11-compatible wheels for the pinned Parselmouth release, `libsndfile` support through the `soundfile` wheel, and writable private temporary storage. The browser converts WebM/Opus to WAV before upload; direct WebM/Opus decoding is intentionally rejected until a declared decoder is provisioned. The canonical request is limited to 24 MiB and 90 seconds, so the reverse proxy must allow at least 24 MiB plus multipart overhead and a request timeout longer than the measured Parselmouth processing time. `SOULSCOPE_ALLOWED_ORIGINS` is a comma-separated allowlist; it must contain the development, preview, and production frontend origins and must never be `*` when credentials are enabled. `SOULSCOPE_PRIVATE_AUDIO_ROOT` must point to encrypted, access-restricted local storage and must not be a shared filename namespace.

## Dependencies

| Package | Version | License | Commercial status | Use |
| --- | ---: | --- | --- | --- |
| praat-parselmouth | 0.4.6 | GPL-3.0-or-later | Approved for hosted server-side use only | Praat F0, jitter, shimmer, HNR, formants |
| Praat | bundled/linked by Parselmouth | GPL | Approved only through hosted server-side Parselmouth boundary | Underlying acoustic routines |
| soundfile | 0.12.1 | BSD-style | Permissive | WAV decoding/writing |
| scipy | 1.14.1 | BSD-3-Clause | Permissive | Signal operations |
| httpx | 0.27.2 | BSD-3-Clause | Permissive | Supabase session verification |
| python-multipart | 0.0.20 | Apache-2.0 | Permissive | FastAPI uploads |
| webrtcvad-wheels | 2.0.14 | MIT-style wrapper/WebRTC license | Permissive | Primary 30 ms VAD at canonical 16 kHz; deterministic energy fallback for unsupported frames or no detected speech |

openSMILE and Surfboard are intentionally not production dependencies.

## Retention

Original uploaded audio is decoded into a private, host-local canonical WAV path. The original upload is deleted immediately after decode. The canonical WAV is retained for a 24-hour retry window and removed by `cleanup_expired_private_audio`; this is a local-disk policy, not durable storage, and the host must provide encrypted storage and restrict filesystem access. A server crash can orphan a canonical file, so the same cleanup job removes orphaned files older than the window. Scan/user deletion cascades database metadata; local files are still removed by the cleanup job. Backups must exclude `backend/.private_audio`.

The route accepts canonical PCM WAV only. The browser decodes WebM/Opus or other browser formats locally and uploads the resulting WAV. Deployments that need direct WebM/Opus uploads require an explicitly provisioned decoder such as FFmpeg and a separate deployment review; no undeclared decoder is assumed here.

The database stores private metadata and measurement provenance. The frontend clears temporary IndexedDB recordings only after server analysis and canonical persistence succeed.

## Canonical Contract

Each measurement carries:

- `feature_id`
- `feature_version`
- `value` or `null`
- `unit`
- `method`
- `source_capture_id`
- `capture_kind`
- `segment_start_ms`
- `segment_end_ms`
- `quality`
- `confidence`
- `rejection_reason`
- `extractor`
- `extractor_version`
- `parameters`
- `device_metadata`
- `created_at`

Invalid or unreliable features remain `null`; they are not converted to zero.

## Methods

Praat-Parselmouth measures F0, jitter, shimmer, HNR, and F1-F3 formants. Jitter and shimmer are only eligible for sustained-vowel captures. Guided speech receives pitch, formant, spectral, VAD, pause, cadence, and documented proxy features.

Spectral slope is calculated as dB per octave across the usable spectrum. `voice.cepstral_peak_prominence_proxy` is a log-spectrum cepstrum peak minus local median, stored in a ratio-like unit and is not a validated cepstral peak prominence calculation. Glottal inverse filtering is not implemented and must not be claimed.

Temporal cadence uses VAD speech segments and a documented syllable-nuclei proxy when transcript timestamps are unavailable. Voiced-run count is no longer treated as primary speech rate.

## Scientific Limits

SoulScope does not diagnose, detect disease, infer cortisol, anxiety, depression, mania, trauma, burnout, truthfulness, or personality from a single vocal feature. Functional observations require multiple agreeing features, adequate quality, baseline support where applicable, contradiction checks, missing-evidence accounting, and alternatives.
