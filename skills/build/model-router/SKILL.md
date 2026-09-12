# Model Router

Multi-model routing for token efficiency. Assign sub-tasks to the cheapest model that can handle them correctly.

## Model Tiers

| Tier | Examples | Cost | Good For |
|------|----------|------|----------|
| CHEAP | Haiku, GPT-4o-mini, Gemini Flash | 1x | Mechanical, rule-based tasks |
| MID | Sonnet, GPT-4o, Gemini Pro | 3-5x | Implementation, pattern-following |
| STRONG | Opus, o3, Gemini Ultra | 5-10x | Judgment, architecture, security |

## Routing Table

| Sub-task | Tier | Rationale |
|----------|------|-----------|
| Lint / format check | CHEAP | Mechanical, no judgment |
| Clear constraint check ("max 3 deps") | CHEAP | Rule-based, binary |
| Judgment constraint ("is this overengineered?") | STRONG | Requires contextual judgment |
| CRUD implementation | MID | Standard patterns |
| Complex algorithm | MID-STRONG | Depends on novelty |
| Architecture decision | STRONG | High-impact, needs judgment |
| Test writing | MID | Standard patterns |
| Adversarial test generation | MID | Creative but bounded |
| Security review | STRONG | Must catch subtle issues |
| Performance pattern detection | MID | Pattern matching |
| Decision log entry | CHEAP | Formatting only |
| Comprehension summary | MID | Needs understanding |
| Report generation | MID | Synthesis |

## Execution Mode — Alongside Model Tier, Not Instead Of

Model tier answers "how capable a model does this sub-task need." Execution mode answers a different question: "what kind of access does this sub-task need." The two are independent dimensions — a cheap model can run read-only, a strong model can run read-write.

| Sub-task shape | Execution mode | Rationale |
|-----------------|-----------------|-----------|
| Codebase exploration, `/sdd-pipeline:learn`, context-loader's scan | **Read-only** | Nothing here should ever touch a file — matching a read-only agent profile (e.g. `Explore`) makes that a property of the dispatch, not a hoped-for discipline |
| Verification, adversarial testing, coverage-check, judgment | **Read-mostly** (may write test files, must not alter implementation) | The whole point of these gates is checking someone else's change — write access to the implementation defeats the gate |
| Implementation, `/sdd-pipeline:implement`, ticket execution | **Read-write** | The only category that should be touching production code |
| `/sdd-pipeline:docs` retroactive doc generation | **Read-write, docs-only** | Scans code but only ever writes to `docs/` — never touches source |

**Where this matters in practice**: when dispatch is available and the runtime distinguishes agent capability profiles (a read-only research agent vs. a full read-write coding agent), route by this table in addition to model tier. When it isn't — single-agent environments running everything in one context — this becomes a discipline instead of an enforced boundary: state the mode out loud before starting ("read-only pass — no files touched") the same way single-agent context-independence passes announce their constraint elsewhere in this pipeline. An agent that says "read-only" and then edits a file has violated something worth noticing, even without a runtime that would have blocked it.

## Usage

This skill is ADVISORY. It provides routing hints for environments that support multi-model dispatch or multi-profile agent dispatch.

- **Multi-model / multi-profile environments**: use the model tier table and the execution mode table together to route sub-tasks.
- **Single-model, single-profile environments** (most current setups): the model tier table doesn't apply (nothing to route to), but the execution mode table still sets a discipline — announce read-only vs read-write intent per the rule above, even without a runtime boundary enforcing it.

## Constraint Metadata

Each constraint in the constraints engine should be marked:

- `check: mechanical` → route to CHEAP (clear rule, binary result)
- `check: judgment` → route to STRONG (requires understanding context)

This metadata helps the router make correct decisions without analyzing each constraint at runtime.
