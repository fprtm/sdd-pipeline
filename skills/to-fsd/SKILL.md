---
name: to-fsd
description: >-
  Turn a PRD into a Functional Specification Document (FSD) — the "how it
  behaves" in precise, testable functional detail, still above code. Use when
  the user has requirements and needs a functional spec, says "write the FSD /
  functional spec", or as phase 3 of spec-driven-development. Every FSD-xxx
  traces to a REQ-xxx.
---

# to-fsd — Functional Specification

The PRD said *what* and *why*. The FSD says *exactly how the system behaves* so
that a developer (or a cheap model) can implement without re-guessing product
intent — but it still stops short of naming the internal code design (that's
architecture + implementation).

Write to `docs/sdd/03-fsd.md` using `fsd.template.md` (bundled with this skill).

## The core move: decompose each REQ into behaviors

For every REQ, produce one or more FSD entries. An FSD entry specifies a concrete
behavior with all its rules:

```
### FSD-012 — Add item to wishlist
Traces to: REQ-001
Trigger: authenticated user taps "Save" on a product
Preconditions: user is logged in; product exists and is purchasable
Main flow:
  1. System records (user, product, timestamp)
  2. Item appears in the user's wishlist, most-recent first
  3. Save control switches to "Saved"
Alternate / error flows:
  - Not logged in → prompt to sign in, preserve intent, resume after login
  - Product already saved → no-op, control already shows "Saved"
  - Store unavailable → show retry, do not lose the user's action
Business rules:
  - A user may save the same product at most once
  - Wishlist has no hard cap in v1 (see REQ-NF-003 for scale)
Data touched: wishlist_items (user_id, product_id, created_at)
Acceptance criteria (Given/When/Then): ... (feeds TEST-xxx)
```

## Concrete enough that a cheap model won't hallucinate

This is the bar that makes the pipeline's promise ("a junior or a cheap model
can execute this") real. Abstract prose ("Admin manages destinations with name,
category, geo") is where a weak model invents field names, shapes, and rules.
For each behavior, be concrete:

- **Name the exact data** each behavior reads/writes — the fields and their
  types in domain terms (`name: string(≤120)`, `geo: {lat, lng} | null`), not a
  vague list. Once phase 4 exists, these tie to `04-schema.md` fields by name.
- **Name the interaction shape** — for an API behavior, the endpoint + method,
  the request fields, the response, and the error responses (status + meaning).
  This is the per-endpoint contract that `arch-decision` Step 3b formalizes;
  sketch it here so nothing is left to guess.
- **Give one worked happy-path example** with realistic values, so the executor
  has a concrete target, not only an abstract flow.

If, reading an FSD entry, a cheap model would have to *invent* a field name, a
shape, or a rule — it's not concrete enough yet. Add the detail.

## Rules

- **Every FSD traces to at least one REQ.** No orphan FSDs (behavior nobody
  asked for) and no orphan REQs (requirement nobody specified). `traceability`
  will flag both — fix them here.
- **Cover the unhappy paths.** Most defects live in alternate/error flows.
  Enumerate them; each becomes a regression/edge test later.
- **Reference the diagrams.** Point each FSD at the sequence diagram that shows
  it (`see 02-diagrams.md#seq-add-wishlist`).
- **Use the glossary.** Terms must match `docs/sdd/00-context.md`. If a needed
  term is missing, add it (or invoke `domain-modeling` if present).

## Non-functional → functional

Turn each REQ-NF into concrete, checkable behavior: "REQ-NF-002 (p95 < 200ms)"
becomes an FSD acceptance criterion and a performance test in the test plan, not
a vague aspiration.

## Exit gate

Coverage is bidirectional: every REQ → ≥1 FSD, every FSD → a REQ, every
Must-path has its error flows enumerated. Invoke `traceability`, then proceed to
the **architecture gate** (`arch-decision`).
