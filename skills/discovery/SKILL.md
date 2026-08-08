---
name: discovery
description: >-
  Collect what the user actually needs — deeply and completely — before any spec
  is written. Use at phase 0 of spec-driven-development, when the user says
  "I want to build X", or whenever requirements are vague. Works for non-developers
  (asks about goals/users/outcomes in plain language) and developers alike. In
  autopilot mode it batches everything into as few rounds as possible; in copilot
  mode it interviews collaboratively.
---

# discovery — collect the need, deeply and completely

The single biggest cause of wasted build effort is building the wrong thing. This
phase exists to make that impossible to do quietly. You are not gathering a wish
list — you are reconstructing the user's real problem well enough that every later
phase can proceed without re-guessing.

Output: `docs/sdd/00-context.md` (glossary seed) + a filled discovery brief that
feeds `to-prd`. Never skip this because the request "seems clear" — clear-sounding
requests hide the most assumptions.

## What you must be able to answer before leaving

Interview until you can answer all of these. If you can't, you're not done.

1. **Problem** — what pain, for whom, and why now? What happens if we build nothing?
2. **Users / personas** — who acts, who is affected, who pays, who approves? What's
   their context (device, environment, skill level, volume)?
3. **Outcome & success** — what does "it worked" look like, as a measurable signal?
4. **Jobs / scenarios** — walk the top 3–5 real situations end to end, in the
   user's words. Concrete stories, not abstractions.
5. **Scope edges** — what is explicitly NOT included this time? What's the smallest
   version that's still valuable?
6. **Constraints** — deadline, budget, existing systems to fit, compliance/privacy,
   platforms, team/skill, expected scale now and in ~12 months.
7. **Data** — what information is created/read/stored? Any of it sensitive (PII,
   payments, health, credentials)? This pre-loads the threat model.
8. **Non-functionals** — performance, availability, accessibility, i18n, security
   expectations. Ask even if the user hasn't thought about them.
9. **Risks & unknowns** — what's uncertain, what could go wrong, what assumptions
   are we making?

## How to ask well

- **Talk to the human you have.** For a non-developer, ask about goals, people, and
  outcomes — never about frameworks or schemas. For a developer, you can go
  technical, but still confirm the *why*, not just the *how*.
- **Prefer stories to specs.** "Walk me through the last time you needed this" beats
  "list your requirements."
- **Surface the unhappy paths early** — "what should happen when X fails / is empty
  / is abused?" These become error flows and threats later.
- **Name assumptions out loud** and get them confirmed or corrected.
- **Ask about what's absent** — the requirement the user forgot is the one that
  bites. Probe security, scale, and accessibility proactively.

## Mode-aware questioning

- **Autopilot:** you won't get many turns, so **batch**. Group all open questions
  into one (or few) well-organized rounds. Where the user can't or won't decide,
  choose the most robust/scalable/maintainable default (see `arch-decision`),
  **record it as an explicit assumption**, and proceed. Stop only for truly
  blocking or irreversible/destructive unknowns.
- **Copilot:** interview iteratively and conversationally; it's fine to go one
  thread at a time. Still cover every item above — collaboration is not an excuse
  to collect less. If a grilling skill (`grill-me`/`grilling`) is installed, use it
  to pressure-test the answers.

## Capture

- Seed `docs/sdd/00-context.md` with the domain terms you heard (the ubiquitous
  language) so every later doc uses the user's words.
- Write a discovery brief (problem, users, outcomes, scenarios, scope, constraints,
  data, NFRs, risks, **assumptions**). This is the raw material `to-prd` turns into
  REQ-xxx.

## Exit gate

You can state the problem in one sentence the user agrees with, and you can answer
all nine questions above (with any gaps recorded as explicit, owned assumptions).
Then proceed to `to-prd`.
