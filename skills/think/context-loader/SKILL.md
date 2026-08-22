# Context Loader

Load project context before coding. Understand what exists, what conventions are followed, and what constraints apply.

## Loading Priority

Read context in this order. Stop when you have enough to work:

1. **CLAUDE.md / AGENTS.md** — project-level instructions. These ALWAYS override SDD Pipeline defaults.
2. **docs/ directory** — architecture docs, design docs, API docs, ADRs.
3. **docs/sdd/config.md** — SDD Pipeline project overrides and saved decisions. This file's mere existence (or any `docs/sdd/` content — `index.md`, `plans/`, `changes/`) is itself the signal that SDD Pipeline is active for this project — checked fresh at the start of every task, not just remembered from having triggered it earlier in the session. See `skills/orchestrator/SKILL.md`'s "Session Persistence" for why this repo-state check matters more than conversational memory.
4. **docs/sdd/memory/INDEX.md** — the project knowledge graph map: match the task to notes by their one-line hooks, open only those notes (never the whole vault).
5. **Code scan** — infer from existing code when documentation is absent.

## Code Scan (Bare Project Fallback)

When no documentation exists, scan:

- **File structure**: directory naming pattern (flat? domain-grouped? feature-grouped?)
- **Package manifest**: `package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml` → stack, dependencies
- **Entry points**: `main.ts`, `index.ts`, `app.py`, `main.go` → application type
- **Existing patterns**: import style, error handling, naming conventions (camelCase? snake_case?)
- **Test location**: `__tests__/`, `test/`, `*.test.ts`, `*_test.go` → test conventions
- **Config files**: `.eslintrc`, `tsconfig.json`, `.prettierrc` → code style

Output a brief summary:
```
Stack: [language + framework]
Structure: [how files are organized]
Conventions: [naming, patterns observed]
Test setup: [framework + location]
Notable: [anything unusual]
```

## Brownfield vs Greenfield

- **Brownfield** (existing code): identify and follow existing patterns. Do NOT introduce new conventions unless asked.
- **Greenfield** (empty/new project): note absence of conventions. Decisions will be made fresh during BUILD phase.

## Monorepo Handling

For monorepos with multiple packages/apps:
- Scope context to the RELEVANT package or app for this task.
- Do NOT read the entire monorepo — context window overflow risk.
- Read shared packages only if the task touches them.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Minimal: detect stack only |
| vibe | Auto-scan silently. No user interaction. |
| standard | Full scan. Report findings. |
| strict | Deep scan. Verify conventions with user. |
| emergency | Error-focused only. Read error logs, stack traces. |
