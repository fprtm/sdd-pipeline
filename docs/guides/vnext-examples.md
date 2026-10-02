# vNext worked examples

## Developer-tooling change

[Policy] Load `skills/packs/developer-tooling/pack.json` over an A1 global
policy. [Mechanical] TEST-036 proves scope stays under `skills/` and required
executed/review evidence cannot be removed. [Runtime] the resulting digest is
bound into the work subject. [Host-dependent] a real reviewer supplies review
authority.

## High-risk API release

[Policy] Load `skills/packs/high-risk-api/pack.json`; effective assurance is A3.
[Mechanical] readiness requires executable security, SBOM, provenance,
signature, SLO, observability, rollback, restore, and capacity evidence.
[Mechanical] A2/A3 also carries explicit error-budget evidence and a bounded
release package (candidate/environment, deployment/migration/rollback plans,
release notes, monitoring queries, owner, and on-call actor).
[Runtime] a single-use external authorization binds candidate, environment, and
readiness digests. [Host-dependent] only the production release system deploys.

## Ineffective gate

[Policy] Every gate declares risk, trigger, owner, evidence, decision outputs,
skip rule/authority, cost, findings, false-positive rate, and review date.
[Mechanical] `rules/gate-effectiveness.mjs` supports keep/remove/revise from
complete evidence. [Runtime] the organization supplies real invocation evidence.
