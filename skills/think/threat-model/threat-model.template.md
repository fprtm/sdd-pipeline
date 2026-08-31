# Threat Model — <feature/system name>

**Date**: [auto]
**Updated**: [auto]
**Version**: v1
**Status**: DRAFT | REVIEWED | ACCEPTED

> **Plain-language summary:** _what could go wrong security-wise and what we're
> doing about it, in a few sentences._

- **Based on:** FSD-NNN / SDS-NNN diagram (trust boundaries: <list>)
- **Scope:** <what's in / out>
- **Related:** fsd.md · tests.md (siblings in this same specs/NNN-slug/ folder) · traceability.md

## Trust boundaries
| Boundary | From zone | To zone | What crosses it |
|----------|-----------|---------|-----------------|
| TB-1 | public internet | application | login creds (secret) |

## Threats & controls
### SEC-001 — <threat title>  (STRIDE: S/T/R/I/D/E)
- **Flow / element:** _(which arrow or node in the diagram)_
- **Severity:** Critical/High/Med/Low  (Likelihood × Impact: … )
- **Response:** Mitigate | Accept | Transfer | Avoid
- **Controls:**
  -
- **Protects:** REQ-00x, FSD-0xx
- **Verified by:** TEST-0xx  _(security/regression class)_
- **Owner (if Accepted):**

### SEC-002 — ...

## Baseline checklist (address or mark N/A)
- [ ] Input validation & output encoding (injection/XSS)
- [ ] AuthN & session management
- [ ] AuthZ enforced server-side on every action (never trust client)
- [ ] Secrets management (nothing in code/repo/URL/logs)
- [ ] Transport security (TLS everywhere)
- [ ] Dependency & supply-chain hygiene (pin, scan, update)
- [ ] Logging/monitoring without logging secrets/PII
- [ ] Safe defaults (deny by default, least privilege)

## SSDLC downstream hooks
- [ ] Each High/Critical control has a TICKET (if it needs code)
- [ ] Each High/Critical control has a TEST-xxx
- [ ] /sdd-pipeline:check re-runs this model when the affected flows change
