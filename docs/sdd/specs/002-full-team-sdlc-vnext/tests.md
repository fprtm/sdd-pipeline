[← Back to work order](tickets/00-index.md)

---
description: Executable verification plan for SDD Pipeline vNext lifecycle and evaluation program.
status: draft
lifecycle: canonical
updated: 2026-10-02
source_decisions_digest: sha256:12e2bd6520e3d8bf93b9b1fb5401b1647f5d111f215938342eb00c1d2d698758
---

# Test Plan — Full-Team SDLC vNext

All runtime tests are local Node.js fixtures in disposable directories. Existing
Quality Contract aggregate line+branch gates stay ≥80%; every new security/error
flow below is mandatory regardless of aggregate coverage. No test targets a
shared/staging/production environment.

| ID | Class | Requirements / controls | Proof |
|---|---|---|---|
| TEST-027 | unit + negative | REQ-013, SEC-011 | micro-critical and large-low-risk fixtures keep axes independent; prototype/emergency cannot lower assurance/hard stops. |
| TEST-028 | security | REQ-014, SEC-012 | same actor, aliases, expired/wrong-subject assignments, missing A2/A3 roles block; permitted small-team A1 is explicitly degraded. |
| TEST-029 | security + state | REQ-015, SEC-013 | every allowed transition passes; invalid, stale, replayed, expired, forked, unauthorized transitions preserve prior state. |
| TEST-030 | product behavior | REQ-016, SEC-014 | frozen reject and revise cases do not reach BUILD; valid proceed case does. |
| TEST-031 | integration | REQ-017, SEC-015 | low-risk compatibility works; all six engineering dimensions are explicit; missing/failed/below-floor/unbound/self-reported/self-verified A2/A3 evidence and open-defect rework cannot accept. |
| TEST-032 | QA/adversarial | REQ-018, SEC-016 | seeded faulty implementations survive baseline but selected techniques fail them; unsupported required tool is blocked/skipped, never pass. |
| TEST-033 | security + operations | REQ-019, SEC-016, SEC-017 | missing High/Critical executable control, exception expiry, SBOM/provenance, rollback/restore/SLO/capacity evidence blocks readiness. |
| TEST-034 | release + privacy | REQ-020, SEC-013, SEC-017, SEC-018 | candidate/environment authorization cannot replay; incident becomes redacted regression pointer without raw secret data. |
| TEST-035 | benchmark integrity | REQ-021, REQ-025, SEC-018, SEC-019 | protocol/corpus digest, lineage, all-attempt accounting, missing/thin segments, P1/P2, cost regressions, and aggregate masking gate exactly. |
| TEST-036 | pack security | REQ-022, SEC-011, SEC-020 | both reference packs load; organization tightening succeeds; weakening/conflict/path/unknown content fails actionably. |
| TEST-037 | compatibility | REQ-023, REQ-NF-008, SEC-021 | optional missing degrades, required missing blocks after opt-in, legacy stays report-only, install/update/downgrade/handoff fixtures preserve semantics. |
| TEST-038 | documentation + governance | REQ-024, REQ-026, SEC-022 | claim taxonomy/SSOT links validate; every gate has effectiveness fields and removable ineffective fixture. |
| TEST-039 | end-to-end pilot | REQ-013..026, REQ-NF-006..011 | complete synthetic lifecycle and six frozen segments run twice reproducibly; critical failure blocks promotion; benchmark success cannot self-authorize promotion and a complete packet still requires external human-authority attestation. |

## Acceptance evidence

- Structural validator, four classic checkers, installer/command suites, Quality
  Contract harness, file hygiene, traceability, syntax, and whitespace pass.
- New machine codes are registry-tested; all new engine modules are imported by
  coverage harness.
- Deterministic benchmark reruns have byte-identical normalized results given
  the same frozen inputs; time/environment identifiers remain explicit fields.
- Human/independent evidence that the current harness cannot produce remains
  degraded or blocked and is listed for real human review; fixtures do not fake it.

[← Work-order index](tickets/00-index.md)
