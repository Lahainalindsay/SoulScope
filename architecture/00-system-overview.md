# SoulScope System Overview

## Authority

This directory is the authoritative Phase A implementation guide. SoulScope is
voice-only at runtime. Future modalities enter through evidence-provider
extension points and may not create parallel reasoning paths.

## Canonical flow

Recorded voice → acoustic extraction → Evidence Engine → immutable Evidence
Ledger → Dimension Engine → continuous constellation geometry → canonical
state, boundary blend, or unresolved result → interactions and pattern
selection → immutable Decision Ledger → one deeply immutable result object →
narrative and Resonance Signature consumers.

The backend owns canonical acoustic extraction and per-capture Evidence Ledger
records. The guided-scan frontend combines the three capture ledgers and
performs the current versioned dimension, geometry, candidate, abstention,
narrative, and signature stages. This split is explicit; neither consumer may
read raw audio or create an independent conclusion.

## Invariants

1. Raw features are measurements, not emotions.
2. No dimension or conclusion may bypass the Evidence Ledger.
3. Unknown is never converted to neutral or balanced.
4. A renderer may format a canonical result but may not reinterpret evidence.
5. Every persisted canonical scan carries engine, registry, feature, and rule
   versions.
6. Historical compatibility is a read concern, never a second writable engine.
7. Insufficient, contradictory, or tied evidence publishes `Unresolved`.
