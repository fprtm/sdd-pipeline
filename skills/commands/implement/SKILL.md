---
name: implement
description: Execute an existing plan, spec, or ticket with build-time guardrails active — constraint checking, anti-pattern detection, change tracking.
disable-model-invocation: true
---

# /sdd-pipeline:implement

Manual entry point to the BUILD phase. Use when a plan/spec/ticket already exists — from `/sdd-pipeline:spec` (which auto-decomposes large work into tickets, there's no separate decompose command) or just the current conversation — and it's time to write code.

`/sdd-pipeline:discover` alone is **not** enough to jump straight here: discover only produces glossary terms and rule-of-three-gated decisions, no plan/spec/ticket — it hands off to `/sdd-pipeline:spec` next, not to implement directly. If discover just ran and the user says "build it," that means run spec first, not this command.

## What Happens When Called

## Quality Contract adapter (when the ticket opts in)

For a digest-pinned ticket projection, call the canonical facade rather than
re-implementing its policy in this command. Preserve the versioned JSON result
and its exit status; a result is advisory eligibility only and never replaces
the trusted gateway, human authority, or independent review. Tickets without a
Quality Contract projection keep their current BUILD behavior.

**Pre-flight assertions** — before the first edit, restate the ticket's decided values as assertions:

```
Pre-flight:
- cascade: RESTRICT (ERD-001, users.org_id)
- timeout: 30s (FSD-003.2)
- error response: 422 with {code: "DUPLICATE_EMAIL"} (FSD-003.4)
```

These assertions become the verification target — after BUILD, PROVE checks these exact values against the code. If the ticket lacks explicit values (only pointers like "Refs: FSD-003" without stated values), that's a ticket quality failure — flag it and load the referenced spec section before proceeding. Never start coding against implied values.

Then starts coding with all BUILD-phase guardrails active:
- `skills/build/constraints/` — YAGNI, no hardcoded secrets, dependency limits, boundary validation, and the rest of the universal rule set, checked as code is written
- `skills/build/anti-patterns/` — scans for god functions, deep nesting, hallucinated APIs, premature abstraction, and 8 other known patterns; self-corrects
- `skills/build/change-plan/` — tracks actual file changes against what was declared, flags deviations
- `skills/build/execution-guard/` — detects loops/stuck states and escalates
- `skills/build/model-router/` — advisory routing of sub-tasks to appropriate model tiers if multi-model is available

Before assigning actors, inspect harness capabilities. When fresh contexts are
available, the implementer, reviewer, and verifier must have distinct actor
IDs; sensitive work also gets a distinct security reviewer. Reviewers report
defects and re-check after the implementer fixes them—they do not fix work they
will approve. If fresh contexts are unavailable, say `degraded independence`
and list the human-review items; never describe a cold self-review as
independent.

## Output

Working code, plus a change summary at the end: planned files vs. deviations, categorized as requested/incidental/refactoring.

## Workflow Navigation

Before closing, load `skills/meta/workflow-navigation/SKILL.md`. If a changed
work unit is ready for evidence, recommend `/sdd-pipeline:check`; it is an
offer, not an automatic dispatch. Carry any preflight failure, material scope
deviation, unresolved decision, or `degraded independence` into `Outcome` and
route to ticket/spec revision or human review before downstream verification.
Offer `/handoff` only for an explicit transfer or pause.

## Full Behavior

See `skills/orchestrator/SKILL.md` (BUILD phase section) and the individual `skills/build/*/SKILL.md` files for mode-specific behavior.
