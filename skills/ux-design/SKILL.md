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

## 1. Design principles & direction
A short north star for the look/feel tied to the brand and audience (e.g.
"trustworthy, fast, mobile-first, works in bright sunlight for gate staff").
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

## 3. Key screens & flows (low-fi wireframes)
For each main user journey (reuse the sequence diagrams from `to-diagrams`),
lay out the key screens: what's on them, visual hierarchy, primary action,
navigation. Low-fi is fine — structure and priority matter, not pixels. Keep
domain terms from `00-context.md` in the labels.

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
Design tokens defined (palette passes contrast, type + spacing scales set); key
screens wireframed with all four states; component patterns named; a11y +
responsive addressed; tokens are handoff-ready for the FE to theme from. Then
`to-fsd` picks up the states as behaviors and `implement` builds to the system.
