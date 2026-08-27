# Vibe Mode

Invisible guardrails. The user shouldn't feel the framework working. For casual coding, personal projects, and vibe-coding sessions.

**Entered only on request** (or via `config.md`), never inferred from a casual-sounding prompt — tone is not a quality requirement. And "invisible" governs *narration*, not *coverage*: the discovery seats still all get asked, just fast and without ceremony.

## Behavior

| Phase | Setting |
|-------|---------|
| Elicitation | 0-1 questions on a routine task. On a new product/feature, the five discovery seats still all get asked — one round each, recommendations accepted unless the user objects. Mode dials depth, not coverage. |
| Context | Auto-scan silently. |
| Scope guard | Soft limits. Warn internally, don't interrupt user. |
| Complexity | Detect silently. Auto-escalate task size. |
| Constraints | Run silently. Auto-correct violations WITHOUT telling user. |
| Anti-patterns | Auto-fix silently. |
| Written record | `changes/{date}-{slug}.md` (small/medium) or tickets (large), written silently. Auto-approved. No wait. |
| Change plan | Auto-declare. No approval needed. Note deviations in summary. |
| Doc generator | Generate docs silently. Available in docs/sdd/ for later review. |
| SDLC detector | Detect silently. Adapt behavior without telling user. |
| Arch analyzer | Run silently. Flag only CRITICAL issues (circular deps). |
| Stats | Track everything. Show 1-line footer. |
| Execution guard | Loop detection after 3 tries. No progress signals. |
| Verification | Layers 1-3 (types + tests + lint) silently. Only surface failures. |
| Adversarial | Skip. |
| Security | Auto-check. Only alert on CRITICAL findings. |
| Performance | Skip. |
| Report | 1-line verdict + top 1 thing user should check. |
| Decision log | Auto-log silently. |
| Comprehension | 2-3 sentences as part of completion message. |
| Insight | Brief 1-2 line after-action note. |
| Memory | Save automatically. |

## The Invisible Principle

The user's experience should be:
1. They give a prompt.
2. They get a result that's better than it would have been without SDD Pipeline.
3. They get a brief summary of what was done and one thing to check.

They should NOT experience:
- Interrogation (many questions)
- Interruption (pauses for approval)
- Lecture (long reports about what SDD Pipeline caught)

## Completion Output

```
[Result delivered]

Built [what] with [key choice]. Assumed [assumption]. Check: [one thing to verify].

---
SDD Pipeline: 2 anti-patterns fixed | 1 security issue caught | confidence: HIGH
```

## Plan Handling

The written record (`changes/{date}-{slug}.md` for small/medium, tickets for large) is created automatically but NOT shown to the user. Auto-approved. It stays in the tree for later review if curious.

## Document Handling

Docs (FSD, SDS, etc.) are generated silently to `docs/sdd/specs/`, `docs/sdd/erd/`, etc. Not mentioned to user unless they ask. Available for later review.
