# Stats Tracker

Track what SDD Pipeline does per task. Powers vibe mode footer and historical stats dashboard.

## What Gets Tracked

| Metric | Description |
|--------|-------------|
| `anti_patterns_caught` | Number of anti-patterns detected and fixed |
| `anti_patterns_types` | Which anti-patterns (e.g., god function, deep nesting) |
| `security_issues` | Security issues found and addressed |
| `scope_deviations` | Times scope changed from declared plan |
| `constraints_enforced` | Constraint rules that triggered |
| `decisions_logged` | Number of decisions recorded |
| `docs_generated` | Which docs were created (FSD, SDS, etc.) |
| `verification_result` | Pass/fail + confidence level |
| `mode_used` | Which mode was active |
| `task_size` | Detected task size (micro/small/medium/large) |
| `files_changed` | Number of files created/modified/deleted |
| `loops_detected` | Execution loops caught by execution-guard |
| `skills_recommended` | External skills suggested |
| `gates_skipped` | Every gate skipped this task (plan file, DoD, test plan, threat model, coverage, traceability…), each with a one-line reason — tracked at **every** size/mode, including micro/prototype, since this is the durable trail for "why didn't this task get docs" (see orchestrator's Plan Transparency + Mandatory documentation rule) |

## Per-Task Output

After every task, SDD Pipeline records a stats entry.

### Vibe Mode Footer

Displayed at the end of agent response (1-2 lines):

```
---
SDD Pipeline: 2 anti-patterns fixed | 1 security issue caught | 4 files changed | confidence: HIGH
```

Rules:
- Only show if SDD Pipeline actually did something (no empty footer)
- Max 1 line for vibe mode
- Standard/strict modes can show 2-3 lines with more detail
- Prototype mode: no footer

### Stats File Entry

Append to `docs/sdd/stats/{YYYY-MM}.md`:

```markdown
### Task: [task description slug]
**Date**: 2026-08-17 14:30
**Mode**: standard | **Size**: medium | **SDLC**: scrum

| Metric | Value |
|--------|-------|
| Anti-patterns caught | 2 (god function, deep nesting) |
| Security issues | 1 (missing input validation) |
| Scope deviations | 0 |
| Constraints enforced | 3 |
| Decisions logged | 2 |
| Docs generated | FSD, DoD |
| Gates skipped | none |
| Verification | PASS (HIGH confidence) |
| Files changed | 4 (2 created, 2 modified) |

---
```

For a task where docs/plan were legitimately skipped, the row still appears — e.g. `Gates skipped: plan_file — micro (1-line rename)` — rather than being omitted. An empty `Gates skipped: none` row is itself useful evidence: it distinguishes "nothing was skipped" from "no one recorded whether anything was skipped."

## Monthly Summary

At end of each monthly file, maintain a running summary:

```markdown
## Monthly Summary — August 2026

| Metric | Total |
|--------|-------|
| Tasks processed | 47 |
| Anti-patterns caught | 23 |
| Security issues found | 8 |
| Scope deviations | 3 |
| Most common anti-pattern | god function (9x) |
| Most common security issue | missing validation (4x) |
| Average confidence | HIGH (78%), MEDIUM (19%), LOW (3%) |
| Docs generated | 12 FSD, 5 SDS, 3 PRD, 2 ERD |
```

## Mode Behavior

| Mode | Stats Behavior |
|------|---------------|
| **prototype** | Track minimally (files changed, security issues, and `gates_skipped` — the skip trail is cheap and applies even here). No footer. |
| **vibe** | Track everything. Show 1-line footer. Stats file updated silently. |
| **standard** | Track everything. Show 2-line footer. Stats file updated. |
| **strict** | Track everything with maximum detail. Show full stats in report. |
| **emergency** | Track what was fixed. Brief entry. |

## Index Update

After appending stats, update `docs/sdd/index.md` with:

```markdown
## Recent Activity
- [2026-08-17] Task: user-auth — 2 anti-patterns, 1 security issue → [stats](stats/2026-08.md)
```

Keep only last 10 entries in index. Full history lives in monthly files.

## Rules

1. **Never fabricate stats** — Only count what SDD Pipeline actually caught, not what might exist.
2. **Append-only per task** — Don't edit previous entries. Monthly summary recalculated.
3. **Stats are evidence** — They prove SDD Pipeline's value. Accuracy matters.
4. **No PII in stats** — Don't log file contents, just counts and types.
