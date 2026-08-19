# Prototype Mode

Speed-first. For MVPs, hackathons, proof-of-concepts. Minimum viable guardrails.

## Behavior

| Phase | Setting |
|-------|---------|
| Elicitation | Skip. Auto-infer everything. |
| Context | Minimal: detect stack only. |
| Scope guard | No limits. |
| Complexity | Detect but don't block. |
| Constraints | Critical security only (#7 no secrets, #9 no dead code with secrets). |
| Anti-patterns | Check hallucinated APIs (#5) and secrets (#9) only. |
| Plan file | Skip. No plan file generated. |
| Change plan | Skip. |
| Doc generator | Skip. No docs generated. |
| SDLC detector | Skip. Speed first. |
| Arch analyzer | Skip. Build fast, refactor later. |
| Stats | Track minimally (files changed + security issues only). No footer. |
| Execution guard | Loop detection after 5 tries. No progress signals. |
| Verification | Quick smoke test: does it run? |
| Adversarial | Skip. |
| Security | Secrets check only. |
| Performance | Skip. |
| Report | 1-line: "Works." or "Broken: [error]" |
| Decision log | Skip. |
| Comprehension | Skip. |
| Insight | Skip. |
| Memory | Don't save. Prototype decisions aren't meant to persist. |

## When to Use

- Hackathons with time pressure
- Exploring an idea quickly
- Throwaway prototypes
- "Just make it work" situations

## Warning

Prototype mode produces code that is NOT production-ready. If the prototype becomes a real product, run `health-check` to identify issues before going to production.
