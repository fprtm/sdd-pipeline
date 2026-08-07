# Test Plan — <feature / release>

> **Plain-language summary:** _how we'll prove it works, in a few sentences._

- **Coverage gate:** line + branch **≥ 80%** _(edit if agreed otherwise)_
- **Coverage command:** `<e.g. vitest run --coverage / pytest --cov --cov-branch>`
- **Traces up to:** [FSD](03-fsd.md) · [threat model](05-threat-model.md) · [traceability](traceability.md)

## Pyramid target
- Unit: many (fast, at pure logic) · Integration: at arch seams · E2E: few, high-value (Must journeys)

## Test cases
### TEST-001 — <title>  [class: happy | regression | edge | e2e | non-functional]
- **Proves:** FSD-0xx · **Ticket:** TICKET-0xx · **Level:** unit | integration | e2e
- **Given:**
- **When:**
- **Then:**
- **Data/fixtures:**

### TEST-002 — ...

## Required coverage (must exist, regardless of %)
- [ ] Happy-path test for every Must FSD main flow
- [ ] Edge/negative test for every FSD alternate/error flow
- [ ] E2E test for every Must-priority user journey (mirrors a sequence diagram)
- [ ] Security/regression test for every High/Critical SEC control
- [ ] Performance test asserting each REQ-NF target

---

> **Exit self-check:** classes above are covered; coverage command + threshold
> recorded; no Must FSD without a test. Update [traceability.md](traceability.md).
