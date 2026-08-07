---
name: to-prd
description: >-
  Turn a rough idea into a Product Requirements Document (PRD) — the "what" and
  "why" in product language, readable by non-developers. Use when starting a new
  product/feature, when the user says "write a PRD / product spec / requirements",
  or as phase 1 of spec-driven-development. Produces REQ-xxx requirements with
  users, rationale, and acceptance criteria.
---

# to-prd — Product Requirements Document

A PRD answers **what** we are building and **why**, never **how**. If you catch
yourself naming a database, framework, or class, stop — that belongs in the FSD
or the architecture decision.

## Before you write

Do not invent requirements. Interview until you can answer, for the feature as a
whole:

1. **Problem** — what pain, for whom, right now? What happens if we do nothing?
2. **Users / personas** — who acts, who is affected, who approves?
3. **Success** — how do we know it worked? A metric, not a vibe.
4. **Scope** — what is explicitly *out* of scope for this iteration?
5. **Constraints** — deadlines, budget, compliance, existing systems.

If you can't answer these, use a grilling/discovery skill (`grill-me`,
`brainstorming`) first, or ask directly. Guessing here poisons every later phase.

## Structure (write to `docs/sdd/01-prd.md`)

Use the template in `templates/prd.template.md`. It has two layers:

- **Plain-language summary** at the very top: 3–6 sentences. A PM or client can
  read only this and understand the release.
- **Requirements table**, each row an atomic, testable requirement:

  | ID | Requirement | User/persona | Why (value) | Priority | Acceptance criteria |
  |----|-------------|--------------|-------------|----------|---------------------|
  | REQ-001 | As a shopper I can save items to a wishlist | Shopper | Increases return visits | Must | Given I'm logged in, when I tap Save on a product, then it appears in my wishlist and persists across sessions |

## Rules for good REQs

- **Atomic**: one need per REQ. If it has "and", consider splitting.
- **Testable**: acceptance criteria written Given/When/Then so `test-plan` can
  turn each into a TEST-xxx directly.
- **Prioritized**: MoSCoW (Must / Should / Could / Won't-this-time). "Won't"
  requirements are recorded, not deleted — scope discipline is a feature.
- **Neutral on solution**: describe the outcome, not the mechanism.
- **Numbered stably**: once REQ-007 is assigned, it keeps that number forever,
  even if deprecated (mark it `~~REQ-007~~ (dropped)`), so traceability holds.

## Non-functional requirements

Capture these explicitly in their own section — they drive the architecture and
threat model later: performance targets, expected scale, availability, security
& privacy obligations (PII? payments? regulated data?), accessibility, i18n.
Give them IDs too (`REQ-NF-001`).

## Exit gate

Every REQ has a user, a why, a priority, and Given/When/Then acceptance
criteria. Then invoke `traceability` to register the REQ IDs, and hand off to
`to-diagrams` and `to-fsd`.
