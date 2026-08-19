---
name: discover
description: Investigate a decision — architecture, scope, or direction — before it locks in. Runs a frontier/round interview backed by SDD Pipeline's own judgment engines.
disable-model-invocation: true
---

# /sdd-pipeline:discover

Manual entry point to `skills/think/grill/SKILL.md`. Use when you want to interrogate a decision before it becomes a plan — not after.

## What Happens When Called

Runs the frontier/round interview mechanic: map the decision as a design tree, ask the whole "askable now" batch each round (numbered, each with a recommendation), wait for answers, recompute, repeat until nothing is left assumed.

Recommendations come from SDD Pipeline's own judgment engines, not generic reasoning:
- Architecture questions → `skills/think/arch-analyzer/`
- Scope questions → `skills/think/scope-guard/`
- Complexity questions → `skills/think/complexity-analyzer/`
- Security questions → `skills/constraints/[domain]/`

Facts are looked up by the agent, never asked of the user — internal (existing patterns, git history, codebase scans) AND external (does a library exist, current framework capabilities, prior art — via web search / docs tools). Research findings come back into the round, cited. Only real decisions go to the user. Consequential decisions get the full council/devil's advocate pass before closing (see grill's Council section).

## Output

- New domain terms → `docs/sdd/glossary.md`
- Decisions that pass the rule-of-three gate (hard to reverse + surprising + real trade-off) → `docs/sdd/decisions/`
- **No plan file is written.** If the session ends with "let's build it," the shared understanding feeds into the plan the next time `/sdd-pipeline:implement` or the orchestrator runs — it is not re-asked.

## Full Behavior

See `skills/think/grill/SKILL.md` for the complete mechanic, judgment heuristics, and mode interactions.
