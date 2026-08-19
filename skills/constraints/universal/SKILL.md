# Universal Constraints

Apply to ALL projects regardless of domain. These are loaded in addition to domain-specific constraints.

See `skills/build/constraints/SKILL.md` for the full constraint engine behavior. This file contains the universal rule definitions.

## Rules

### 1. YAGNI
- **RULE**: Do not add functionality, files, or abstractions not explicitly requested.
- **RATIONALE**: AI over-generates. Unrequested features are maintenance debt.
- **OVERRIDE**: User explicitly asks for additional functionality.
- **CHECK**: mechanical

### 2. Dependency Limit
- **RULE**: Max new dependencies — 3 (small task), 5 (medium), 10 (large).
- **RATIONALE**: Each dependency is attack surface + license + maintenance.
- **OVERRIDE**: Justify each dependency in one sentence.
- **CHECK**: mechanical

### 3. No Premature Abstraction
- **RULE**: No factories, strategies, repositories, or base classes without 3+ implementations.
- **RATIONALE**: AI defaults to enterprise patterns. Duplication is cheaper than wrong abstraction.
- **OVERRIDE**: Task explicitly requires extensibility.
- **CHECK**: judgment

### 4. Follow Existing Conventions
- **RULE**: Match the project's naming, structure, and patterns.
- **RATIONALE**: Consistency > personal preference.
- **OVERRIDE**: User asks to establish new conventions.
- **CHECK**: judgment

### 5. Simplest Viable Solution
- **RULE**: Fewest moving parts that solve the problem.
- **RATIONALE**: Maintenance cost scales with complexity.
- **OVERRIDE**: User specifies preferred approach.
- **CHECK**: judgment

### 6. No Scope Creep
- **RULE**: Only change what the task requires.
- **RATIONALE**: Unrequested changes increase risk and review burden.
- **OVERRIDE**: User asks for cleanup.
- **CHECK**: mechanical

### 7. No Hardcoded Secrets
- **RULE**: No API keys, passwords, tokens in source code. Ever.
- **RATIONALE**: Security. Non-negotiable.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### 8. Tests for New Logic
- **RULE**: Non-trivial new functions need at least 1 test.
- **RATIONALE**: Untested = unverified.
- **OVERRIDE**: Prototype mode or user opts out.
- **CHECK**: mechanical

### 9. No Dead Code
- **RULE**: Remove unused code. Don't comment it out.
- **RATIONALE**: Git preserves history. Commented code is noise.
- **OVERRIDE**: Temporary disable with TODO and timeline.
- **CHECK**: mechanical

### 10. Boundary Validation
- **RULE**: Validate at system edges. Trust internal code.
- **RATIONALE**: Over-defensive code is noisy. Real errors happen at boundaries.
- **OVERRIDE**: Internal code handles unpredictable data.
- **CHECK**: judgment
