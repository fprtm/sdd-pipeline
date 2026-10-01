# Quality Contract v1 pilot

Quality Contract v1 is provider-neutral with one validated adapter. It does not claim cross-provider support. This document is read-only rollout guidance; it neither migrates nor deletes artifacts.

## Compatibility and lifecycle

Each schema, rules bundle, evidence envelope, adapter protocol, and policy version is pinned independently as `allowed`, `deprecated`, or `revoked`. Unknown/revoked input fails closed. Deprecated work may only finish before its frozen sunset; it cannot start or accept new work. Legacy input is report-only until an explicit migration.

`evaluateRetirement` is a decision only, not a deletion API. It allows retirement only for a sealed transient projection or raw evidence target in a trusted Git subject when a durable accepted outcome digest exists, live dependencies are zero, recovery is independently verified, and the target is not the sole canonical truth or evidence. Retention action remains a separately authorized human/environment operation.

## Pilot protocol

Freeze sampling, assignments, fixtures, rubric, formulas, missing-data rules, severity, stop rules, and segment definitions before collecting results. An external plan attestation binds those frozen values, calibration cohort, unseen-validation cohort, canonical tuple list, and measurement schema; caller-provided booleans or digests are never a rollout authorization. First calibrate against matched baselines; then run an unseen validation set. A segment is the pre-registered repository, executor, risk, tier, security-fixture, and work-size tuple. Both cohorts must contain every canonical tuple; calibration meets its frozen minimum and unseen validation has at least one eligible run per tuple. Each segment independently needs zero P1 events and no P2-per-run regression. No aggregate can mask a thin or failing segment.

An external measurement attestation binds exact per-segment calibration and unseen baseline/candidate measurements to that plan and its formulas. Every tuple is checked independently for persistent artifacts, active work artifacts, entry documents, duplicated authority, contract/projection tokens and ratio, repeated prose, responsibility count, retrieval time, and p50/p90 authoring, review, and retrieval time. Small/medium work is capped at one active work artifact, zero duplicated authority, and at most three entry documents. Archive/index-only movement does not count as reduction. Any metric or p50/p90 regression, P1, P2 regression, thin segment, absent unseen result, untrusted envelope, or mixed-responsibility file blocks opt-in enforcement.

The gate is deliberately local and data-only. It exposes outcomes for an external human rollout authority and independent reviewer; it does not create dashboards, analytics, commands, automatic migration, or automatic deletion.
