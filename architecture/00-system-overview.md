# SoulScope System Overview

## Authority

This directory is the authoritative Phase A implementation guide. SoulScope is
voice-only at runtime. Future modalities enter through evidence-provider
extension points and may not create parallel reasoning paths.

## Canonical flow

Recorded voice → acoustic extraction → Evidence Engine → immutable Evidence
Ledger → Dimension Engine → later reasoning stages → immutable Decision Ledger
→ one canonical scan result → reflection, signature, and narrative consumers.

Phase A implements the extraction-to-ledger boundary and permanent module
boundaries. Constellation, interaction, meaning, synthesis, reflection, and
signature mathematics remain intentionally unimplemented.

## Invariants

1. Raw features are measurements, not emotions.
2. No dimension or conclusion may bypass the Evidence Ledger.
3. Unknown is never converted to neutral or balanced.
4. A renderer may format a canonical result but may not reinterpret evidence.
5. Every persisted canonical scan carries engine, registry, feature, and rule
   versions.
6. Historical compatibility is a read concern, never a second writable engine.
