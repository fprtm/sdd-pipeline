# Model Strategy

Multi-model routing for token efficiency. Use the cheapest model that can handle each sub-task correctly.

## Model Tiers

| Tier | Examples | Relative Cost | Strength |
|------|----------|---------------|----------|
| CHEAP | Haiku, GPT-4o-mini, Gemini Flash | 1x | Mechanical, rule-based |
| MID | Sonnet, GPT-4o, Gemini Pro | 3-5x | Implementation, pattern-following |
| STRONG | Opus, o3/o4, Gemini Ultra | 5-10x | Judgment, architecture, security |

## Routing Table

| Sub-task | Tier | Why |
|----------|------|-----|
| Lint / format check | CHEAP | Mechanical |
| Constraint check (clear rule) | CHEAP | Binary yes/no |
| Constraint check (judgment) | STRONG | Needs context understanding |
| CRUD implementation | MID | Standard patterns |
| Complex algorithm | MID-STRONG | Depends on novelty |
| Architecture decision | STRONG | High-impact judgment |
| Test writing | MID | Standard patterns |
| Adversarial test generation | MID | Creative but bounded |
| Security review | STRONG | Must catch subtle issues |
| Performance detection | MID | Pattern matching |
| Decision log entry | CHEAP | Formatting |
| Comprehension summary | MID | Needs understanding |
| Report generation | MID | Synthesis |

## Constraint Metadata

Each constraint rule is tagged:
- `CHECK: mechanical` → route to CHEAP tier
- `CHECK: judgment` → route to STRONG tier

## Estimated Savings — Unverified

The routing table above implies a rough estimate:
- ~40% of sub-tasks → CHEAP
- ~40% of sub-tasks → MID
- ~20% of sub-tasks → STRONG
- **Theoretical range: ~40-60% token cost reduction vs. running everything on STRONG tier**

**This number has not been measured in any real run.** It's a plausible estimate from the tier categorization, not a validated result. Treat it as a hypothesis, not a claim. If `skills/meta/stats/` accumulates enough real routing data over time (surfaced via `/sdd-pipeline:check`'s impact summary), replace this section with actual observed numbers instead of the estimate.

## Single-Model Fallback

Most current environments have one model. In that case: ignore this skill entirely. Run everything on the available model. Model strategy is ADVISORY — it provides value when the environment supports multi-model dispatch.
