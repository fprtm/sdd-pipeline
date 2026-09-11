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
7. **Docs-tree hygiene** — run the bundled mechanical checker (in this skill's folder; copy to `tools/` in the project):
   ```bash
   node tools/check-file-hygiene.mjs docs/sdd
   ```
   It enforces the docs/sdd tree conventions (naming per directory, changes/ frontmatter, no stray files, no orphan docs missing from index.md). Instructions in markdown are followed probabilistically — this catches what got missed mechanically. Also run it right after writing/renaming anything under docs/sdd, not only during a health check; treat a non-zero exit as a real defect.
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

### Staleness Warnings

9. **Stale done tickets**: warn if >5 tickets with `done`/`✅` status exist outside an `archive/` directory.
10. **Old change files**: warn if any `changes/*.md` with `status: done` is older than 14 days (check the `updated:` frontmatter date against today).
11. **Report accumulation**: warn if >2 verification reports exist for the same feature spec number.

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
