# Artifact Lifecycle — Keep the Active State Bounded

Use this whenever SDD artifacts are created, indexed, completed, superseded, or
handed off. `docs/sdd/` is working state, not a conversation log.

## Classes

| Class | Meaning | Default treatment |
|---|---|---|
| `canonical` | Current truth used by later work | Keep and update in place |
| `active` | Needed to complete current work | Keep until closure |
| `transient` | Intermediate reasoning or execution state | Compact, then retire |
| `historical` | Evidence required beyond Git history | Keep only by policy |

Accepted ADRs, current behavior specs, config, and glossary are normally
canonical. Open change records and tickets are active. Handoffs, progress
diaries, raw investigations, and command dumps are transient.

## Default Budget

- micro: no persistent artifact unless needed for safety or recovery
- small: one active change record
- medium: at most three entry documents
- large: extra files only for a distinct consumer, lifecycle, reviewer, or
  independently executable owner

Large work may set `active-entry-budget` above three in config only together
with `active-entry-budget-reason`; the reason must name that distinct consumer,
lifecycle, reviewer, or owner.

Line count is only a warning signal. Split by responsibility or lifecycle,
never merely to make a file shorter.

## Guarded Retirement

Default retention is `git-history`. Before removing a transient artifact:

1. Confirm its durable outcome exists in a canonical artifact or code.
2. Confirm no live reference depends on it.
3. Confirm Git can recover it. If it is untracked or otherwise unrecoverable,
   do not delete it.
4. Remove it from active navigation.
5. Retire it and run file-hygiene plus traceability checks.

Preview the safety decision before removal; this command never mutates files:

```bash
node tools/check-retirement.mjs <repo-root> <transient-path> <canonical-path>
```

`SAFE TO RETIRE` means the canonical outcome exists, no Markdown link still
targets the transient artifact, and committed Git history can recover it.
`ARCHIVE REQUIRED` is also non-zero: explicit archive retention applies, but
preservation must happen before removal. `BLOCKED` is non-zero and retirement
must stop.

Archive only when `artifact-retention` is `archive`, the repository has an
explicit audit/compliance requirement, or Git is unavailable. Never create an
append-only recent-activity section in `index.md`.

## Compatibility

The strict lifecycle contract is opt-in through
`artifact-policy-version: 1` in `docs/sdd/config.md`. Older repositories remain
legacy/read-only until work is explicitly reactivated or a previewed migration
is approved. A migration reports keep/compact/retire proposals before writing;
it never mutates consumer repositories during discovery or audit.
