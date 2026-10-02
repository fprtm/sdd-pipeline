# vNext lifecycle

[Policy] Canonical states and permitted edges live only in
`skills/meta/quality-contract/rules/lifecycle.mjs`. Product rejection/revision,
delivery rework, release rollback, outcome review, keep/iterate/rollback/retire,
and terminal learning are first-class routes.

[Mechanical] Events bind the predecessor, work subject, decision role, expiry,
and nonce. Invalid input preserves the last valid state. TEST-029 is the
executable owner.

[Runtime] External attestation and durable replay adapters supply trust; the
repository fixtures demonstrate protocol behavior but do not manufacture that
trust.

[Host-dependent] Release and production actions remain outside this repository.
