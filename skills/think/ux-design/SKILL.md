# UX Design — The Interface, Designed Before It's Built

A product with screens has a UI whether or not anyone designed it — the only question is whether it was decided deliberately or fell out of ad-hoc component choices. This is the design-phase peer of `skills/think/arch-analyzer/` for the interface: the FE gets built to a system, not improvised. Runs whenever there IS a UI (medium+ with screens; skip only for API-only/CLI), or on "design the UI / design system / palette / wireframe / UX".

Output: **`docs/sdd/design-system/design.md`** (the one entry doc for the UI — always) + `docs/sdd/design/{NNN}-{slug}-ux.md` (per-feature UX spec) + `docs/sdd/ux-screens/<flow-slug>.md` (one file per flow).

## `design.md` — One Entry Doc, Always, However Many Files It Splits Into

**Whenever this skill runs, `docs/sdd/design-system/design.md` exists.** This is the file someone means when they say "where's the design doc" — the project-level SSOT for how the product looks and behaves: direction, tokens, screen inventory, component patterns.

Splitting the content across many files is correct and expected (tokens change on their own cadence, each flow is its own file, per-feature UX specs are numbered like their FSD siblings). What's *not* acceptable is that the split leaves no front door — a reader landing on a folder of a dozen fragments has to reconstruct the design system by reading all of them. `design.md` is that front door: it holds the parts that are genuinely project-wide, and links to every fragment for the rest.

```markdown
# Design — [Product Name]

**Date**: [auto]
**Updated**: [auto — bumped whenever direction, tokens, or the inventory changes]
**Version**: v1
**Status**: DRAFT | APPROVED | IMPLEMENTED

## Direction
[The confirmed §0 answer: existing system followed, or chosen direction + why. Light/dark. Hard brand constraints.]

## Principles
[North star tied to brand and audience — the tiebreaker for later trade-offs.]

## Tokens (SSOT)
[Color palette with light AND dark values (each AA-checked), type scale, spacing/radii/elevation.
If an external UI/UX skill owns these, that file is the SSOT and this section cites it — never a second copy that drifts.]

## Screens & Flows
| Flow | Priority | Where |
|------|----------|-------|
| [flow name] | Must | [`ux-screens/<flow-slug>.md`](../ux-screens/<flow-slug>.md) |

## Component Patterns
[Reusable patterns → the components they map to.]

## Accessibility & Responsive
[Contrast, touch targets, focus order, keyboard operability, breakpoint reflow — the project-wide rules.]

## Per-Feature UX Specs
- [FSD-adjacent UX docs: `design/{NNN}-{slug}-ux.md`, one row each]
```

**Relationship to `-ux.md`**: `design.md` is **project-level and singular** (the design system, updated in place forever); `design/{NNN}-{slug}-ux.md` is **per-feature and numbered** (this feature's screens, frozen with its FSD). One product has exactly one `design.md` and as many `-ux.md` files as it has UI features. When only one small feature has a UI, `design.md` is still written — short is fine, absent is not.

`check-file-hygiene.mjs` enforces this: a `design-system/` directory with no `design.md` is a flagged problem.

## Document Shape

`-ux.md` is a numbered design doc that sits in `docs/sdd/design/` next to its FSD/SDS/threats siblings — same metadata header as those (see `skills/build/doc-generator/formats.md`), so a reader scanning the folder can tell at a glance how current each one is instead of the UX doc looking like the odd one out.

```markdown
# UX: [Feature Name]

**Date**: [auto]
**Updated**: [auto]
**Version**: v1
**Status**: DRAFT | APPROVED | IMPLEMENTED

## 0. Direction
[§0 answers: existing design to follow, or chosen direction + why, light/dark, wireframe depth]

## 1. Principles & Direction
[North star tied to brand and audience]

## 2. Design Tokens
[Color palette (AA-checked), typography scale, spacing & layout — the SSOT]

## 3. Key Screens & Flows
[Thin index: one row per flow — priority · description · link to docs/sdd/ux-screens/<flow-slug>.md]

## 4. Component Patterns
[Reusable patterns and the components they map to]

## 5. States for Every Screen
[Confirmation that empty/loading/error/success are defined per screen, or exceptions noted]

## 6. Accessibility & Responsive
[Contrast, touch targets, focus order, keyboard operability, breakpoint reflow]
```

**This skill owns process, not taste** (the orchestrator's composition rule stands: external skills win on aesthetics). If a specialized UI/UX design skill is installed, **prefer it** and hold it to this skill's checklist — confirm direction first, tokens as SSOT, states for every screen, a11y. Its output must still land inside the canonical tree (redirect its output dir to `docs/sdd/design-system/` — never scattered at the repo root), and both `design.md` and the `-ux.md` doc cite it as SSOT so the copies never diverge. **An external skill owning the tokens does not excuse the missing front door**: `design.md` is still written, citing that skill's files rather than duplicating them. If none is installed, do everything below yourself — fully self-sufficient.

## 0. Confirm Direction First — With a Concrete Preview, Not a Label

Design direction is a consequential decision the user didn't necessarily specify — don't silently invent a style. Before writing anything, ask — per `skills/think/elicitation/`'s "How to Ask" rule: native question tool first, plain text only as fallback:

1. **Is there already a design to follow?** Brand guide, Figma, screenshots of a reference app, or a design system in the codebase. If yes — **respect-existing** (the same brownfield principle arch-analyzer uses): extract and document the *actual* tokens/patterns, don't invent new ones; only fill genuine gaps.
2. **What direction, if starting fresh?** Present 2–3 candidates **with a concrete preview each** — a sample screen sketch or actual palette/type swatch, not just a label ("minimal vs expressive" with nothing to look at is picking blind). Recommend one. Ask light/dark preference and hard brand constraints.
3. **How much wireframe detail?** Structure-only (screens, hierarchy, primary action) vs fully detailed (every component, states, interactions, the *why* per screen). Default structure-only for small/medium; fully detailed on request or for large/full.

Record the answers at the top of the `-ux.md` doc. **Then check in again after each flow** — direction confirmed once doesn't mean the rest gets designed unsupervised in one silent batch (standard/strict check in per flow; vibe may batch).

## 1. Principles & Direction

A short north star tied to brand and audience ("trustworthy, fast, mobile-first, works in bright sunlight for gate staff"), **derived from §0** — principles resolve later trade-offs so choices aren't arbitrary.

## 2. Design Tokens — The SSOT for Look

Define once, reference everywhere (the same SSOT rule the constraint set applies to code):

- **Color palette** — semantic, not raw: `primary`, `neutral` ramp, `success`/`warning`/`danger`, surface/background/text — each with light AND dark values. **Every color clears WCAG AA contrast** against its background.
- **Typography scale** — family, a small ramp (display→body→caption), weights, line-heights.
- **Spacing & layout** — a 4/8-based spacing scale, radii, elevation.

Tokens map directly to a theme in code (CSS variables / Tailwind config / the stack guide's design layer) — hand off tokens, never one-off hex values.

## 3. Key Screens & Flows — Index-First, One File Per Flow

For each main user journey (reuse the FSD's flow/sequence diagrams): **one file per flow** at `docs/sdd/ux-screens/<flow-slug>.md` with frontmatter `description` (one line) + `priority` (`Must`/`Should`/`Could` — the same vocabulary the test plan uses for journeys) + `updated` (`YYYY-MM-DD`, bumped every time the flow file is revised in place — the file itself has no other way to signal "this changed since you last read it"). The `-ux.md` doc's flow section is a **thin index**: one row per flow (priority · description · link), sorted by priority. Read index-first: match the flow by its row, open only that file — never one undifferentiated mega-section.

Per screen, at the depth §0 confirmed:
- **Structure-only**: what's on the screen, visual hierarchy, primary action, navigation. Low-fi is fine.
- **Fully detailed**: every section/component named, hierarchy tied to §2 tokens, **the why** (layout/primary-action reasoning, rejected alternative if any), and **interactions** — what happens on tap, on validation, on edge cases ("qty exceeds quota → adjust or show alternate dates", not just "there's an error state"). Layout with no interaction spec is half-specified — the FE still has to invent the behavior.
- **Plain language throughout** — readable outside design; glossary terms are fine, anything else explained inline.

Run `check-file-hygiene.mjs` after writing/renaming a flow file — it checks the filename, frontmatter, and that every flow is indexed.

## 4. Component Patterns

Name the reusable patterns (forms, tables/lists, modals, empty states, cards) and the components they map to, so the FE composes from a kit rather than reinventing each screen.

## 5. States for Every Screen (This Feeds FSD + Tests)

**Each screen defines its empty, loading, error, and success states** — not just the happy path. These become the FSD's error/alternate flows and then e2e tests; a design showing only the full-data state hides most of the real work.

## 6. Accessibility & Responsive as Design, Not Afterthought

From the REQ-NF a11y target: contrast (AA), touch-target size, focus order, keyboard operability, and how the layout reflows across breakpoints (mobile-first if that's the audience). Decisions made here, verified by a test later.

## Exit Gate

`docs/sdd/design-system/design.md` exists and its inventory matches what's actually on disk; direction confirmed with a concrete preview (§0), existing designs respected if present; tokens defined (palette passes AA, type + spacing set); flows index-first, priority-tagged, confirmed as they landed; screens at the confirmed depth with all four states; component patterns named; a11y + responsive addressed; tokens handoff-ready; `check-file-hygiene.mjs` passes. Then the FSD picks up the states as behaviors and BUILD builds to the system.
