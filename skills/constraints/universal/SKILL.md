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
- **RULE**: Every non-trivial new function gets tests **in the same change** — at least one positive case and, wherever the function can reject or fail, at least one negative case. The tests must be **executed and passing** before the change is reported done, and the project's coverage gate (default ≥80% line+branch) must actually be met, not projected.
- **RATIONALE**: Untested = unverified. Deferring the test to "the next ticket" is how the coverage target stays permanently one ticket away, and a positive-only suite proves the function works on the inputs its author already thought about — which is never where the bug is.
- **OVERRIDE**: User opts out explicitly (logged). *Not* overridable by mode alone — mode dials how loudly the result is narrated, not whether the tests ran.
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

### 11. Doc Comments Stay Short
- **RULE**: JSDoc/docstring/doc-comment on a function is 1-2 sentences — what it does, not how. A file-level comment at the top (what this file's scope is) is fine, also short. Never reference `docs/sdd/` artifacts (ticket IDs, FSD/SDS names, "implements TICKET-018") inside a doc comment.
- **RATIONALE**: The code and its identifiers already say *what*; a doc comment earns its place only by adding something non-obvious, briefly. Ticket/spec references belong in the commit message and traceability matrix — they rot in code (a ticket closes, the comment doesn't know) and clutter the one place a reader wants pure signal.
- **OVERRIDE**: A public library API may need a longer doc comment (params, return shape, example) if it's the only doc consumers see — still no `docs/sdd/` references.
- **CHECK**: mechanical (grep for TICKET-/FSD-/SDS- patterns inside comment blocks)
- **CHECK**: judgment
