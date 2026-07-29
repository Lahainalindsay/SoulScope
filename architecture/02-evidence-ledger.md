# Evidence Ledger

The Evidence Ledger is immutable and exhaustive: each extracted measurement
produces a record, including rejected or unavailable measurements.

Each record contains:

- stable evidence ID
- feature source and observation
- measured value, units, direction, and optional magnitude
- quality, optional baseline, confidence, and explicit uncertainty
- missing-evidence flag and rejection reason
- capture, segment, method, and extractor provenance
- support and contradiction references
- confounds
- timestamp and extractor version

During Phase A, an available raw measurement has `stable` direction because no
approved baseline/directional rule has run. Missing measurements use
`unavailable`; they are never assigned a numeric zero.

Ledger IDs and evidence IDs are deterministic from scan, capture, feature, and
feature-version identity. The enclosing ledger records all four reproducibility
versions.

The shared guided-scan result preserves every accepted and rejected canonical
acoustic measurement. Derived evidence may reference these IDs; it may not
replace or reinterpret the raw measurement record.
