---
description: Version-pinned external reference mapping for vNext security and readiness profiles.
status: active
lifecycle: canonical
updated: 2026-10-02
---

# WP-08 standards mapping

This mapping is a reference vocabulary, not a certification claim and not a
copy of external policy. Runtime ownership stays in `rules/readiness.mjs` and
local SEC controls.

| Reference | Pinned basis | Local use |
|---|---|---|
| [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | SP 800-218 v1.1 final (February 2022); v1.2 is still a draft as of this review | lifecycle practice IDs such as PW.8 for executable code testing |
| [OWASP ASVS](https://owasp.org/projects/asvs) | v5.0.0; references always include the version prefix because identifiers can change | application technical-control evidence |
| [OWASP SAMM](https://owaspsamm.org/model/) | v2.0, five business functions and fifteen practices | maturity/process cross-reference across verification and operations |

The mappings are supporting evidence only. A mapped High/Critical control is
green only with passing executable evidence for the exact candidate. Active
exceptions remain blocked/non-green. A3 additionally requires candidate-bound
SBOM, provenance, signature, SLO, observability, rollback, restore, and
capacity evidence. Production authorization is deliberately external.
