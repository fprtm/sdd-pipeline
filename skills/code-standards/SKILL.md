---
name: code-standards
description: >-
  The code-quality bar every line in this pipeline must clear — SSOT, DRY, YAGNI,
  deep modules, types-as-source-of-truth, ubiquitous naming. Use when writing or
  reviewing code, when the user asks for "clean/maintainable code", "SSOT/DRY/
  YAGNI", or when `implement` / `code-review` need the shared definition of good.
  Read it before writing code, not after.
---

# code-standards — the definition of good code here

Code in this pipeline is judged against these principles. They are not style
preferences; they are how the code stays cheap to change and safe for a junior dev
or a cheaper model to extend. `implement` writes to this bar; `code-review`
checks against it.

## SSOT — Single Source of Truth
Every fact lives in exactly one authoritative place; everything else *derives*
from it.

- **Types/schema are the SSOT for shape.** Define a value's schema once (e.g. the
  `contract` package) and **infer** types from it — never hand-maintain a type and
  a validator that can drift.
- **Domain terms** come from `00-context.md` (the ubiquitous language). One term,
  one meaning, used everywhere.
- **Constants over magic values.** A limit, URL, or key is declared once and
  imported (e.g. `MAX_ITEMS`), never re-typed.
- **The traceability matrix** is the SSOT for what's built vs. proven — don't
  track status in scattered places.
- If you find the same fact asserted in two places, one of them is a future bug.
  Collapse it.

## DRY — but knowledge, not keystrokes
Remove duplication of **knowledge** (a rule, a calculation, a shape). Do **not**
abstract code that merely looks similar but represents different decisions.

- Two pieces of code that must change together for the same reason → unify them.
- Two pieces that happen to look alike but change for different reasons → leave
  them; a wrong abstraction is costlier than duplication.
- **Rule of three:** wait for the third real occurrence before extracting an
  abstraction. Premature abstraction is a YAGNI violation wearing a DRY costume.

## YAGNI — build only what a requirement needs now
- Implement what the current REQ/FSD/ticket calls for — no speculative
  parameters, config, hooks, or "we might need it later" generality.
- No dead code, no commented-out blocks, no unused exports. Delete on sight.
- Fewer options is a feature: a function with one clear job beats one with five
  flags (avoid boolean-trap parameters).

## Deep modules
A good module has a **simple interface hiding real complexity** (Ousterhout). The
best modules give a lot of functionality behind a small, obvious surface.

- Push complexity **down** into the module, not out onto every caller.
- Keep interfaces narrow and information-hiding: callers shouldn't need to know
  internals to use it correctly.
- Business rules live in the domain/app layer behind ports (see the architecture's
  dependency rule) — not smeared across controllers or UI components.
- If a deep-module design skill (`codebase-design`) is installed, use it for the
  key interfaces.

## Clarity & correctness
- **Names carry intent** and match the ubiquitous language. Rename until the code
  reads like the domain.
- **Explicit over clever.** Prefer obvious code a tired reader (or a small model)
  understands over a terse trick.
- **Make illegal states unrepresentable** with types; fail closed; return typed
  errors, not silent nulls.
- **Pure core, effects at the edges** — keep IO/side-effects in adapters so the
  core is testable with fakes.
- **Composition over inheritance.** Small, honest functions.
- **Comments explain _why_**, never restate _what_. Match the surrounding code's
  density and idiom.

## The check before "done"
Ask, for the diff: is every fact stated once (SSOT)? is any knowledge duplicated
(DRY)? did I build anything no requirement asked for (YAGNI)? is each module's
interface simpler than its guts (deep)? do the names match the glossary? If any
answer is wrong, fix it before moving on — this is exactly what `code-review`
verifies.
