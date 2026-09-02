# UX Design — The Interface, Designed Before It's Built

A product with screens has a UI whether or not anyone designed it — the only question is whether it was decided deliberately or fell out of ad-hoc component choices. This is the design-phase peer of `skills/think/arch-analyzer/` for the interface: the FE gets built to a system, not improvised. Runs whenever there IS a UI (medium+ with screens; skip only for API-only/CLI), or on "design the UI / design system / palette / wireframe / UX".

Output: **`docs/sdd/design-system/design.md`** (the one entry doc for the UI — always) + `docs/sdd/specs/{NNN}-{slug}/ux.md` (per-feature UX spec, bundled with its FSD/SDS/threats siblings inside the same feature folder) + `docs/sdd/design-system/ux-screens/<flow-slug>.md` (one file per flow, living alongside `design.md` — a flow isn't owned by one feature the way `ux.md` is, it can be revisited by a later feature, so it stays project-level).

## Deliberation Agenda — Discuss Before Any UX Document Is Written

When spec reaches the UX step, these topics seed the grill frontier (see `skills/think/grill/SKILL.md`, "technical domain deliberation" subject type). Each topic carries a recommendation with a concrete preview. The UX documents are written only after the frontier is empty.

**Granularity rule: discussing "interaction design" without naming the specific interactions per screen is not deliberation — it's labeling.** Each topic below has a **depth requirement**: the minimum concrete detail before the topic counts as settled.

1. **Interaction design per screen** — what happens on tap, swipe, long-press, hover. What's the primary action? What's secondary? What's the destructive action and how is it guarded? A screen with no interaction spec is half-designed — the FE still invents the behavior.
   
   **Depth requirement**: per screen, present a concrete interaction table:
   ```
   Screen: Product Detail
   | Element | Action | Result |
   |---------|--------|--------|
   | "Add to Cart" button | tap | add item, show toast "Added!", update cart badge |
   | Quantity stepper | tap +/- | increment/decrement (min 1, max = stock) |
   | Product image | tap | open fullscreen gallery |
   | "Delete" (cart page) | tap | confirm dialog → remove item |
   ```

2. **State management per screen** — which states exist (empty, loading, error, success, partial, offline), transitions between them, what triggers each. These become the FSD's error/alternate flows and then test cases; a design showing only the full-data state hides most of the real work.
   
   **Depth requirement**: per screen, present every state and what triggers it. Not "has empty state" — but "empty state shows illustration + 'No orders yet' + 'Browse Products' CTA."

3. **Error handling UX** — how errors surface to the user (toast, inline, full-page, modal), what the user can do about them (retry, edit, navigate away), recovery paths. Every error state in the FSD must have a designed user experience, not a generic "error occurred."
   
   **Depth requirement**: per error type, name the presentation and recovery. Present as a table mapping error → UX treatment → recovery action.

4. **Flow detail with edge cases** — complete user journeys including conditional screens, branching paths based on user state or data, what happens at boundaries (first use, max items, expired session). Discover settled WHICH flows; this settles what each flow actually looks like step by step.
   
   **Depth requirement**: per flow, a step-by-step walkthrough naming each screen transition, conditional branch, and terminal state. (Same depth as spec's FSD deliberation — see `skills/commands/spec/SKILL.md`.)

5. **Responsive strategy** — what changes at each breakpoint and why (not just "it stacks"). Mobile-first or desktop-first? Which components hide/show/reflow? Touch targets and spacing at mobile size.
   
   **Depth requirement**: name the breakpoints (e.g., 640/768/1024) and per screen what changes. Not "responsive" — but "product grid: 1 col mobile, 2 col tablet, 4 col desktop."

6. **Navigation model** — tab bar, drawer, stack, breadcrumb, or hybrid. How deep the navigation goes. How the user knows where they are. Back button behavior.
   
   **Depth requirement**: present the navigation structure as a tree/diagram showing every reachable screen and how the user gets there.

**Topic skipped only when the product has no screens.** Mode controls depth (one round vs full rounds), not whether the topic is raised. Even in prototype mode, every relevant topic gets one question with a recommendation.

§0 below (Confirm Direction First) remains the opening act — it confirms the *visual direction* before deliberation dives into interaction and state detail.

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
| [flow name] | Must | [`ux-screens/<flow-slug>.md`](ux-screens/<flow-slug>.md) |

## Component Patterns
[Reusable patterns → the components they map to.]

## Accessibility & Responsive
[Contrast, touch targets, focus order, keyboard operability, breakpoint reflow — the project-wide rules.]

## Per-Feature UX Specs
- [FSD-adjacent UX docs: `specs/{NNN}-{slug}/ux.md`, one row each]
```

**Relationship to `ux.md`**: `design.md` is **project-level and singular**, living in `docs/sdd/design-system/` (the design system, updated in place forever) alongside `ux-screens/` (also project-level — a flow can be revisited by a later feature, so it isn't frozen to one number); `specs/{NNN}-{slug}/ux.md` is **per-feature and numbered** (this feature's UX decisions, frozen with its FSD, living inside that same feature folder). One product has exactly one `design.md` and as many `ux.md` files as it has UI features. When only one small feature has a UI, `design.md` is still written — short is fine, absent is not.

`check-file-hygiene.mjs` enforces this: a `design-system/` directory with no `design.md` is a flagged problem.

**Why the per-feature UX doc lives in `specs/`, not `design-system/`**: it's frozen with its FSD/SDS/threats siblings inside the same feature folder — one glance at `specs/003-*/` shows the whole feature's spec bundle, UX decisions included. `design-system/` stays reserved for what's genuinely project-wide (tokens, principles, the screen inventory, and the flow-level `ux-screens/` detail) — never a per-feature accretion.

## Document Shape

`ux.md` is a design doc that sits alongside its `fsd.md`/`sds.md`/`threats.md` siblings inside `docs/sdd/specs/{NNN}-{slug}/` — same metadata header as those (see `skills/build/doc-generator/formats.md`), so a reader scanning the folder can tell at a glance how current each one is instead of the UX doc looking like the odd one out.

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
[Thin index: one row per flow — priority · description · link to docs/sdd/design-system/ux-screens/<flow-slug>.md]

## 4. Component Patterns
[Reusable patterns and the components they map to]

## 5. States for Every Screen
[Confirmation that empty/loading/error/success are defined per screen, or exceptions noted]

## 6. Accessibility & Responsive
[Contrast, touch targets, focus order, keyboard operability, breakpoint reflow]
```

**This skill owns process, not taste** (the orchestrator's composition rule stands: external skills win on aesthetics). If a specialized UI/UX design skill is installed, **prefer it** and hold it to this skill's checklist — confirm direction first, tokens as SSOT, states for every screen, a11y. Its output must still land inside the canonical tree (redirect its output dir to `docs/sdd/design-system/` — never scattered at the repo root), and both `design.md` and the `-ux.md` doc cite it as SSOT so the copies never diverge. **An external skill owning the tokens does not excuse the missing front door**: `design.md` is still written, citing that skill's files rather than duplicating them. If none is installed, do everything below yourself — fully self-sufficient.

## Style Grounding — `ui-ux-pro-max` If Installed, Else the Built-In Catalog

Presenting a direction candidate (§0) needs concrete grounding, not vague labels like "modern and clean." If the `ui-ux-pro-max` plugin is installed, **prefer it** — its 79-style design-intelligence data is richer. If it's not installed, this framework ships its own lightweight fallback: `docs/design-system-styles/00-index.md` catalogs 80 real, named design styles (Neo-Brutalism, Glassmorphism, Swiss Typographic, Corporate Memphis, etc.), one line each with a descriptor and search keywords, grouped by category. Read the index, match the project brief's brand/audience/tone against the keywords, then open **only the 1-3 relevant style files** (`docs/design-system-styles/<slug>.md`) for concrete palette/typography/trait detail to ground the candidate preview — never load all 80 files into context. This is the same atomic-note-plus-index pattern used elsewhere in the framework (e.g. `skills/think/grill/` topics) to keep token cost proportional to what's actually needed.

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

For each main user journey (reuse the FSD's flow/sequence diagrams): **one file per flow** at `docs/sdd/design-system/ux-screens/<flow-slug>.md` with frontmatter `description` (one line) + `priority` (`Must`/`Should`/`Could` — the same vocabulary the test plan uses for journeys) + `updated` (`YYYY-MM-DD`, bumped every time the flow file is revised in place — the file itself has no other way to signal "this changed since you last read it"). The `ux.md` doc's flow section is a **thin index**: one row per flow (priority · description · link), sorted by priority. Read index-first: match the flow by its row, open only that file — never one undifferentiated mega-section.

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
