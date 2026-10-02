# Quality Contract v1 pilot

**Scope:** Quality Contract is an opt-in, provider-neutral contract with one validated adapter. It does not claim cross-provider support and is a rollout track inside SDD Pipeline, not a statement that the rest of the product is experimental. This document is read-only rollout guidance; it neither migrates nor deletes artifacts.

## Compatibility and lifecycle

Each schema, rules bundle, evidence envelope, adapter protocol, and policy version is pinned independently as `allowed`, `deprecated`, or `revoked`. Unknown/revoked input fails closed. Deprecated work may only finish before its frozen sunset; it cannot start or accept new work. Legacy input is report-only until an explicit migration.

`evaluateRetirement` is a decision only, not a deletion API. It allows retirement only for a sealed transient projection or raw evidence target in a trusted Git subject when a durable accepted outcome digest exists, live dependencies are zero, recovery is independently verified, and the target is not the sole canonical truth or evidence. Retention action remains a separately authorized human/environment operation.

## Pilot protocol

Freeze sampling, assignments, fixtures, rubric, formulas, missing-data rules, severity, stop rules, and segment definitions before collecting results. An external plan attestation binds those frozen values, calibration cohort, unseen-validation cohort, canonical tuple list, and measurement schema; caller-provided booleans or digests are never a rollout authorization. First calibrate against matched baselines; then run an unseen validation set. A segment is the pre-registered repository, executor, risk, tier, security-fixture, and work-size tuple. Both cohorts must contain every canonical tuple; calibration meets its frozen minimum and unseen validation has at least one eligible run per tuple. Each segment independently needs zero P1 events and no P2-per-run regression. No aggregate can mask a thin or failing segment.

An external measurement attestation binds exact per-segment calibration and unseen baseline/candidate measurements to that plan and its formulas. Every tuple is checked independently for persistent artifacts, active work artifacts, entry documents, duplicated authority, contract/projection tokens and ratio, repeated prose, responsibility count, retrieval time, and p50/p90 authoring, review, and retrieval time. Small/medium work is capped at one active work artifact, zero duplicated authority, and at most three entry documents. Archive/index-only movement does not count as reduction. Any metric or p50/p90 regression, P1, P2 regression, thin segment, absent unseen result, untrusted envelope, or mixed-responsibility file blocks opt-in enforcement.

The gate is deliberately local and data-only. It exposes outcomes for an external human rollout authority and independent reviewer; it does not create dashboards, analytics, commands, automatic migration, or automatic deletion.

## Promotion criteria

Quality Contract v1 can become a default enforcement path only after its frozen pilot protocol has produced trusted calibration and unseen-validation evidence for every declared artifact-efficiency segment, with no blocking P1/P2 outcome and no retrieval, authoring, or review regression. Until then, it remains opt-in and reports its decision without migrating or deleting project artifacts. The stable machine-code registry and schema/policy version pins are the compatibility boundary; the rollout decision remains human-authorized. This legacy pilot gate has authority only for the Quality Contract v1 enforcement track and explicitly cannot promote Full-Team SDLC vNext; vNext uses its frozen benchmark and separate externally attested promotion packet.
