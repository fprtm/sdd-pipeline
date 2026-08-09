---
name: map-codebase
description: >-
  Understand an EXISTING codebase before changing it — detect the stack, map the
  modules/features and their dependencies, learn the conventions actually in use,
  find the test setup and the risky areas. Use at the start of any work on code
  that already exists (a change, a bugfix, adding to a real project), or when the
  user says "understand this repo / onboard / where is X / how does this work".
  Produces docs/sdd/00-codebase-map.md. This is the brownfield entry point.
---

# map-codebase — learn the ground before you build on it

Most real work is **not** greenfield. Before touching code that already exists,
build an accurate picture of it — otherwise you'll fight the existing
architecture, duplicate what's there, or break something you didn't know about.
This is the brownfield counterpart to `discovery`/`arch-decision`: instead of
*choosing* a stack and structure, you *learn the one that's already there*.

Output: `docs/sdd/00-codebase-map.md`. For a small change you can keep it brief —
but never skip the "read before you write" step.

## What to find (by looking, not guessing)

1. **Stack & tooling** — languages, framework(s), package manager, build, test
   runner, linter/formatter, CI. Read the manifests (`package.json`, `composer.json`,
   `go.mod`, `pyproject.toml`, etc.) and lockfiles for real versions.
2. **Structure & module map** — the top-level layout; the modules/features and
   what each is responsible for. In a modular monolith / clean architecture, map
   the layers and the dependency direction actually enforced. In a feature-sliced
   frontend, list the slices.
3. **Conventions actually in use** — naming, file layout, error handling, how data
   access / validation / auth are done *here*. These are your real standards for
   this repo (they may differ from a framework's defaults). Feed them to
   `stack-conventions` as the **observed** conventions, and match them — do not
   impose a different style on an existing codebase.
4. **The seams** — where the boundaries/ports are, where to safely plug in, and
   the public interfaces you must not break.
5. **Tests** — how they run (the exact command), what's covered, what's a fixture,
   the current coverage if measurable. You'll need this to add characterization
   tests before changing risky code.
6. **Domain language** — the terms the code uses; seed/extend `00-context.md`
   from them so specs speak the codebase's language, not a new one.
7. **Risk areas** — big/old/untested/tangled files, TODO/FIXME/HACK markers,
   things with no tests, anything the user warns is fragile.

## How to do it efficiently
- Prefer search and reading over asking: grep for symbols, read the entry points,
  follow the imports. Use an installed search/explore skill if present.
- Read manifests and config first (fastest signal), then the entry points, then
  the module you're about to touch — depth where it matters, breadth elsewhere.
- Don't boil the ocean: map the whole repo shallowly, and the area you'll change
  deeply. Note what you did *not* look at, honestly.

## Output (`docs/sdd/00-codebase-map.md`)
- **Plain-language summary** — what this system is and how it's shaped, in a
  paragraph.
- Stack & versions · module/feature map (a small diagram via `to-diagrams` helps)
  · observed conventions · test command + coverage · seams/public interfaces ·
  domain terms · risk areas · **what wasn't explored**.

## Then what
Hand off to the change flow, not the greenfield flow:
- `arch-decision` runs in **respect-existing** mode: don't re-pick the stack —
  record the existing architecture as constraints, and only make a decision where
  the change genuinely introduces one (new dependency, new boundary).
- `to-prd`/`to-fsd` frame the work as a **change** to existing behavior.
- `implement` treats existing behavior as something to preserve: add
  **characterization tests** for code you're about to change but that isn't
  covered, so you can prove you didn't break it.

## Exit gate
`00-codebase-map.md` accurately reflects the stack, structure, conventions, test
setup, and the seams/risks around what you'll change; the area you're about to
touch is understood deeply; unexplored areas are named. Proceed to the change flow.
