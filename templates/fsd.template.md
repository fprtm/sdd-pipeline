# FSD — <feature name>

> **Plain-language summary:** _how the system will behave, in a few sentences._

- **Status:** draft | in review | approved
- **Traces up to:** [PRD](01-prd.md) · **See:** [diagrams](02-diagrams.md) · [traceability](traceability.md)

---

### FSD-001 — <behavior name>
- **Traces to:** REQ-00x
- **Trigger:**
- **Preconditions:**
- **Main flow:**
  1.
  2.
- **Alternate / error flows:**
  - <condition> → <behavior>
- **Business rules:**
  -
- **Data touched:** _(domain terms, not schema)_
- **Diagram:** see 02-diagrams.md#<anchor>
- **Acceptance criteria (Given/When/Then):**
  - Given … when … then …

---

### FSD-002 — <behavior name>
- **Traces to:** REQ-00x
- ...

---

> **Coverage self-check before exit:** every REQ maps to ≥1 FSD here, and every
> FSD above names a REQ. Error/alternate flows are enumerated (not just happy
> paths). Update [traceability.md](traceability.md).
