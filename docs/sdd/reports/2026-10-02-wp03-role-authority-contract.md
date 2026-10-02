---
description: Implemented shadow role-accountability, authority, separation-of-duty, and small-team degradation contract for SDD Pipeline vNext.
status: active
lifecycle: transient
updated: 2026-10-02
---

# WP-03 — role accountability and authority contract draft

**State:** IMPLEMENTED in shadow/report-only mode. Runtime owner:
`skills/meta/quality-contract/rules/roles.mjs`; fixture owner:
`skills/meta/quality-contract/fixtures/vnext/roles.json`. It creates no identity,
human authority, or runtime permission. Actor labels in repository content remain
provenance claims unless a trusted external attestation binds them.

## Canonical role schema

```yaml
role_contract_version: "1"
role_id: product-owner | ux-research | architect | implementer | verifier | security-reviewer | sre | release-authority | outcome-owner
owns: ["bounded responsibility"]
may_approve: ["named transition or artifact class"]
may_block: ["named transition or risk class"]
must_not_self_approve: ["named transition or evidence class"]
required_inputs: ["typed artifact/evidence reference"]
required_outputs: ["typed artifact/evidence reference"]
required_evidence: ["evidence class and minimum provenance"]
escalates_when: ["deterministic condition"]
fallback_when_unavailable:
  result: degraded | blocked
  allowed_actions: ["report-only action"]
  prohibited_actions: ["transition or authority"]
```

Contracts are versioned policy. A work assignment separately binds a role to an
actor subject, exact work subject, validity interval, and attestation class. A
role definition never proves that an assignee is qualified or human.

## Default role contracts

| Role | Owns | May approve/block | Must not self-approve | Required evidence |
|---|---|---|---|---|
| product-owner | problem, user, measurable outcome, priority, non-goals, kill/continue | Problem Fit, Solution Fit, scope acceptance; may stop unsupported value | technical safety, QA evidence, production readiness | problem evidence, JTBD, assumptions, success/failure thresholds, value rationale |
| ux-research | user evidence, interaction assumptions, usability, accessibility intent, user harm | UX research conclusion and usability finding; may block unresolved user harm | backend correctness or release safety | research method/sample/limitations, task evidence, accessibility findings |
| architect | boundaries, compatibility, reversibility, migration, performance budget, maintainability | Design Ready technical fitness; may block irreversible/unsupported design | product outcome, security exception, production release | alternatives, constraints, compatibility/recovery proof, decision trace |
| implementer | bounded implementation, local tests, deviation disclosure, comprehension | local completion claim only | changed acceptance criteria, own independent verification, A2/A3 acceptance | exact diff subject, test output, deviations, weakest point |
| verifier | risk-based oracle, positive/negative/adversarial checks, regression, residual risk | Release Candidate evidence; may block insufficient proof | code it materially implemented, business risk acceptance | independently produced evidence bound to exact subject and frozen criteria |
| security-reviewer | threats/abuse, security controls, exception review, provenance/dependency risk | security control result; may block High/Critical gap | business risk acceptance or own control implementation at A2/A3 | threat/control mapping, executable attacks, exception owner/expiry |
| sre | SLI/SLO feasibility, observability, capacity, backup/restore, incident readiness | operational readiness; may block unrecoverable release | product-value decision or release authority | monitored signals, rollback/restore/capacity rehearsal evidence |
| release-authority | exact candidate, environment, rollout window, rollback authority | Release Authorized; may cancel/rollback | manufacture readiness evidence or reuse authorization for another subject | external authority attestation, exact digest/environment, window and rollback owner |
| outcome-owner | product and technical outcome review | keep/iterate/rollback/retire outcome decision | rewrite frozen measures after observation | observation window, product+technical evidence, limitations and decision |

## Assignment and provenance schema

```yaml
assignment_version: "1"
assignment_id: "stable opaque ID"
role_id: "canonical role"
actor_id: "provider/external subject identifier"
work_subject_digest: "sha256:<64 lowercase hex>"
qualification_class: asserted | harness-attested | externally-attested
valid_from: "RFC3339 UTC"
expires_at: "RFC3339 UTC"
issuer: "trusted issuer identifier"
conflicts: ["role or work relationship"]
attestation_digest: "sha256:<64 lowercase hex>"
```

Repository-authored `actor_id` proves only distinct strings. Medium/high
acceptance cannot treat that as externally attested independence. Expired,
revoked, wrong-subject, or conflicting assignments are invalid.

## Separation-of-duty matrix

| Assurance | Minimum separation | Forbidden self-approval | Unavailable-role result |
|---|---|---|---|
| A0 | author may perform smoke/static self-check; no external authority implied | irreversible or externally impactful action | degraded report-only if a requested optional role is absent |
| A1 | implementer and reviewer/verifier should differ; a recorded cold reread is explicitly degraded, not independent | silently changing criteria and accepting the changed result | degraded for reversible low/moderate risk; acceptance states limitation |
| A2 | implementer ≠ verifier; security reviewer distinct when security zones apply; business risk owner distinct from technical evidence producer | implementation+verification, security exception by control implementer, release by repository agent | blocked for acceptance; drafting/testing may continue report-only |
| A3 | implementer, verifier, applicable specialist, and qualified human authority are separately attested; release authority external | any self-acceptance, self-issued authority, or actor-string-only proof | blocked; no ceremony/mode fallback |

One human may wear multiple business roles on a small team only when the
conflicts are declared and the assurance row permits it. Combining titles never
combines incompatible evidence-production and acceptance roles.

## Small-team multi-hat policy

1. Record every role the actor holds and each relevant conflict.
2. Preserve the distinction between producing evidence, reviewing evidence,
   accepting residual risk, and authorizing an external operation.
3. At A0/A1, a single human may hold product, architecture, release, and outcome
   roles for reversible work; implementer self-review is labeled degraded.
4. At A2, one human may hold multiple owner roles but cannot be both the sole
   implementer and sole verifier/security reviewer.
5. At A3, unavailable independent/qualified authority blocks acceptance and
   release. No synthetic persona, fresh prompt, or actor alias repairs it.

## Transition authority mapping

| Transition decision | Required approving role | Required independent/blocking review |
|---|---|---|
| Intake Valid | product-owner | none at A0/A1; policy validation always runs |
| Problem Fit / reject | product-owner | UX/research input when user evidence is material |
| Solution Fit / revise | product-owner | architect and relevant risk specialist advise; cannot replace owner |
| Design Ready | architect | security/SRE review when triggered by assurance |
| Ready to Build | product-owner for scope + architect/lead for work order | Quality Contract preflight and assurance assignment |
| Release Candidate | verifier | security reviewer and SRE results when applicable |
| Release Authorized | release-authority | exact-subject readiness evidence; A2/A3 authority externally attested |
| Outcome Reviewed | outcome-owner | product and SRE evidence presented separately |
| exception accepted | named business risk owner | security/technical reviewer supplies finding but cannot accept own exception |

## Required negative fixtures

- A2 implementer and verifier share the same actor subject → acceptance blocked.
- A3 four distinct repository strings without external attestations → blocked.
- security reviewer implemented the same control and accepts its exception → blocked.
- release authorization digest/environment differs from candidate → blocked.
- assignment expired, revoked, wrong subject, or unknown issuer → blocked.
- missing optional UX role for a non-UI A1 change → explicit not-required, not a
  fake assignment.
- missing required security reviewer for an A2 auth change → blocked.
- small-team multi-hat A1 reversible change → degraded result with exact conflicts.
- fresh AI context with no trusted actor attestation → context separation may be
  recorded, but it does not satisfy external human authority.

## WP-03 acceptance mapping

| Deliverable | Draft status | Remaining proof |
|---|---|---|
| role schema/default roles | implemented and deeply frozen | benchmark usability evidence remains WP-14 |
| small-team policy | implemented A1 degraded path | benchmark usability evidence remains WP-14 |
| conflict/degraded rules | same-actor/conflict/attestation fixtures pass | achieved in shadow mode |
| transition authority | implemented role coverage; WP-04 binds events | achieved in shadow mode |
| A2/A3 fail-closed behavior | missing/self/stale/wrong-subject/weak attestation blocks | achieved in shadow mode |

WP-03 package acceptance is achieved for shadow mode. TEST-028 passes valid,
same-actor, missing, stale, wrong-subject, insufficient-attestation, declared
conflict, A1 multi-hat, A3, and security-role fixtures against registered machine
codes. External identity and enforced acceptance remain explicit host/WP-12
boundaries.
