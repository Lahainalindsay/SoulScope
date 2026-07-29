# Engine Model

## Permanent backend boundaries

`backend/corescope/engine` owns the canonical contracts and stage boundaries.
The implemented Phase A path is:

1. `audio/acoustic_extractor.py` creates versioned acoustic measurements.
2. `engine/evidence.py` converts every measurement into exactly one immutable
   evidence record.
3. The acoustic response exposes the ledger and the complete version manifest.

Empty stage packages are deliberate architecture boundaries, not hidden
implementations. They must remain unable to infer meaning until their rules and
registries are approved.

## Provider contract

An evidence provider supplies measurements with source, quality, confidence,
timestamp, and extractor provenance. Providers do not name states or write
narratives. Voice is the only active provider in Phase A.

## Canonical scan target

The target scan aggregate contains session metadata, signal quality, compact
voice features, evidence ledger, dimension vector, decision ledger, reflection,
resonance signature, and version manifest. Existing normalized V2 tables remain
temporarily readable until a production migration can be executed and verified.
