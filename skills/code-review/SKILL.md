---
name: code-review
description: >-
  Review changed code along two axes — Standards (does it clear the code-quality
  bar and repo conventions?) and Spec (does it do what the FSD/ticket asked?). Use
  at the verify gate of spec-driven-development, or when the user says "review this
  / review the branch / review my changes". Self-sufficient; defers to an installed
  code-review skill (e.g. mattpocock's) if present.
---

# code-review — two axes, evidence-based

Review the change, not the whole repo. Two independent questions, reported
separately so neither hides the other:

1. **Standards** — is the code good?
2. **Spec** — does it do what was asked?

> **Defer if a better tool exists.** If a dedicated code-review skill is installed
> (e.g. mattpocock/skills `code-review`), run it and use this as the checklist.
> Otherwise, do the review yourself as below.

## Scope the diff
Review the changes since the branch point (or the ticket's diff). State what you
reviewed. Read the whole changed files, not just the hunks — context matters.

## Axis 1 — Standards (via `code-standards`)
Check the change against the code-quality bar. Concretely flag:

- **SSOT** — any fact duplicated? a type hand-maintained beside its schema? a
  magic value that should be a named constant? a term that drifts from `00-context.md`?
- **DRY** — knowledge duplicated (must-change-together code in two places)? OR the
  opposite: a premature/wrong abstraction forcing unrelated things together?
- **YAGNI** — speculative generality, unused flags/exports, dead or commented-out
  code, config nobody needs yet?
- **Deep modules** — leaky interface, complexity pushed onto callers, business
  logic in controllers/components instead of the domain layer?
- **Dependency rule** — imports that violate the architecture's direction?
- **Clarity/correctness** — unclear names, boolean traps, silent nulls, illegal
  states representable, effects tangled into the core, comments that restate code?
- **Stack conventions** — does it follow `docs/sdd/04-stack-guide.md` (the
  chosen stack's official best practices, e.g. TS strict/no-`any`, Laravel Form
  Requests + mass-assignment guarding, framework idioms)? Flag non-idiomatic code.
- **Repo conventions** — does it match the surrounding code's idioms, structure,
  lint/type rules?
- **Docs currency (blocking)** — if the change alters a **public interface** or
  **user-visible behavior**, are the matching docs updated in the *same* change?
  Inline JSDoc/docstrings for changed public surfaces, the co-located module/
  feature README, and the user doc if behavior changed. A public API or behavior
  change with stale/missing docs is **changes-required**, not a nit.
- **Security** — does it honor the SEC controls the ticket touches (authz on every
  action, validated input, output encoding, no secrets, parameterized queries)?

## Axis 2 — Spec (via the traceability trail)
Does the code actually satisfy what was specified?

- Every acceptance criterion in the ticket / FSD is met by the code.
- The **tests** exist and prove those criteria (happy + the FSD's error flows);
  no skipped/`.only`/always-true tests.
- Nothing was silently added beyond the spec (that's a scope leak — flag it), and
  nothing required was skipped.
- The traceability row can honestly move toward green.

## Report
Group findings by axis. For each: **file:line**, what's wrong, why it matters, and
a concrete fix. Rank by severity (correctness/security > maintainability > nits).
Cite evidence (the line, the FSD id) — no vague "could be cleaner". End with a
clear verdict: **approve**, **approve-with-nits**, or **changes-required** (list
the blocking items).

## After review
Blocking items become fixes (or new tickets if out of scope for this change).
Re-review after fixes. This axis-pair is one of the three verify-gate conditions
(with `coverage-check` and a `threat-model` re-check).
