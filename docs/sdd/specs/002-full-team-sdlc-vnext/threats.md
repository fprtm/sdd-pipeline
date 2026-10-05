[← Back to work order](tickets/00-index.md)

---
description: Threat model for full-team lifecycle authority, benchmark integrity, packs, evidence, and release readiness.
status: draft
lifecycle: canonical
updated: 2026-10-02
source_decisions_digest: sha256:12e2bd6520e3d8bf93b9b1fb5401b1647f5d111f215938342eb00c1d2d698758
---

# Threat Model — Full-Team SDLC vNext

| ID | Threat | Control | Test |
|---|---|---|---|
| SEC-011 | Mode, size, or pack lowers a hard stop/risk/assurance floor. | Monotonic deterministic axis/pack evaluation; exact negative fixtures. | TEST-027, TEST-036 |
| SEC-012 | Actor aliases or AI personas masquerade as independent/qualified authority. | Subject-bound assignments, conflict rules, external attestation at A2/A3. | TEST-028 |
| SEC-013 | Lifecycle/release event is forged, replayed, expired, forked, or rebound. | Existing trusted-event signature/time/revocation/replay primitives and exact predecessor chain. | TEST-029, TEST-034 |
| SEC-014 | Weak idea is pushed to BUILD by process momentum. | Product owner transition supports reject/revise; frozen product oracle cases. | TEST-030 |
| SEC-015 | Self-reported or stale evidence accepts A2/A3 output. | Assurance evidence floors, independent verifier packet, exact-subject rework chain. | TEST-031 |
| SEC-016 | Unsupported QA/security tool is reported green. | Explicit applicable/not-required/skipped/blocked semantics; required unavailable blocks. | TEST-032, TEST-033 |
| SEC-017 | Release readiness or repository prose manufactures production authority. | External exact candidate/environment/window authority; runtime never issues it. | TEST-033, TEST-034 |
| SEC-018 | Raw incident/benchmark data leaks secrets, PII, or proprietary source. | Local authorized manifests, pre-hash scrubbing, bounded redacted envelopes/pointers. | TEST-034, TEST-035 |
| SEC-019 | Benchmark is gamed through rubric edits, contamination, selective retries, thin segments, or aggregate masking. | Frozen digest, lineage separation, retain all attempts, per-segment gates, invalid/missing accounting. | TEST-035 |
| SEC-020 | Malicious domain/org pack weakens policy or escapes paths. | Strict local schema, normalized allowlist, monotonic merge, no executable pack content. | TEST-036 |
| SEC-021 | Provider capability claim upgrades degraded evidence or corrupt install passes CI. | Capability negotiation, explicit migration marker, required-tool fail-closed, portability fixtures. | TEST-037 |
| SEC-022 | Permanent gates create unmeasured bureaucracy and suppress useful delivery. | Gate-effectiveness metadata, cost/outcome review, evidence-based removal/supersession. | TEST-038 |

Residual risks: external human authorities and graders can still misjudge;
provider sandboxes and identity systems are outside repository control; synthetic
benchmarks may not represent production; A3 cost has no automatic cap; and an
unmediated host can bypass advisory policy. Documentation and results must not
upgrade these residuals into guarantees.

[← Work-order index](tickets/00-index.md)
