# Health Check

Retroactive codebase analysis. Scan existing code for quality issues against SDD Pipeline constraint sets.

## When to Run

- **Manual trigger**: user asks "run SDD Pipeline health check" or "check codebase health"
- **Suggested automatically**: after mode transition (e.g., prototype → standard)
- **Onboarding**: when starting work on an unfamiliar codebase

## What It Checks

Scan the codebase against the active constraint and anti-pattern sets:

1. Anti-patterns present in existing code (god functions, deep nesting, N+1 queries, etc.)
2. Security issues (hardcoded secrets, missing input validation, vulnerable dependencies)
3. Performance anti-patterns (O(n²), missing pagination, unbounded caches)
4. Convention inconsistencies (mixed naming styles, conflicting patterns)
5. Missing tests for critical paths
6. Dependency health (outdated, unused, or vulnerable packages)
7. **Docs-tree hygiene and lifecycle** — run the bundled mechanical checker (in this skill's folder; copy to `tools/` in the project):
   ```bash
   node tools/check-file-hygiene.mjs docs/sdd
   ```
   It enforces tree conventions and, when `artifact-policy-version: 1` is
   declared, goal contracts, completed-transient retirement, bounded active
   navigation, handoff structure, and actor separation. Repositories without
   that marker are legacy/read-only: report migration opportunities separately
   and never rewrite them during a health check.
8. **Traceability drift** — if `docs/sdd/traceability.md` exists, run `check-traceability.mjs` (see `skills/meta/traceability/`) as part of the scan.

## Output Format

```markdown
## SDD Pipeline Health Check — [date]

### Critical (fix now)
- [issue]: `file:line` — [description]

### Warning (fix soon)
- [issue]: `file:line` — [description]

### Info (consider)
- [issue]: `file:line` — [description]

### Summary
- Files scanned: [N]
- Critical: [N] | Warning: [N] | Info: [N]
- Overall: [GOOD / FAIR / NEEDS ATTENTION]
```

### Lifecycle Warnings

9. **Completed transient artifacts**: under policy v1, any done ticket, closed
   change, consumed handoff, resolved report, or verified deliberation ledger
   still in active navigation is a finding immediately—not only after an age or
   count threshold.
10. **Guarded retirement**: propose compact/retire only after a canonical
    outcome exists, live references are clear, and Git recovery is confirmed.
    Untracked or unrecoverable files are retained and reported.
11. **Archive policy**: archive is valid only when config declares it or an
    audit/compliance/no-Git constraint is recorded. Otherwise Git is history.
12. **Mixed responsibility**: flag documents combining design, progress diary,
    raw command output, runbook, and final report. Line count alone is not a
    defect.
13. **Misplaced audit reports**: warn on loose files in `docs/sdd/specs/`;
    cross-feature reports belong in `docs/sdd/reports/` while active.

### Cross-Reference Orphan Check

12. **Orphan ERD entities**: grep all `erd.md` files for entity names, then check whether each entity is cited by at least one `uc-*.md`, `fsd.md`, or `flow-*.md` in the same feature folder. An entity that nothing references is likely dead or undocumented — warn.
13. **Dangling references**: grep all spec files for `Refs:` lines, extract cited IDs (`FSD-xxx`, `UC-xxx-role`, `ADR-xxx`, `TICKET-xxx`, `SEC-xxx`), and verify each ID resolves to an existing file or heading. A cited ID that points nowhere is a broken link — warn.
14. **Unlinked flows**: grep `flow-*.md` and `seq-*.md` files for missing `Refs:` lines. Every flow/sequence document must cite at least one FSD or UC. A flow that cites nothing is disconnected from the spec — warn.
15. **Role index drift**: if `docs/sdd/roles/` exists, check that every `uc-{role}.md` and `flow-{role}.md` across all spec folders has a corresponding link in `roles/{role}.md`. A UC/flow that exists but isn't in the role index is invisible to role-based navigation — warn.

## Rules

1. Health check REPORTS only. It does NOT auto-fix.
2. Respect project overrides. If `docs/sdd/config.md` says "factory pattern OK", don't flag factories.
3. Prioritize findings by severity. Critical = security/data-loss risk. Warning = quality concern. Info = nice-to-have.
4. Keep output actionable. Each finding should be fixable.
