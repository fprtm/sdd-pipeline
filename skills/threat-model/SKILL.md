---
name: threat-model
description: >-
  The security gate — a lightweight, practical threat model that bakes security
  into the design (SSDLC / shift-left) instead of bolting it on. Use when the
  user says "threat model", "security review of the design", "is this secure by
  design", or as phase 5 of spec-driven-development. Works off the DFD from
  to-diagrams; produces SEC-xxx controls linked to requirements.
---

# threat-model — the security gate (SSDLC)

Security here is a **design activity**, not a final audit. You already have a
data-flow diagram with trust boundaries (`to-diagrams`); every flow that crosses
a boundary is an attack surface. Reason about it before code exists, when fixes
are cheap.

Write to `docs/sdd/05-threat-model.md` using `templates/threat-model.template.md`.

## Step 1 — enumerate threats with STRIDE (lightweight)

Walk each element/flow in the DFD and ask the STRIDE questions that apply:

| Letter | Threat | Ask |
|--------|--------|-----|
| **S** | Spoofing | Can someone pretend to be another user/service? |
| **T** | Tampering | Can data in transit or at rest be modified? |
| **R** | Repudiation | Can an actor deny an action? Do we have an audit trail? |
| **I** | Information disclosure | Can secrets/PII leak? |
| **D** | Denial of service | Can it be overwhelmed or exhausted? |
| **E** | Elevation of privilege | Can a low-priv actor gain higher rights? |

Don't brute-force all six on every arrow. Focus on flows crossing trust
boundaries and anything touching credentials, PII, money, or admin power.

## Step 2 — rate and decide a response

For each real threat: **Likelihood × Impact → severity** (Critical/High/Med/Low).
Then choose a response: **Mitigate** (add a control), **Accept** (document why,
with owner sign-off), **Transfer** (e.g. use a managed provider), or **Avoid**
(cut the risky capability). Critical/High must be Mitigated or explicitly, and
accountably, Accepted.

## Step 3 — write controls as SEC-xxx, mapped to a checklist

```
### SEC-004 — Credential stuffing on login (STRIDE: S, D)
Flow: user → API (login creds), TB: public → application
Severity: High (Likelihood: high, Impact: account takeover)
Response: Mitigate
Controls:
  - Rate-limit + exponential backoff per IP and per account
  - Password hashing with a slow KDF (argon2id/bcrypt), never plaintext
  - Support MFA for sensitive accounts
  - Generic error ("invalid credentials") to avoid user enumeration
Protects: REQ-001, FSD-030
Verified by: TEST-041 (security/regression)
```

## Step 4 — cover the baseline (OWASP-ish) regardless of DFD

Always confirm these are addressed or consciously N/A: input validation &
output encoding (injection/XSS), authN & session management, authorization on
every server-side action (never trust the client), secrets management (no
secrets in code/repo/URLs), transport security (TLS everywhere), dependency &
supply-chain hygiene (pin, scan, update), logging/monitoring without logging
secrets, and safe defaults (deny by default, least privilege).

## SSDLC hooks (this gate is not one-and-done)

Record which controls must be **re-verified downstream**:
- `test-plan` must create a TEST-xxx (security/regression class) for each
  High/Critical control.
- `backlog-leveling` must create a ticket for each control that needs code.
- The **verify gate** (phase 9) re-runs this skill to confirm nothing regressed
  and no new flow was added without a threat pass.

## Exit gate

Every sensitive/boundary-crossing flow has been STRIDE-examined; every
High/Critical threat has a control (SEC-xxx) or an accountable acceptance; the
baseline checklist is addressed. Invoke `traceability` to link SEC ↔ REQ/FSD ↔
TEST, then proceed to `backlog-leveling`.
