# Decision Ledger

The immutable Decision Ledger contract records evaluated dimensions, candidate
states, winning and losing reasons, supporting and contradictory evidence,
missing evidence, confounds, selected result, engine version, and rule version.

Phase A defines the contract only. It does not generate a fake decision from
acoustic measurements. Phase B must add explicit abstention and candidate
evaluation rules before any new Constellation result is emitted.

A valid future decision must reference Evidence Ledger IDs. Narrative and visual
consumers must read the same selected canonical result and may not alter it.
