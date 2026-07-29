# Decision Ledger

The immutable Decision Ledger contract records evaluated dimensions, candidate
states, winning and losing reasons, supporting and contradictory evidence,
missing evidence, confounds, selected result, engine version, and rule version.

Phase A now emits this ledger for every completed guided scan. It records all
candidate states, rejected alternatives, the winning or abstention rule,
publication reason, rule versions, extractor versions, model versions, and the
support/contradiction/missingness/confound sets.

A decision resolves to `canonical_state`, `boundary_blend`, or `unresolved`.
Low-quality or missing evidence and ambiguous candidates must abstain. Narrative
and visual consumers read the same deeply frozen result and may not alter it.
