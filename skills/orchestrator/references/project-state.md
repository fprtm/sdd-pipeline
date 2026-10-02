# Orchestrator project-state policy

Read this reference only when activation state, repository adoption, artifact
placement, persistence, or lifecycle handling matters.

## Priority and overrides

Project `AGENTS.md`, `CLAUDE.md`, and config override SDD defaults. For an
overridable rule, state the concrete risk, comply after acceptance, and log the
override without repeated warnings. An `OVERRIDE: None` rule is a hard stop and
cannot be waived by user insistence, mode, or emergency. Emergency buys process
speed, never permission to introduce secrets or bypass another hard stop.

## Session persistence

SDD remains active for subsequent **coding** work after explicit invocation or
when repository state under `docs/sdd/` shows prior adoption. It never captures
non-coding work or pure discussion. Check repository state rather than relying
only on conversational memory, especially after compaction. Reuse settled
mode, domain, SDLC, architecture, and memory until a real signal changes.
`sdd off` disables orchestration for subsequent work.

Rapid iteration reduces narration and reuses settled answers; it does not
erase unresolved discovery seats or applicable evidence. Repeated task types
consult the memory index. Execution-guard owns stuck-loop escalation.

## Artifact placement

Read `docs/sdd/index.md` first. It should route a fresh agent to the goal,
trusted state, and next action within three entry documents.

```text
docs/sdd/
├── index.md                  active canonical navigation
├── config.md                 mode, SDLC, constraints, policy
├── memory/                   durable linked knowledge
├── glossary.md               canonical domain terms
├── traceability.md           large/full requirement spine
├── HANDOFF.md                replace-only resumable state
├── decisions/                rule-of-three ADRs
├── changes/                  one record per small/medium topic
├── reports/                  active verification and audits
├── specs/{NNN}-{slug}/       spec-first feature truth
│   ├── fsd.md / sds.md / prd.md / threats.md / ux.md / erd.md
│   ├── tests.md / dod.md
│   └── tickets/00-index.md and vertical-slice tickets
├── design-system/            project-wide visual truth
└── stats/                    monthly aggregate

docs/system/                  descriptive brownfield documentation only
```

`plans/` is retired but remains valid in existing repositories. Completed
transient artifacts retire through artifact-lifecycle rules; Git history is
the default recovery mechanism unless archive policy says otherwise. Run
`check-file-hygiene.mjs` after writing or renaming under `docs/sdd/`.

User-facing docs follow the user's language. Code identifiers, comments,
commit messages, and branch slugs remain English. SDD does not own aesthetics,
communication persona, deployment authority, spending authority, or ethical
judgment.
