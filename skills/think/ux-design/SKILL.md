# UX Design — The Interface, Designed Before It's Built

A product with screens has a UI whether or not anyone designed it — the only question is whether it was decided deliberately or fell out of ad-hoc component choices. This is the design-phase peer of `skills/think/arch-analyzer/` for the interface: the FE gets built to a system, not improvised. Runs whenever there IS a UI (medium+ with screens; skip only for API-only/CLI), or on "design the UI / design system / palette / wireframe / UX".

Output: `docs/sdd/design/{NNN}-{slug}-ux.md` (the direction, tokens, and thin flow index) + `docs/sdd/ux-screens/<flow-slug>.md` (one file per flow).

**This skill owns process, not taste** (the orchestrator's composition rule stands: external skills win on aesthetics). If a specialized UI/UX design skill is installed, **prefer it** and hold it to this skill's checklist — confirm direction first, tokens as SSOT, states for every screen, a11y. Its output must still land inside the canonical tree (redirect its output dir to `docs/sdd/design-system/` — never scattered at the repo root), and the `-ux.md` doc cites it as SSOT so the two never diverge. If none is installed, do everything below yourself — fully self-sufficient.

## 0. Confirm Direction First — With a Concrete Preview, Not a Label

Design direction is a consequential decision the user didn't necessarily specify — don't silently invent a style. Before writing anything, ask (native question tool where available):

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

For each main user journey (reuse the FSD's flow/sequence diagrams): **one file per flow** at `docs/sdd/ux-screens/<flow-slug>.md` with frontmatter `description` (one line) + `priority` (`Must`/`Should`/`Could` — the same vocabulary the test plan uses for journeys). The `-ux.md` doc's flow section is a **thin index**: one row per flow (priority · description · link), sorted by priority. Read index-first: match the flow by its row, open only that file — never one undifferentiated mega-section.

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

Direction confirmed with a concrete preview (§0), existing designs respected if present; tokens defined (palette passes AA, type + spacing set); flows index-first, priority-tagged, confirmed as they landed; screens at the confirmed depth with all four states; component patterns named; a11y + responsive addressed; tokens handoff-ready. Then the FSD picks up the states as behaviors and BUILD builds to the system.
