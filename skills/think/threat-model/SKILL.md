# Threat Model — Security as a Design Activity (SSDLC)

Bake security into the design instead of bolting it on after code exists. Every data flow that crosses a trust boundary is an attack surface — reason about it **before** code, when fixes are cheap. This is the THINK-phase half of security; `skills/prove/security-check/` is the post-code PROVE-phase half, and the two are linked by SEC-xxx IDs.

## When This Runs

| Signal | Behavior |
|--------|----------|
| Task size **large** / new product with external input, auth, or stored user data | Mandatory — full pass below |
| Any size, but the change touches a **security-sensitive zone** (auth/session/tokens, input crossing a trust boundary, crypto, payments/money, PII, deserialization/HTML/SQL construction) | Focused pass on the touched flows only |
| prototype mode | Skip, but note "unthreat-modeled" in output |
| strict mode | Mandatory at medium+ regardless of zone |
| User asks: "threat model", "is this secure by design", "security review of the design" | Run at matching depth |

Write to `docs/sdd/specs/{NNN}-{slug}/threats.md` — inside the same feature folder as its FSD (found by number, per doc-generator's "Number-First Lookup" rule), using `threat-model.template.md` (bundled with this skill). SEC-xxx IDs are item-level and global (counter in `docs/sdd/traceability.md`).

## Step 1 — Enumerate Threats with STRIDE (Lightweight)

Walk each element/flow of the data-flow picture (the FSD/SDS's Mermaid diagram, or sketch a quick DFD if none exists — each arrow crossing a trust boundary is a candidate):

| Letter | Threat | Ask |
|--------|--------|-----|
| **S** | Spoofing | Can someone pretend to be another user/service? |
| **T** | Tampering | Can data in transit or at rest be modified? |
| **R** | Repudiation | Can an actor deny an action? Is there an audit trail? |
| **I** | Information disclosure | Can secrets/PII leak? |
| **D** | Denial of service | Can it be overwhelmed or exhausted? |
| **E** | Elevation of privilege | Can a low-priv actor gain higher rights? |

Don't brute-force all six on every arrow. Focus on flows crossing trust boundaries and anything touching **credentials, PII, money, or admin power**.

## Step 2 — Rate and Decide a Response

For each real threat: **Likelihood × Impact → severity** (Critical/High/Medium/Low). Then choose: **Mitigate** (add a control), **Accept** (document why, with owner sign-off), **Transfer** (e.g. managed provider), or **Avoid** (cut the risky capability). **Critical/High must be Mitigated or explicitly, accountably Accepted** — never silently open.

## Step 3 — Write Controls as SEC-xxx

```
### SEC-004 — Credential stuffing on login (STRIDE: S, D)
Flow: user → API (login creds), TB: public → application
Severity: High (Likelihood: high, Impact: account takeover)
Response: Mitigate
Controls:
  - Rate-limit + exponential backoff per IP and per account
  - Password hashing with a slow KDF (argon2id/bcrypt), never plaintext
  - Generic error ("invalid credentials") to avoid user enumeration
Protects: REQ-001, FSD-003.1
Verified by: TEST-041 (security/regression)
```

## Step 4 — Cover the Baseline (OWASP-ish) Regardless of the DFD

Always confirm addressed or consciously N/A: input validation & output encoding (injection/XSS) · authN & session management · authorization on every server-side action (never trust the client) · secrets management (no secrets in code/repo/URLs) · TLS everywhere · dependency & supply-chain hygiene (pin, scan, update) · logging/monitoring without logging secrets · safe defaults (deny by default, least privilege). This overlaps `prove/security-check`'s checklists deliberately — here it shapes the *design*; there it audits the *code*.

## SSDLC Hooks — Not One-and-Done

- `skills/build/test-plan/` must create a TEST-xxx (security/regression class) for **each High/Critical control**.
- `skills/build/ticket-decomposition/` must create a ticket for each control that needs code (tiered honestly — usually not the cheapest tier).
- `/sdd-pipeline:check` on the affected area re-runs this skill: confirm nothing regressed and no new boundary-crossing flow appeared without a threat pass.
- `skills/prove/security-check/` findings cite the SEC-xxx they verify or violate, when a threat model exists.
- `skills/prove/judgment/`'s security-prior escalation still applies on top — automated pass ≠ human sign-off in these zones.

## Exit Gate

Every sensitive/boundary-crossing flow STRIDE-examined; every High/Critical threat has a control (SEC-xxx) or an accountable acceptance; baseline addressed or consciously N/A. Update `skills/meta/traceability/` (SEC ↔ REQ/FSD ↔ TEST), then proceed.
