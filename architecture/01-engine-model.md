# Engine Model

## Permanent backend boundaries

`backend/corescope/engine` owns the canonical contracts and stage boundaries.
The implemented Phase A path is:

1. `audio/acoustic_extractor.py` creates versioned acoustic measurements.
2. `engine/evidence.py` converts every measurement into exactly one immutable
   evidence record.
3. The acoustic response exposes the ledger and the complete version manifest.

The multi-capture reasoning implementation currently lives in the frontend
canonical report boundary because the three authenticated acoustic requests are
assembled there. `canonicalResult.ts` is the only publication boundary. Empty
backend stage packages remain extension boundaries until this already-versioned
logic is moved server-side without changing its contracts.

## Provider contract

An evidence provider supplies measurements with source, quality, confidence,
timestamp, and extractor provenance. Providers do not name states or write
narratives. Voice is the only active provider in Phase A.

## Canonical scan target

The target scan aggregate contains session metadata, signal quality, compact
voice features, evidence ledger, dimension vector, decision ledger, reflection,
resonance signature, and version manifest. The runtime now creates this as one
deeply frozen object. Existing normalized V2 tables remain temporarily writable
for production compatibility until a reviewed consolidation migration can be
executed and verified.
