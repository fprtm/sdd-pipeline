# SDLC Detector

Detect the project's SDLC model and adapt SDD Pipeline behavior accordingly. **Mandatory — never skipped, never left undeclared.** There is no "none" value: a project with no formal process is `solo`, which is itself a real, adapted-for methodology, not an absence of one.

## Two Layers, Not One — Don't Confuse Them

**`sdlc` is the SDLC *model*** — the overall shape of the development lifecycle: Waterfall, Iterative, V-Model, Spiral, Agile, DevOps, RAD, Incremental, or Solo. This is the level software-engineering literature means by "SDLC model" (see [GeeksforGeeks' SDLC models overview](https://www.geeksforgeeks.org/software-engineering/sdlc-models-types-phases-use/) for the reference taxonomy this follows).

**`agile-framework` is a second, nested field** — it only exists when `sdlc: agile`, and names *which* Agile framework the team actually runs day to day: Scrum, Kanban, Scrumban, XP, or none (Agile in name only, no named framework). **Scrum and Kanban are not SDLC models** — they're specific ways of running Agile, one level below it. Treating them as siblings of Waterfall (an earlier version of this skill did exactly that) is a category error: a team can be "Agile + Kanban" or "Agile + Scrum", but there's no such thing as being "Kanban" instead of having an SDLC model at all.

## Detection Strategy

**Priority: project config > auto-detect > ask once > default**

### 1. Check Project Config

```
# In docs/sdd/config.md
sdlc: waterfall | iterative | v-model | spiral | agile | devops | rad | incremental | solo
agile-framework: scrum | kanban | scrumban | xp | none    # only present when sdlc: agile
sdlc-reason: [one sentence — why this model (and framework, if agile), stated when first set]
```

If declared, use it. Skip detection.

### Reasoning Is Not Optional

Whenever SDLC is set — by config, auto-detect, or asking the user — state **why** in one sentence, and save it as `sdlc-reason` alongside the value(s). This isn't decoration: a developer who inherits this project later should understand *why* Agile+Kanban was assumed without re-deriving it from board configs. Auto-detect's reason is the signal that triggered it (`"WIP-limited board found in .github/project.yml"`); an asked answer's reason is the user's own words, kept verbatim.

### 2. Auto-Detect from Signals

Scan project for SDLC-model indicators first, then — only if the model is `agile` — narrow to the framework:

| Signal | SDLC model | Agile framework (if applicable) |
|--------|-----------|----------------------------------|
| `.jira/`, `jira.yml`, sprint/story-point labels in `.github/ISSUE_TEMPLATE/`, `.azure-boards/`, `ROADMAP.md` with iteration markers | `agile` | `scrum` |
| `.github/project.yml` with column states (To Do/In Progress/Done), WIP limits in board/CI config, `.trello/`, `.shortcut/` (ex-Clubhouse) | `agile` | `kanban` |
| Sprint cadence signals *and* WIP-limited board signals both present | `agile` | `scrumban` |
| `iterations/`, `ITERATION.md`, timeboxed release notes without sprint/story-point ceremony | `iterative` | — |
| `docs/requirements.md` + `docs/design.md` + `docs/test-plan.md` as separate, sequential-looking docs; numbered phase dirs (`01-requirements/`, `02-design/`); `CHANGE_REQUEST.md`, `sign-off.md` | `waterfall` | — |
| Paired dev/test-phase structure (`test-plans/` mirroring `requirements/` 1:1), `V&V/` (verification & validation) directory | `v-model` | — |
| `RISK.md`/`risk-register.md`, phased `spiral-N/` or `cycle-N/` directories with a risk-analysis step each | `spiral` | — |
| `.github/workflows/` with CD to production on every merge, infra-as-code (`terraform/`, `pulumi/`) alongside app code, feature flags | `devops` | — |
| Heavy prototyping evidence (`prototype/`, `poc/` dirs that got promoted), unusually fast time-to-first-demo relative to project age | `rad` | — |
| Versioned partial-functionality releases (`v0.1-checkout-only`, `v0.2-adds-refunds`), a roadmap of additive slices rather than phases | `incremental` | — |
| No issue templates, no project boards, no CI, single `TODO.md` or scattered TODO comments only, no `CONTRIBUTING.md`, no PR templates | `solo` | — |

**Multiple signals**: weight by count, and prefer the more specific model over a generic one (e.g. V&V directory + paired test docs → `v-model`, not just `waterfall`, even though V-Model is Waterfall-derived). If genuinely ambiguous, ask the user once and save to memory.

### 3. Ask Once, Save

If no signals found, ask — per `skills/think/elicitation/`'s "How to Ask" rule: native question tool first, plain text only as fallback:

```
"I couldn't detect your SDLC model. Which best describes how this project is run?"
- Agile (iterative, adapts as you go) — if picked, follow up: Scrum, Kanban, Scrumban, XP, or no named framework?
- Waterfall (sequential phases, formal docs)
- Iterative (repeated cycles, less ceremony than Agile)
- V-Model (paired dev + test phases)
- Spiral (iterative + explicit risk analysis each loop)
- DevOps (continuous integration/delivery, dev+ops merged)
- RAD (rapid prototyping, heavy user involvement)
- Incremental (ships partial functionality in slices)
- Solo / no formal process
```

Save answer as a note in `docs/sdd/memory/` (update INDEX.md). Don't ask again.

## Behavior Adaptation

### Agile (any framework)

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Iteration-boundary aware in general; see framework row below for the specific shape. |
| **Elicitation** | Reference the current iteration/goal, not a fixed spec — Agile expects requirements to firm up as you go. |
| **Change Plan** | Lightweight, expects revision. |
| **Report** | Framed around what's demoable now. |
| **Decision Log** | Tag decisions with iteration/sprint number when detectable. |

**`agile-framework: scrum`** — Scope Guard flags task scope exceeding reasonable sprint work, references backlog items; Elicitation asks "is this in the current sprint?"; Report is sprint-review friendly.

**`agile-framework: kanban`** — Scope Guard is WIP-limit aware (one task at a time, flags multi-item tasks disguised as one); Elicitation focuses on the single deliverable ("what's the one thing this should do?"); Execution Guard uses shorter loop thresholds for fast feedback.

**`agile-framework: scrumban`** — Both apply: sprint-boundary awareness for planning, WIP limits for flow within the sprint.

**`agile-framework: xp` / `none`** — Base Agile adaptation only; no framework-specific ceremony to reference.

### Waterfall

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Formal change request awareness. Flag scope changes that need sign-off. |
| **Elicitation** | Reference requirements documents. More formal questioning, settled up front. |
| **Change Plan** | Formal format. Include traceability to requirements. |
| **Doc Generator** | Always generate SDS for architecture changes. Reference existing design docs. |
| **Report** | Formal test report format. Map to test plan items. |
| **Decision Log** | Include approval status. Flag decisions that need stakeholder sign-off. |

### V-Model

Same as Waterfall, plus: **every requirement/design item generated in doc-generator gets its corresponding test-plan item generated in the same pass** — the pairing is the point of this model, so SDD Pipeline enforces it rather than treating test-plan as a later, separate step.

### Iterative

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Cycle-boundary aware, lighter than Waterfall's sign-off ceremony. |
| **Elicitation** | Expect requirements to evolve between cycles; re-confirm scope each cycle rather than assuming the first pass is final. |
| **Report** | Framed as "what this cycle added" relative to the previous one. |

### Spiral

Iterative's adaptation, plus: **a risk-analysis note is required before each cycle's scope is locked** — surface the top 1-3 risks for this cycle explicitly (what could go wrong, likelihood, mitigation) before Change Plan is written, matching Spiral's defining risk-driven-loop structure.

### DevOps

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Favors small, frequently-shippable changes over large batched ones. |
| **Change Plan** | Assumes CI/CD exists; references the pipeline rather than a manual release process. |
| **Report** | Includes deploy/rollback readiness, not just code correctness. |

### RAD

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Elicitation** | Favor a quick prototype/demo over exhaustive upfront questioning — RAD's whole premise is learning from a working thing fast. |
| **Doc Generator** | Lighter-weight docs early; formalize once the prototype validates direction. |

### Incremental

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Each increment must be independently shippable and deliver real functionality on its own — this is the same discipline as `build/ticket-decomposition`'s vertical-slice rule, applied at the release level, not just the ticket level. |
| **Change Plan** | Frames each increment against what previous increments already shipped. |

### Solo

| SDD Pipeline Component | Adaptation |
|---------------|------------|
| **Scope Guard** | Minimal ceremony. Focus on preventing scope creep without process overhead. |
| **Elicitation** | Casual, direct. Fewer questions. |
| **Change Plan** | Brief. No formality requirements. |
| **Report** | Concise. Skip ceremony. |
| **Decision Log** | Lightweight entries. |

## Mode Interaction

| Mode | SDLC Impact |
|------|-------------|
| **prototype** | SDLC detection runs but adaptations are minimal — speed first |
| **vibe** | SDLC adapts silently. No ceremony shown to user. |
| **standard** | Full SDLC adaptation. Context shown in plan. |
| **strict** | Full SDLC adaptation + formal compliance checks. Waterfall/V-Model: require traceability. Agile+Scrum: require story reference. |
| **emergency** | SDLC skipped. Fix first, process later. |

## Output

Pass the detected model (and framework, if Agile) to all downstream skills as context:

```
SDLC: agile (framework: kanban)
Reason: WIP-limited board found in .github/project.yml
Adaptation: single-piece flow, WIP-limit-aware scope guard, compact ready-to-move reports
```

## Override

User can always override per-task:

```
"ignore SDLC for this task"
"treat this as waterfall even though we're agile"
```

Override applies to current task only. Not saved to memory.
