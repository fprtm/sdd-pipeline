[← Back to work order](tickets/00-index.md)

---
description: Functional specification for Quality Contract v1.
status: draft
lifecycle: canonical
goal: Make bounded engineering work independently executable and evidence-backed.
updated: 2026-09-30
source_decisions_digest: sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2
---

# FSD-001 — Quality Contract v1

## Goal

Turn a settled requirement into a bounded executable work contract. A qualified low-cost executor may only perform eligible work; ambiguity, missing authority, stale evidence, and scope deviation must be visible and block forward progress rather than invite guessing.

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-001 | One canonical owner contains a versioned constrained machine-readable contract block. | Must |
| REQ-002 | Results report parse, compatibility, effective decisions, readiness, semantic review, authorization, baseline, executor fit, trusted execution subject, operation lease, change accounting, scope, minimal change, implementation review, evidence, provenance, and retirement independently. | Must |
| REQ-003 | `execution_eligible` is true only for a valid, resolved, ready, reviewed/authorized as required, green-baseline, eligible executor; `may_dispatch` additionally requires one live exact-operation lease. | Must |
| REQ-004 | `may_accept` additionally requires complete accounting, conformant scope, required independent implementation review, fresh valid evidence, and risk-sufficient provenance. | Must |
| REQ-005 | Models may author, challenge, review, and attest; only a qualified human authorizes user-owned intent. Environment policy may authenticate, restrict, classify, or state authorization-not-required, but never manufacture human authorization. | Must |
| REQ-006 | Every effective acceptance criterion has a frozen pre-build observable evidence mapping. | Must |
| REQ-007 | Contract, projection, policy, authorization, review, or evidence drift invalidates dependent approval. | Must |
| REQ-008 | No-Git input is inspect/report-only and cannot claim execution, full accounting, acceptance, or guarded retirement. | Must |
| REQ-009 | Canonical truth has one owner; a ticket is a digest-pinned non-authoritative executable projection; `may_retire` is true only for recoverable non-canonical transient data with durable outcome and no live dependency. | Must |
| REQ-010 | Decision revisions resolve exactly one effective accepted value per key; missing predecessor, cycle, competing acceptance, or authority downgrade blocks. | Must |
| REQ-011 | Pilot/rollout evaluates each pre-registered repository, executor, risk, tier, and security-fixture segment independently; thin or failing segments cannot be hidden by aggregate results. | Must |
| REQ-012 | Artifact and cognitive-bloat limits are measured against a matched baseline; archive/index movement cannot simulate reduction. | Must |

## Main flows

### Prepare

1. The author records goal, requirements, AC, approved scope, risk, landmarks, stop conditions, and expected evidence in the canonical owner.
2. A strict evaluator rejects ambiguity, unsupported/revoked version, unresolved effective decision, incomplete landmark, or missing AC mapping.
3. An independent capable reviewer performs the required pre-build semantic review. A qualified human records authorization when policy requires it; environment policy verifies it and can only restrict it.
4. A material change invalidates every dependent review, authority, and evidence item.

### Execute

1. The executor runs read-only preflight against a trusted base and approved canonical contract/projection.
2. Trusted policy derives risk/tier/fit; an executor's self-declared identity or task classification is never sufficient. `execution_eligible` is an eligibility decision, not proof a bypassing executor cannot mutate outside the gateway; `may_dispatch` is the lease-gated routed operation decision.
3. Immediately before each mutation, privileged runner action, scope expansion, and acceptance transition, a bounded authorization/review lease is rechecked.
4. Missing/ambiguous landmark, red/unknown required baseline, stale authority, or unapproved public/schema/dependency change blocks with minimum remediation.

### Verify and accept

1. A trusted runner seals evidence for one immutable candidate snapshot and frozen AC mapping.
2. Post-build conformance review binds that exact candidate; it cannot replace the pre-build semantic review.
3. The evaluator emits all dimensions and derives predicates normatively; it never gives an unqualified generic PASS.
4. Canonical outcomes endure; projections and raw evidence retire only through guarded lifecycle checks. The reference gateway enforces leases for actions routed through it; unmediated filesystem/tool actions are residual risk and cannot claim gateway enforcement.

## Error behavior

| Trigger | Result | Recovery |
|---|---|---|
| Duplicate strict field or competing effective revision | `parse=fail/PARSE_DUPLICATE_KEY` or `effective_decisions=fail/DECISION_CONFLICT` | Resolve with one equal-or-higher-authority revision. |
| Missing trusted review/authorization/lease | `semantic_review=fail/REVIEW_MISSING`, `authorization=fail/AUTH_MISSING`, or `operation_lease=fail/LEASE_MISSING` | Obtain the required external event; Markdown prose is only a claim. |
| Different candidate/contract/rules/environment in evidence | `evidence=stale/EVIDENCE_SUBJECT_STALE` | Rerun mapped evidence in a new sealed run. |
| Prompt-like repository content | Optional defense-in-depth finding and escalation | It may only block/escalate, never authorize or lower risk; no link fetch/decode/execute occurs and a clean/missed scan proves nothing. Low-cost execution blocks on a finding. |

## Normative statuses and predicates

Each result dimension has exactly one status: `pass`, `fail`, `unknown`, `not-required`, `stale`, or `blocked`; terms such as “conflict”, “missing”, and “invalid” are registered `code` values, never statuses. `not-required` is valid only where policy explicitly permits it and never for evidence of an effective AC. A result always carries `code`, `cause`, `risk`, `owner`, and `remediation`. Provenance assurance is separately `asserted|harness-attested|externally-attested|degraded`; low-risk requires `harness-attested`, medium/T3 requires `externally-attested`, and high-risk requires `externally-attested` plus qualified human/specialist review. `degraded` assurance never satisfies medium/high acceptance.

Prompt-injection detection is optional defense-in-depth: it may only add a block/escalation, never authorize or relax policy, and never fetch, decode, or execute linked/content data. The same authority, tool, network, secret, and gateway boundaries remain required when detection is disabled or misses.

| Predicate | Required conditions |
|---|---|
| `execution_eligible=true` | `parse`, `compatibility`, `effective_decisions`, `readiness`, `baseline`, `executor_fit`, and `trusted_execution_subject` are `pass`; required semantic review is `pass`; authorization is `pass` or policy-valid `not-required`; no required dimension is `unknown`, `stale`, `fail`, or `blocked`. |
| `may_dispatch=true` | `execution_eligible=true` and one live environment-issued lease matches the exact operation digest. Consuming it changes only `may_dispatch` for that operation, not eligibility. |
| `may_accept=true` | `execution_eligible=true`, a distinct live acceptance-transition lease exists, and `change_accounting`, `scope`, `minimal_change`, `implementation_review`, `evidence`, and `provenance` are `pass`; every effective AC has valid sealed evidence. |
| `may_retire=true` | `retirement=pass`: target is a sealed transient projection/raw evidence, its durable outcome exists, no live dependency references it, Git/history recovery is verified, and it is not sole canonical truth/evidence. |
| No-Git | `trusted_execution_subject=fail/SUBJECT_NO_GIT`, `change_accounting=unknown`, `execution_eligible=false`, `may_dispatch=false`, `may_accept=false`, and `may_retire=false`, regardless of other green dimensions. |

| Risk/fit | Eligible executor |
|---|---|
| low-risk T1/T2 | Qualified executor after all predicate requirements; low-cost executor additionally needs independent pre-build review. |
| medium T1/T2 | Low-cost executor is eligible only after independent capable semantic review, human authorization, green baseline, complete landmarks, and external attestation; otherwise capable executor. |
| bounded large T1/T2 | Low-cost executor is eligible only under the full medium predicate and an independently executable slice. |
| T3, cross-cutting, high-risk/security/migration/public contract/schema/dependency | Capable/specialist executor and qualified human/specialist review; low-cost executor can only perform a bounded mechanical subtask. |

## Pilot and bloat gates

Before rollout, sampling, assignments, fixtures, rubric, formulas, missing-data handling, severity (`P1` safety/security/data-loss/authority breach or mandatory-stop violation; `P2` material AC/scope rework), stop rules, and segment go/no-go rules are frozen. Every repository/executor/risk/tier/security-fixture segment passes independently; a thin segment is insufficient evidence and an aggregate cannot offset it. P1 target is zero; P2 is compared per eligible run. Matched baseline evaluation measures persistent artifacts, active entries, duplicated authority, contract/projection tokens and ratio, repeated prose, responsibility count, retrieval time, and p50/p90 authoring/review/retrieval. Small/medium work has at most one active work artifact, zero duplicated authority, and at most three entry documents. An oversized mixed-responsibility file, p50/p90 non-inferiority regression, or archive/index-only “reduction” fails the gate. Retirement requires a durable outcome, no live dependency, recoverability, and preservation of sole canonical truth/evidence.

## Non-functional requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-NF-001 | Local-first Node.js 18+ ESM, no third-party runtime dependency. | Must |
| REQ-NF-002 | Unknown, ambiguous, or revoked mandatory input fails closed. | Must |
| REQ-NF-003 | Evaluator is read-only and never turns prose into commands or authority. | Must |
| REQ-NF-004 | Output is deterministic, concise, human-readable, and versioned JSON. | Must |
| REQ-NF-005 | A fresh worker reaches goal, truth, stop condition, and next action from at most three active documents. | Must |

[← Work-order index](tickets/00-index.md)
