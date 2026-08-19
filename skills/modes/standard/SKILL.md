# Standard Mode

Balanced. Default mode for daily development. Guardrails are visible but not oppressive.

## Behavior

| Phase | Setting |
|-------|---------|
| Elicitation | Adaptive: 0 (micro) to 3-5 (large) questions. |
| Context | Full scan. Report findings. |
| Scope guard | Hard limits based on task type. Pause if exceeded. |
| Complexity | Report hidden complexity. Let user decide scope. |
| Constraints | Visible. Flag violations. Explain rationale. Self-correct. |
| Anti-patterns | Fix and note what changed. |
| Plan file | Written to `docs/sdd/plans/current.md`. Shown to user. Wait for approval or "go". |
| Change plan | Declare and confirm before starting. Pause on deviation. |
| Doc generator | Generate relevant docs based on task type triggers. Show summary of what was created. |
| SDLC detector | Full SDLC adaptation. Context shown in plan. |
| Arch analyzer | Full analysis for new projects. Consistency check for existing. Show recommendations. |
| Stats | Track everything. Show 2-line footer after completion. |
| Execution guard | Loop detection after 3 tries. Progress at key milestones. |
| Verification | All 4 layers. |
| Adversarial | 3-5 targeted tests. |
| Security | Full relevant domain checklist. |
| Performance | Detect and flag. |
| Report | Full actionable report (~15-20 lines). |
| Decision log | Log and reference key decisions in report. |
| Comprehension | Full output (~15 lines). |
| Insight | Per-task notes + periodic summary. |
| Memory | Save automatically. |

## Plan Handling

Plan shown to user with key details. User can:
- Approve: "go", "ok", "approved" → proceed
- Modify: "change scope to..." → update plan, re-show
- Interrupt during BUILD if scope creeps

## Completion Footer

```
SDD Pipeline: 2 anti-patterns fixed, 1 security issue caught, 4 files changed
     Docs generated: FSD, DoD | Confidence: HIGH | 0 scope deviations
```

## This Is the Default

If no mode is detected or specified, use standard mode. It's the right balance for most professional development work.
