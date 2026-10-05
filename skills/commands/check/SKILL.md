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

Before dispatch, inspect capabilities. With fresh contexts, use distinct actor
IDs for implementer, reviewer, and verifier; add an independent security
reviewer when sensitive surfaces are in scope. Reviewers only report defects,
the implementer fixes, and the reviewer re-checks. Without fresh contexts,
report `degraded independence` and explicit human-review items.

Both branches load `skills/meta/artifact-lifecycle/`. Verify flags completed
transient artifacts, stale active-index entries, missing goal contracts, and
mixed-responsibility documents. Audit reports legacy migration opportunities
separately and never rewrites them.

The user can force a branch explicitly: "check the whole codebase" → audit even if a diff exists; "check my last change" → verify. Ambiguous → state which branch was picked and why, in one line.

## Quality Contract adapter (when evidence exists)

If the feature has a canonical Quality Contract block, invoke its facade as a
thin adapter and retain the envelope unchanged in the report. It may reveal
parse/compatibility/drift findings, but this command must not upgrade a status,
claim a gateway dispatch, or manufacture authority. Existing checker behavior
is unchanged for legacy work without that block.

## What Each Branch Produces

**Verify branch** — `docs/sdd/reports/{date}-{slug}.md`: verdict, confidence level (HIGH/MEDIUM/LOW), judgment block (weakest point, hallucination-risk zones, security escalation), human-verify items, honest blind spots.

**Audit branch** — findings report categorized critical/warning/info with locations. Reports only — never auto-fixes; audit findings become tasks the user chooses to act on.

**Impact summary (always appended)** — a 1-3 line digest from `docs/sdd/stats/`, so every check ends with visibility into what SDD Pipeline has been catching over time. No separate command needed to see it.

## Workflow Navigation

Before closing, load `skills/meta/workflow-navigation/SKILL.md`. State whether
VERIFY or AUDIT ran and why. A failed verify recommends
`/sdd-pipeline:implement` with its finding; a wrong or unresolved decision
routes to `/sdd-pipeline:spec` revision instead. An audit never claims a fix:
recommend `/learn` or discussion first, and only offer discovery/spec after the
user chooses a change. A passing verify may stop for human review or an
explicit transfer; it never authorizes release or deployment. If required
evidence or a harness capability is unavailable, close `BLOCKED` with the exact
missing prerequisite rather than offering implementation. If evidence is
partial or an optional verifier is unavailable, close `DEGRADED`, name the
limitation, and offer remediation or human review. A clean AUDIT may stop; it
does not invent a finding.

## Full Behavior

See `skills/prove/verification/`, `skills/prove/judgment/`, `skills/meta/health-check/`, and `skills/meta/stats/` for the underlying mechanics.
