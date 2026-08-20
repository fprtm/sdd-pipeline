# Skill Composition Engine

Companion to `skills/orchestrator/SKILL.md` — the full gap-detection, recommendation, and conflict-resolution rules for composing SDD Pipeline with external skills.

## Gap Detection

| Task Signal | Missing Capability | Recommended Skill |
|-------------|-------------------|-------------------|
| UI styling, design, aesthetics, colors, layout | Aesthetic judgment | **Taste** or design system skill |
| TDD, test-first, red-green-refactor | Test-driven workflow | **mattpocock-skills:tdd** |
| Code review request | Structured code review | **mattpocock-skills:code-review** |
| Security audit, penetration testing | Deep security analysis | **security-guidance** |
| Live library docs needed, API reference | Up-to-date documentation | **context7** |
| E2E testing, browser automation, UI verification | Browser testing | **playwright** |
| Recurring style asks ("keep it terse", "less formal", "stop over-explaining") | Communication style | A persona skill (e.g. **Caveman** for terse) — no single default fits everyone; suggest, don't presume |

**Communication-style caveat**: a one-off "make this answer shorter" is just an instruction to follow, not a gap — only recommend a persona skill when the same style ask keeps recurring across tasks (the user is re-stating a preference the environment keeps forgetting). Unlike the other rows, there's no one obvious default skill; name the pattern and let the user pick.

## Recommendation Flow

1. Detect gap from task keywords/context
2. Check if skill is already installed (scan available commands/plugins)
3. If not installed, recommend with justification:

```
SDD Pipeline detects this task involves [UI styling] but no aesthetic skill is installed.

Recommended: Install **Taste** for design judgment.
- What it does: [brief description]
- Why it helps: [specific benefit for this task]
- Install: [install command]

Install now? (y/n)
```

4. If user approves: install the skill
5. If user declines: proceed without it, note in stats

## Conflict Resolution

When SDD Pipeline + external skills are both active:

| Domain | Who Wins |
|--------|----------|
| Security (XSS, CSRF, auth, secrets) | **SDD Pipeline wins** — always |
| Engineering constraints (YAGNI, scope, anti-patterns) | **SDD Pipeline wins** |
| Code architecture | **SDD Pipeline advises**, external skill can override |
| UI aesthetics, design, styling | **External skill wins** (Taste, etc.) |
| Test strategy | **External skill wins** (mattpocock TDD, etc.) |
| Communication style | **External skill wins** (Caveman, etc.) |

Rule: SDD Pipeline yields on aesthetics and workflow preferences. SDD Pipeline wins on safety and engineering correctness.
