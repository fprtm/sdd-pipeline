# Prototype Mode

Speed-first. For MVPs, hackathons, proof-of-concepts. Minimum viable guardrails.

**Phase behavior**: see the unified mode matrix in `skills/orchestrator/SKILL.md`. This file adds process rules unique to prototype mode.

## Minimum Sinks

Prototype is fast, not blind. Even at maximum speed, these sinks always run:

1. **Deliberation ledger** — if a grill or elicitation happened, the ledger file is written (settled/assumed/unresolved rows). A prototype built on unrecorded assumptions can't be evaluated later.
2. **DoD** — a 3-line definition of done is the floor. Without it, "done" is whatever the agent felt like stopping at.
3. **OVERRIDE:none constraints** — secrets (#7) are never skipped, in any mode.

## When to Use

- Hackathons with time pressure
- Exploring an idea quickly
- Throwaway prototypes
- "Just make it work" situations

## Warning

Prototype mode produces code that is NOT production-ready. If the prototype becomes a real product, run `health-check` to identify issues before going to production.
