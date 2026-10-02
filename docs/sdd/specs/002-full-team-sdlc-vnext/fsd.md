[← Back to work order](tickets/00-index.md)

---
description: Functional specification for evidence-driven full-team SDD Pipeline vNext.
status: draft
lifecycle: canonical
goal: Run product-to-outcome software delivery as verifiable, risk-based state transitions without inventing human authority.
updated: 2026-10-02
source_decisions_digest: sha256:12e2bd6520e3d8bf93b9b1fb5401b1647f5d111f215938342eb00c1d2d698758
---

# FSD-002 — Full-Team SDLC vNext

## Goal

Extend ASK → SPEC → PLAN → BUILD → CHECK into an intake-to-outcome lifecycle
whose quality, authority, evidence, compatibility, and operating cost can be
tested per benchmark segment. The framework remains provider-neutral policy plus
local deterministic tooling; it does not claim that AI is a senior human or
that repository text grants production authority.

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-013 | Complexity, risk, assurance, and ceremony are separately represented; deterministic precedence is hard stop > assurance > risk > complexity > ceremony. | Must |
| REQ-014 | Versioned role contracts define ownership, approvals, blocks, prohibited self-approval, evidence, escalation, and unavailable-role behavior; A2/A3 separation fails closed. | Must |
| REQ-015 | Lifecycle state transitions are versioned, append-only, exact-subject-bound, replay/expiry safe, and legacy report-only until migration. | Must |
| REQ-016 | Intake/discovery/validation can explicitly proceed, revise, or reject before BUILD using problem evidence, assumptions, hypotheses, and frozen thresholds. | Must |
| REQ-017 | SPEC/PLAN/BUILD/VERIFY derives work packets, tests, verifier evidence, deviations, rework, and explicit architecture/compatibility/reversibility/maintainability/performance/operability checks from risk/assurance without duplicating canonical artifacts. | Must |
| REQ-018 | QA profiles evaluate oracle strength and configurable mutation/property/state/contract/differential/fault/concurrency behavior; unavailable required tooling is skipped/blocked, never pass. | Must |
| REQ-019 | Security and production-readiness profiles connect SSDF/ASVS/SAMM controls, exceptions, provenance/SBOM, SLOs, observability, rollback, restore, and capacity to A2/A3 evidence. | Must |
| REQ-020 | Release authorization binds the exact candidate/environment/window; observation separates technical/product outcomes and turns incidents into redacted regression evidence. | Must |
| REQ-021 | A frozen benchmark runner loads licensed manifests, isolates runs, adapts graders, reports exact segments/effect sizes/missingness, and blocks promotion on any failing critical segment. | Must |
| REQ-022 | Versioned domain/organization packs merge deterministically, may tighten but never weaken global hard stops, and include developer-tooling and higher-risk API references. | Must |
| REQ-023 | Installer/provider capability negotiation distinguishes required from optional capabilities, supports migration/downgrade guidance, and preserves provider-neutral handoff/evidence semantics. | Must |
| REQ-024 | Lifecycle, role, assurance, benchmark, migration, and worked-example documentation identifies each material claim as policy, mechanical validation, runtime enforcement, or host-dependent. | Must |
| REQ-025 | Pilot rollout is local → shadow → report-only → opt-in → unseen evaluation; default promotion is a human decision and never automatic. | Must |
| REQ-026 | Every gate declares prevented risk, owner, required evidence, skip rule, cost measure, and review date; ineffective or duplicative gates can be removed with evidence. | Should |

## Main flows

### Select controls

1. Bind the exact work subject and validate the four independent axes.
2. Compute risk and assurance floors without reading ceremony as safety policy.
3. Load role assignments and applicable domain/organization packs.
4. Return a shadow/report/enforced result according to the explicit project
   policy version; no implicit migration occurs.

### Decide whether to build

1. Normalize intake, target user, opportunity/value, non-goals, constraints, and
   product owner.
2. Discover problem evidence and maintain an assumption ledger.
3. Validate a hypothesis against frozen success/failure thresholds.
4. Product authority emits proceed, revise, or reject. Rejection and revision
   are successful lifecycle outcomes, not pipeline failures.

### Deliver and verify

1. Design/spec artifacts map acceptance criteria to assurance-level evidence.
2. Work packets bind scope, subject, role authority, tests, rollback, and stops.
3. Implementer records deviations; independent verifier evaluates exact output.
4. Weak/self-reported evidence cannot accept A2/A3 work; defects transition to
   rework and require fresh evidence.

### Release, observe, and learn

1. Release readiness proves controls, SLO/observability, rollback/restore, and
   capacity for the exact candidate.
2. External release authority binds candidate, target, and window.
3. Observation records technical signals and product measures separately.
4. Outcome owner decides keep, iterate, rollback, or retire. Incidents create
   minimal redacted regression fixtures without retaining raw sensitive logs.

### Evaluate and promote

1. Load the frozen protocol/corpus and run matched baseline/candidate arms in
   isolated workspaces.
2. Combine deterministic measures with blinded independent graders.
3. Report each complete segment; missing/thin data is insufficient, not green.
4. Human promotion authority reviews quality and cost; no aggregate or version
   bump overrides a critical segment failure.

## Error behavior

| Trigger | Required result |
|---|---|
| ceremony attempts to lower hard stop/assurance | fail/blocked with unchanged floor |
| missing/conflicting A2/A3 authority | blocked; report-only work may continue without acceptance |
| invalid/stale/replayed transition | prior state remains canonical; event retained as failure evidence |
| unsupported required test capability | `BLOCKED` or `INSUFFICIENT`, never pass |
| product hypothesis lacks evidence | revise/reject; never forced into BUILD |
| required CI checker missing after vNext opt-in | fail closed; legacy policy remains report-only |
| missing license/privacy authority | corpus case excluded and missingness reported |
| unseen segment thin, P0/P1 present, or P2 rate regresses | promotion blocked regardless of aggregate |
| production authority unavailable | release blocked; repository content cannot synthesize it |

## Non-functional requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-NF-006 | Deterministic runtime additions use local Node.js 18+ ESM and no third-party runtime dependency. | Must |
| REQ-NF-007 | Schemas/results are bounded, versioned, canonical, fail-closed, and expose exact machine codes plus remediation. | Must |
| REQ-NF-008 | Existing low-risk and legacy workflows remain usable/report-only until explicit migration; public command count remains eight. | Must |
| REQ-NF-009 | Secrets, private customer data, unconsented PII, and unlicensed source never enter corpus or durable raw evidence. | Must |
| REQ-NF-010 | Every quality claim is segment-scoped and reports denominators, effect size, missingness, environment, timeframe, and measurement method. | Must |
| REQ-NF-011 | A fresh worker can recover goal, current state, authority, stop condition, and next action from canonical repository artifacts without transcript dependence. | Must |

## Non-goals

- A ninth public command, automatic production deployment, or provider-wide
  guarantee.
- Persona simulation as evidence of role qualification or independence.
- Treating document count, coverage percentage, or process compliance as proof
  of correctness or product value.
- Silent migration, automatic promotion, or storing raw production incidents.

[← Work-order index](tickets/00-index.md)
