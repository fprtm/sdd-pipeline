# Orchestrator behavior policy

Read this reference for a governed coding task. It owns mode selection, phase
depth, control axes, domain and SDLC detection, role boundaries, and brownfield
adoption. Phase skills defer to the unified matrix here on conflict.

## Mode detection

| Signal | Mode |
|---|---|
| User explicitly requests prototype/MVP/hackathon/quick-and-dirty | prototype |
| User explicitly requests vibe/no ceremony/invisible guardrails | vibe |
| No stronger signal | standard |
| Production-critical, regulated, fintech, healthcare, or compliance work | strict |
| Active outage/crash/emergency/urgent repair | emergency |
| `docs/sdd/config.md` declares a default | configured mode |

Tone is not a mode signal. Load only the selected
`skills/modes/{mode}/SKILL.md`; mode files add process, while the matrix below
owns phase behavior.

## Unified mode matrix — single source of truth

### THINK

| Phase | prototype | vibe | standard | strict | emergency |
|---|---|---|---|---|---|
| Elicitation | 5 seats, one fast round; routine work may skip questions | 5 seats, one round, auto-accept recommendations | adaptive 0–5 questions | 5+ thorough questions and confirmation | skip; focus on error |
| Context | minimal stack detection | silent automatic scan | full scan and report | deep scan and user verification | error-focused only |
| Scope guard | no limit | soft internal warning | hard limits; pause if exceeded | strict limits with approval | no limit |
| Complexity | detect, do not block | detect silently and auto-escalate | report; user decides | detailed breakdown | skip |
| SDLC detector | detect and announce | detect and adapt silently | full adaptation in plan | full formal adaptation | detect current state; defer adaptations |
| Arch analyzer | skip | silent; surface critical only | full analysis and recommendations | full analysis with approval | skip |
| Threat model | skip | zone-triggered silently | zone-triggered | mandatory | defer until post-fix |

### BUILD

| Phase | prototype | vibe | standard | strict | emergency |
|---|---|---|---|---|---|
| Constraints | `OVERRIDE: None` rules only | silent auto-correction | visible correction | visible; approve each | skip overridable rules; hard stops remain |
| Anti-patterns | hallucinated APIs and secrets only | auto-fix silently | fix and note | report; fix after acknowledgement | skip |
| Written record | shown and auto-approved | written and auto-approved silently | shown; await approval/go | explicit approval required | defer to retrospective |
| Change plan | skip | auto-declare | declare and confirm | approve each file | skip |
| Doc generator | minimum DoD | generate silently | generate and summarize | full suite before BUILD | post-fix retrospective |
| Execution guard | escalate after 5 no-progress tries | after 3 | after 3 with milestones | after 2 with every decision visible | after 2; escalate fast |

### PROVE

| Phase | prototype | vibe | standard | strict | emergency |
|---|---|---|---|---|---|
| Verification | smoke plus applicable small+ coverage | types, tests, lint, coverage silently | all four layers | all layers plus manual checkpoint | smoke now; coverage in post-fix follow-up |
| Adversarial | skip | skip | 3–5 targeted tests | 5–10+ comprehensive tests | skip |
| Security | secrets check | silent; surface critical only | full domain checklist | full plus manual review recommendation | secrets and injection only |
| Performance | skip | skip | detect and flag | detect, flag, require resolution | skip |

### META

| Phase | prototype | vibe | standard | strict | emergency |
|---|---|---|---|---|---|
| Report | one-line verdict | one-line verdict plus top check | actionable 15–20 lines | detailed, including blind spots | one-line fix result |
| Decision log | skip | auto-log silently | log and reference | log every decision | post-facto emergency entry |
| Comprehension | skip | 2–3 sentences | full, about 15 lines | detailed walkthrough and flow | skip |
| Insight | skip | 1–2 lines | per-task notes and periodic summary | continuous | skip |
| Memory | do not save | save automatically | save automatically | save detailed context | do not save |
| Stats | minimal; no footer | full tracking; one-line footer | full tracking; two-line footer | full report | brief fix tracking; no footer |

Mode controls depth and visibility, not whether a relevant subject or evidence
gate exists. No mode may skip an applicable discovery seat, the DoD floor
above micro, coverage measurement, or an `OVERRIDE: None` rule.

## Independent control axes

Assess these separately:

- complexity: micro, small, medium, large;
- risk: low, moderate, high, critical;
- assurance: A0, A1, A2, A3;
- ceremony: prototype, vibe, standard, strict, emergency.

Complexity controls decomposition only. Assess harm, money, privacy,
authorization, availability, reversibility, and compliance independently.
Disposable micro work may use A0; moderate risk requires at least A1, high A2,
and critical A3. Unknown risk requires at least A2. Run
`skills/meta/quality-contract/rules/axes.mjs` in shadow/report-only mode when
available; its result never grants authority.

| Complexity | Typical signal | Depth |
|---|---|---|
| micro | typo, rename, one-line formatting | constraints only |
| small | bug fix or simple change under three expected files | light THINK and basic PROVE |
| medium | feature, endpoint, or component | full pipeline |
| large | new system or multi-component architecture | deep pipeline and tickets |

## Roles and lifecycle

Roles are accountability contracts, not personas. Product owner, architect,
implementer, verifier, security reviewer, SRE, release authority, and outcome
owner have bounded ownership and prohibited self-approval. At A2 the
implementer differs from verifier and applicable specialist; A3 requires
externally attested qualified human authority. Actor strings or fresh prompts
do not create human authority. Use
`skills/meta/quality-contract/rules/roles.mjs` when available.

For vNext work, lifecycle events are append-only and exact-subject-bound from
intake through outcome review, including reject, revise, rework, rollback, and
retire. Invalid, stale, expired, replayed, forked, or unauthorized events leave
the prior state unchanged. Legacy input remains report-only until explicit
migration. `skills/meta/quality-contract/rules/lifecycle.mjs` owns the
transition table.

## Domain, SDLC, and architecture

Detect domain from the repository and load only matching constraint packs:
web, CLI, mobile, library, API, or the minimal mixed set. Detect SDLC every
governed task from `docs/sdd/config.md`, project signals, then one user question
only if still unknown. Announce mode and SDLC together. Agile is the model;
Scrum, Kanban, Scrumban, and XP are frameworks.

Run architecture analysis for existing patterns, new-project structure, or
cross-boundary changes at the depth selected by the matrix. On first brownfield
adoption, create only `docs/sdd/config.md` and `docs/sdd/index.md`; do not
retroactively document the codebase.
