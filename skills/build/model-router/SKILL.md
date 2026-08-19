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

## Usage

This skill is ADVISORY. It provides routing hints for environments that support multi-model dispatch.

- **Multi-model environments**: use these recommendations to assign sub-tasks to appropriate models.
- **Single-model environments** (most current setups): ignore this skill. Run everything on the available model.

## Estimated Savings

40-60% token cost reduction vs running everything on STRONG tier. The savings come from offloading mechanical tasks (lint, logging, formatting) to cheap models.

## Constraint Metadata

Each constraint in the constraints engine should be marked:

- `check: mechanical` → route to CHEAP (clear rule, binary result)
- `check: judgment` → route to STRONG (requires understanding context)

This metadata helps the router make correct decisions without analyzing each constraint at runtime.
