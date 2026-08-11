# Implementation Backlog — <feature / release>

> **Plain-language summary:** _the work, broken into bite-size tickets anyone can
> pick up._

- **Traces up to:** [FSD](03-fsd.md) · [architecture](04-architecture.md) · [threat model](05-threat-model.md)
- **Tier split:** T1 (junior/cheap-model): _n_ · T2 (standard): _n_ · T3 (senior/strong-model): _n_

## Execution order & parallelism
- **Wave 1 (parallel-safe):** TICKET-00x, TICKET-00y
- **Wave 2 (depends on Wave 1):** TICKET-00z
- ...

---

### TICKET-001 — <title>
- **Traces to:** FSD-0xx  · **Constrained by:** ADR-0xx
- **Tier:** T1 | T2 | T3
- **Plain-language goal:** _(one sentence, no jargon)_
- **Context an executor needs:** _(data shapes, where it lives in the arch, existing patterns to follow)_
- **Steps (high level):**
  1.
- **Acceptance criteria (Given/When/Then):**
  - Given … when … then …
- **Definition of done:** code + test(s) green, coverage not reduced, lint/type-check pass, no secret added, PR references this ticket
- **Dependencies:** _(ticket IDs that must land first)_
- **Files likely touched:**

### TICKET-002 — ...

---

> **Exit self-check:** every FSD and every code-bearing SEC has ≥1 ticket; each
> ticket is tiered and passes the self-containment test (finishable from the
> ticket alone). Update [traceability.md](traceability.md).
