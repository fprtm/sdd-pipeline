---
name: ux-design
description: >-
  Design the user interface — a design system (color palette, typography,
  spacing tokens), the key screen flows and low-fi wireframes, component
  patterns, every screen's states (empty/loading/error/success), and
  accessibility + responsive behavior as deliberate design decisions. Use at
  the design phase (4) whenever there IS a UI — not optional for a product with
  screens — or when the user says "design the UI / design system / color
  palette / wireframe / UX / how should it look". Produces docs/sdd/04-ux-design.md.
---

# ux-design — the interface, designed before it's built

A product with screens has a UI whether or not anyone designed it — the only
question is whether it was decided deliberately or fell out of ad-hoc component
choices. This is the design phase for the interface, the peer of `arch-decision`
for the backend: it exists so the FE is built to a system, not improvised.

Output: `docs/sdd/04-ux-design.md`. Skip only for a genuinely UI-less service
(API-only, CLI). For anything a person looks at, this runs.

If a specialized UI/UX design skill is also installed (e.g. `ui-ux-pro-max` —
searchable style/palette/typography/a11y data — or a Figma-integrated design
skill), **prefer it** and treat this skill's rules — confirm direction first,
tokens, states for every screen, a11y — as the checklist to hold it to.
Otherwise, do it yourself as below.

**But its output still has to land in the canonical tree** — a tool with its own
hardcoded output convention doesn't get to scatter files outside `docs/sdd/`
(same "one home per artifact" rule the orchestrator holds everywhere else). For
`ui-ux-pro-max` specifically: it writes to `design-system/<project-slug>/`
relative to whatever `--output-dir` you pass — **pass `--output-dir docs/sdd`**
so it lands at `docs/sdd/design-system/<slug>/MASTER.md` (+ `pages/`), not at
the repo root. `04-ux-design.md` still carries the tokens and full wireframes
itself (§2/§3) and **must cite** `MASTER.md` as their SSOT so the two never
silently diverge. Note: an empty `pages/` folder is **expected**, not a bug — 
`ui-ux-pro-max` creates a page-override file lazily, only once that specific
page is actually built (phase 8), not upfront for the whole wireframe set.

## 0. Confirm direction first — ask, don't assume

Design direction is a **consequential decision the user didn't necessarily
specify** (same "ask rather than assume" rule the whole pipeline holds to) — don't
silently invent a style and start producing artifacts. Before writing anything,
ask (via the native structured-question tool where available):

1. **Is there already a design to follow?** An existing brand guide, Figma file,
   screenshots of a reference app, or a design system already in the codebase.
   If yes — **respect-existing** (the same brownfield principle `arch-decision`
   uses for architecture): extract and document the *actual* tokens/patterns
   rather than inventing new ones; only fill genuine gaps.
2. **What design language/direction, if starting fresh?** Present 2–3 concrete
   directions with a recommendation (e.g. "minimal/utilitarian" vs
   "expressive/brand-forward" vs "match this reference: <name>") rather than
   silently picking one — same pattern `arch-decision` uses for architecture
   options. Ask about light/dark preference and any hard brand constraints
   (existing logo, locked colors) too.
3. **How much wireframe detail is wanted?** Structure-only (screens, hierarchy,
   primary action — fast, low-commitment) vs **fully detailed** (every
   section/component named, states, spacing/hierarchy notes, and the *why*
   behind each screen's layout — see §3). Default to structure-only for `quick`/
   `lite`; ask explicitly for `full`.

Record the answers (a one-line summary at the top of `04-ux-design.md`) before
moving on — this is what §1's principles are *derived from*, not decided fresh.

## 1. Design principles & direction
A short north star for the look/feel tied to the brand and audience (e.g.
"trustworthy, fast, mobile-first, works in bright sunlight for gate staff"),
**derived from the direction confirmed in §0** — not invented independently.
These principles resolve later trade-offs; state them so choices aren't arbitrary.

## 2. Design tokens — the SSOT for look (not hardcoded values)
Define once, reference everywhere (same SSOT rule `code-standards` applies to
code):
- **Color palette** — semantic, not raw: `primary`, `neutral` ramp,
  `success`/`warning`/`danger`, surface/background/text — each with a light and
  dark value. Every color must clear WCAG AA contrast against its background.
- **Typography scale** — font family, a small type ramp (display→body→caption),
  weights, line-heights.
- **Spacing & layout** — a spacing scale (e.g. 4/8-based), radii, elevation.
These map directly to a theme in code (CSS variables / Tailwind config /
`stack-conventions`' design layer) — hand off tokens, not one-off hex values.

## 3. Key screens & flows (wireframes — depth per §0's answer)
For each main user journey (reuse the sequence diagrams from `to-diagrams`), lay
out the key screens. Keep domain terms from `00-context.md` in the labels.

- **Structure-only** (the default for `quick`/`lite`, or when §0 says light):
  what's on the screen, visual hierarchy, primary action, navigation. Low-fi is
  fine — structure and priority matter, not pixels.
- **Fully detailed** (when §0 confirms it, typically `full`): every
  section/component named (header, filters, list item anatomy, CTA placement,
  …), explicit hierarchy/spacing notes tied to the §2 tokens, and — for
  **each screen** — a short **"why"**: why this layout/hierarchy, why the
  primary action is placed there, what alternative was considered and rejected
  if one was. Same "explain what you decide" rule the rest of the pipeline
  holds to (see the orchestrator) — a screen with no rationale is a screen the
  next reader has to reverse-engineer.

Whichever depth, never silently under- or over-deliver relative to what §0
confirmed — if scope changed mid-design, say so and confirm again rather than
assuming.

## 4. Component patterns
Name the reusable patterns (forms, tables/lists, modals, empty states, cards)
and the design-system components they map to, so the FE composes from a kit
rather than reinventing each screen. Ties to the architecture's component-layer
decision.

## 5. States for every screen (this feeds FSD + tests)
Each screen defines its **empty, loading, error, and success** states — not just
the happy path. These become FSD alternate/error flows and e2e tests; a design
that only shows the full-data state hides most of the real work.

## 6. Accessibility & responsive as design, not afterthought
From the REQ-NF a11y target: color contrast (AA), touch-target size, focus
order, keyboard operability, and how the layout reflows across breakpoints
(mobile-first if that's the audience). These are decisions made here, verified
by a test later.

## Exit gate
**Direction confirmed with the user (§0)** — not assumed; existing designs
respected if present. Design tokens defined (palette passes contrast, type +
spacing scales set); key screens wireframed at the confirmed depth — with a
stated *why* per screen if "fully detailed" was asked for — and all four states;
component patterns named; a11y + responsive addressed; tokens are handoff-ready
for the FE to theme from. Then `to-fsd` picks up the states as behaviors and
`implement` builds to the system.
