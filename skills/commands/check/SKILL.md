---
name: check
description: Adaptive QA — verifies a fresh change if one exists, audits the whole codebase otherwise, and always ends with a SDD Pipeline impact summary. One command, no need to know which internal mode applies.
disable-model-invocation: true
---

# /sdd-pipeline:check

The single QA entry point. Replaces the old `/sdd-pipeline:verify`, `/sdd-pipeline:audit`, and `/sdd-pipeline:measure` trio — users shouldn't need to learn the taxonomy of three different checking commands. Ask "check this" and SDD Pipeline figures out which kind of checking the situation calls for.

## How It Decides — Automatic

```
Is there a fresh change in play?
(uncommitted diff, a change made earlier this session, or the user points at one)
│
├─ YES → VERIFY that change
│         "Does this implementation satisfy its intended requirements?"
│         Runs: skills/prove/verification + adversarial + diagnose
│                + performance-check + report + judgment gate
│
└─ NO  → AUDIT the codebase
          "What problems exist here in general?"
          Runs: skills/meta/health-check — anti-patterns, security gaps,
          convention drift, missing tests, dependency health. Read-only.

Either way, END WITH the impact summary (skills/meta/stats):
  "SDD Pipeline this month: N anti-patterns caught, N security issues, N scope deviations prevented"
```

The user can force a branch explicitly: "check the whole codebase" → audit even if a diff exists; "check my last change" → verify. Ambiguous → state which branch was picked and why, in one line.

## What Each Branch Produces

**Verify branch** — `docs/sdd/reports/{date}-{slug}.md`: verdict, confidence level (HIGH/MEDIUM/LOW), judgment block (weakest point, hallucination-risk zones, security escalation), human-verify items, honest blind spots.

**Audit branch** — findings report categorized critical/warning/info with locations. Reports only — never auto-fixes; audit findings become tasks the user chooses to act on.

**Impact summary (always appended)** — a 1-3 line digest from `docs/sdd/stats/`, so every check ends with visibility into what SDD Pipeline has been catching over time. No separate command needed to see it.

## Full Behavior

See `skills/prove/verification/`, `skills/prove/judgment/`, `skills/meta/health-check/`, and `skills/meta/stats/` for the underlying mechanics.
