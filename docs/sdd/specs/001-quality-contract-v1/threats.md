[← Back to work order](tickets/00-index.md)

---
description: Threat model and security controls for Quality Contract v1.
status: draft
lifecycle: canonical
updated: 2026-09-30
source_decisions_digest: sha256:09833da553ab36d93abfb714223415f68442ca9f6dfbb0593f644fb6ce6f26b2
---

# Threat Model — Quality Contract v1

| ID | Threat | Control | Planned executable test |
|---|---|---|---|
| SEC-001 | Candidate tampers with contract, rule, workflow, approval, or scope before self-attesting. | External event binds repository/base/candidate and all contract/policy digests. | TEST-001 |
| SEC-002 | Ambiguous blocks, duplicate keys, or competing revisions hijack truth. | Exactly one strict block/effective revision; canonical serialization; fail closed. | TEST-002 |
| SEC-003 | Authorization/review is forged, replayed, expired, revoked, or non-independent. | Authenticated typed pre/post event subjects, role/separation/liveness validation, atomic leases. | TEST-003 |
| SEC-004 | Evidence from another candidate or irrelevant suite is replayed/spliced. | Immutable sealed run binds snapshot, AC map, rules, environment, argv, output, and attestation. | TEST-004 |
| SEC-005 | Repository/contract prose becomes shell, network, secret, or production instruction. | Read-only evaluator, allowlisted runner, least privilege; prose is untrusted data. | TEST-005 |
| SEC-006 | Scope claim hides untracked/generated/deleted/renamed/submodule/external effects. | Git accounting covers repository change classes and explicitly is not sandboxing; no-Git is report-only. | TEST-006 |
| SEC-007 | Low-cost executor invents structure or down-classifies risk. | Monotonic trusted risk promotion, exact landmarks, policy-derived fit, independent/human review. | TEST-007 |
| SEC-008 | Adapter downgrades semantics or falsely claims portability. | Versioned result envelope; protocol pin; two-adapter fixtures before cross-provider claim. | TEST-008 |
| SEC-009 | Sensitive runner output becomes durable evidence. | Allowlisted compact fields, redaction, bounded retention; no raw environment/payload persistence. | TEST-009 |
| SEC-010 | Deep/oversized inputs or output exhaust resources. | Parser path/depth/size limits and runner timeout/output/resource limits. | TEST-010 |

Residual risk remains: authenticated humans may misjudge semantics, external effects exceed Git accounting, injection detection can miss attacks, and secure snapshots/redaction rely on the harness.

[← Work-order index](tickets/00-index.md)
