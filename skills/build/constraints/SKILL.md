# Constraints Engine

Default rules that prevent common AI coding failures. Every rule is a GUIDELINE with override — never a hard block.

## How Constraints Work

1. Load **universal constraints** (below).
2. Load **domain-specific constraints** from `skills/constraints/[domain]/SKILL.md`.
3. Load **project overrides** from `docs/sdd/config.md` if it exists.
4. **Project CLAUDE.md/AGENTS.md rules ALWAYS override SDD Pipeline defaults.**
5. Check constraints BEFORE implementation.
6. If violated during implementation: self-correct (vibe) or flag (standard/strict).

## Universal Constraints

### 1. YAGNI
- **RULE**: Do not add functionality, files, or abstractions that aren't explicitly requested.
- **RATIONALE**: AI agents tend to over-generate. Every unused feature is maintenance debt.
- **OVERRIDE**: User explicitly asks for the additional functionality.

### 2. Dependency Limit
- **RULE**: Max new dependencies per task — 3 (small), 5 (medium), 10 (large).
- **RATIONALE**: Dependency bloat increases attack surface, bundle size, and maintenance burden.
- **OVERRIDE**: List each dependency with one-sentence justification for why it can't be inlined.

### 3. No Premature Abstraction
- **RULE**: Do not create abstractions (factories, strategies, repositories, base classes) unless there are 3+ concrete implementations.
- **RATIONALE**: AI defaults to enterprise patterns. Three similar lines are better than a premature abstraction.
- **OVERRIDE**: Task explicitly requires extensibility or plugin architecture.

### 4. Follow Existing Conventions
- **RULE**: Match the project's naming, file structure, import style, error handling, and patterns.
- **RATIONALE**: Consistency matters more than "correctness." A codebase should look like one person wrote it.
- **OVERRIDE**: User explicitly asks to change conventions or establish new ones.

### 5. Simplest Viable Solution
- **RULE**: Choose the approach with fewest moving parts that solves the problem.
- **RATIONALE**: AI prefers impressive solutions over appropriate ones. Maintenance cost scales with complexity.
- **OVERRIDE**: User specifies a preferred approach, or the simpler approach has proven inadequacy.

### 6. No Scope Creep
- **RULE**: Only change what the task requires. Do not "improve" unrelated code.
- **RATIONALE**: Unrequested changes increase blast radius and review burden.
- **OVERRIDE**: User asks for cleanup, or the change is required for the task to work.

### 7. No Hardcoded Secrets
- **RULE**: Never put API keys, passwords, tokens, or credentials in source code.
- **RATIONALE**: Security. This is non-negotiable.
- **OVERRIDE**: None. This constraint cannot be overridden.

### 8. Tests for New Logic
- **RULE**: New functions with non-trivial logic need at least 1 test.
- **RATIONALE**: Untested code is unverified code.
- **OVERRIDE**: Prototype mode, or user explicitly opts out.

### 9. No Dead Code
- **RULE**: Remove unused code. Do not comment it out.
- **RATIONALE**: Commented-out code is noise. Git history preserves everything.
- **OVERRIDE**: Code is temporarily disabled with a TODO and timeline.

### 10. Error Handling at Boundaries
- **RULE**: Validate at system edges (user input, external APIs, file I/O). Trust internal code.
- **RATIONALE**: Over-defensive code is noisy and hard to read. Boundaries are where real errors occur.
- **OVERRIDE**: Internal code handles genuinely unpredictable data.

## Constraint Violation Behavior

| Mode | On Violation |
|------|-------------|
| prototype | Ignore (except #7 secrets) |
| vibe | Auto-correct silently |
| standard | Flag, explain rationale, self-correct |
| strict | Pause, explain, wait for approval |
| emergency | Ignore all |

## User Override Protocol

When user overrides a constraint:
1. Accept the override.
2. Log it in the decision log with the user's reason.
3. Save to project memory if it's a recurring preference.
4. Do NOT re-flag the same override in the same context.
