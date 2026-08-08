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

Tidy placement (canonical — don't scatter):
- **User docs →** `docs/user/<feature>.md`
- **Developer docs →** `docs/dev/` (`README.md`, `api.md`, `architecture.md`)
- **Inline code docs →** in the source, next to what they describe

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
  reasoning isn't clear from the code.
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
- **Keep it current** — update docs in the same change as the code; stale docs are
  a bug. `code-review` should flag public API changes with no doc update.
- **Right depth** — enough to use/extend, no filler. Match the stack's doc idiom.

## Mode-aware
- **Autopilot** writes the docs and lists them for the user.
- **Copilot** drafts and pauses for the developer to review tone/accuracy.

## Exit
`docs/user/<feature>.md` exists (a non-technical user can follow it), developer
docs exist (public interfaces documented inline; API + architecture + run/test in
`docs/dev/`), everything derives from and links to the specs, and nothing
duplicates a fact that lives elsewhere.
