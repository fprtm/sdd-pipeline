---
name: documentation
description: >-
  Write clean documentation for BOTH audiences — a user-facing feature guide
  (what it does, how to use it, the flows) and developer docs (inline JSDoc/
  docstrings per the stack, an API reference, and a dev README/architecture
  overview). Use at the ship phase, or when the user says "write docs / README /
  document this / JSDoc / user guide". Derives from the specs (SSOT), never
  duplicates them.
---

# documentation — for users and for developers

Two audiences, two very different documents, both kept honest and in sync with
the specs. Docs that drift from reality are worse than none, so **derive** from
the SSOT (PRD/FSD/diagrams/contract) and link back to it rather than restating it.

## Check first — then update or create (don't skip because none exists)

Before finishing any change, **look for existing docs for the area you touched**
— `docs/user/<feature>.md`, the relevant `docs/dev/` pages, and the JSDoc on the
interfaces you changed. Then:

- **Exists + behavior changed →** update it (and its examples) in the *same*
  change, not later.
- **Doesn't exist →** create it — both the user guide and the developer docs.
  A missing doc is a task to do, not a reason to skip. This is part of the
  ticket's Definition of Done.

Never leave a public interface changed with stale or absent docs.

Tidy placement (canonical — don't scatter):
- **User docs →** `docs/user/<feature>.md`
- **Developer docs →** `docs/dev/` (`README.md`, `api.md`, `architecture.md`)
- **Inline code docs →** in the source, next to what they describe

### Co-locate with the code, and adapt to the topology
Docs read best *at scale* when they sit next to what they describe, with one
top-level index (`docs/dev/README.md`) tying them together — a co-located
`README.md` per module in a modular monolith, per feature slice in a
feature-sliced frontend, and so on. Full per-topology rules: the orchestrator's
`reference.md` ("Placement per topology") — this skill follows the shape
`arch-decision` already chose, it doesn't redecide it.

## User documentation (`docs/user/<feature>.md`)

For the person who *uses* the feature — plain language, no internals. Reuse the
plain-language summaries already at the top of each SDD doc.

- **What it is & why** — one short paragraph (outcomes, not tech).
- **How to use it** — step by step, per the main user journeys. Embed or link the
  **sequence diagrams** from `02-diagrams.md` to show the flow.
- **Key behaviors & limits** — what happens on the edges (empty, errors), and
  what's out of scope (the "Won't" items), so expectations are set.
- **FAQ / troubleshooting** — the common "why did X happen?" answers.
- Screenshots/GIFs if there's a UI (or a demo script from `stakeholder-brief`).

## Developer documentation

For whoever *extends or maintains* it — including a cheaper model or a new dev.

- **Inline (JSDoc / docstrings / PHPDoc — per `stack-conventions`):** document
  every **public** interface (the deep module's surface): what it does, params,
  returns, errors thrown, and the *why* for anything non-obvious. Don't document
  the obvious or restate the code. Private internals get a comment only when the
  reasoning isn't clear from the code. **Keep it simple, and always write it in
  English** — code-level artifacts (identifiers, JSDoc, comments) are English
  even when the spec and user docs are in the user's language. A one-line JSDoc
  that states purpose + params + returns beats a paragraph.
- **`docs/dev/api.md`** — the API/contract reference: endpoints, request/response
  shapes (from the `contract` package — generate from it where possible so it
  can't drift), status codes, auth, and which SEC controls apply.
- **`docs/dev/architecture.md`** — a short overview: the module map, the
  dependency rule, where the seams are, and **links to the ADRs** (don't copy
  them — the ADRs in `04-architecture.md` stay the SSOT).
- **`docs/dev/README.md`** (or the repo root README) — how to run, test (the
  coverage command), and extend the project; the folder layout; how to add a
  feature through this pipeline.

## Principles

- **SSOT / DRY** — reference the specs and generate from types/contract; never
  maintain the same fact in code, spec, and docs three times. Prefer docs that are
  generated or derived over hand-copied prose.
- **Document the interface, not the implementation** (deep modules): the public
  surface and the *why*, so callers don't need to read internals.
- **Keep it current — doc-as-you-go, not once at the end.** `implement` and
  `code-review` enforce this per ticket (detail: orchestrator's `reference.md`).
  This skill at ship is the final polish + index, not the first write.
- **Right depth** — enough to use/extend, no filler. Match the stack's doc idiom.

## Mode-aware
- **Autopilot** writes the docs and lists them for the user.
- **Copilot** drafts and pauses for the developer to review tone/accuracy.

## Exit
`docs/user/<feature>.md` exists (a non-technical user can follow it), developer
docs exist (public interfaces documented inline; API + architecture + run/test in
`docs/dev/`), everything derives from and links to the specs, and nothing
duplicates a fact that lives elsewhere. Run `check-file-hygiene.mjs` (bundled
with `spec-driven-development`) — it verifies `docs/user/` and `docs/dev/`
actually exist in their canonical location whenever there's a UI/a real build,
and flags a stray doc file sitting loose in `docs/` instead of one of those
homes. A gate board that says "user/developer guide written" isn't enough —
the checker confirms it landed in the right place.
