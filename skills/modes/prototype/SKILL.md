# Prototype Mode

Speed-first. For MVPs, hackathons, proof-of-concepts. Minimum viable guardrails.

## Behavior

| Phase | Setting |
|-------|---------|
| Elicitation | Skip on a routine task. On a new product/feature, the five discovery seats still all get asked — one fast round each. Mode dials depth, not coverage. |
| Context | Minimal: detect stack only. |
| Scope guard | No limits. |
| Complexity | Detect but don't block. |
| Constraints | Critical security only (#7 no secrets, #9 no dead code with secrets). |
| Anti-patterns | Check hallucinated APIs (#5) and secrets (#9) only. |
| Plan file | Skip. No plan file generated. |
| Change plan | Skip. |
| Doc generator | Skip. No docs generated. |
| SDLC detector | Detect and announce (cheap, shapes ticket/scope behavior). Skip adaptations that slow work down. |
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
