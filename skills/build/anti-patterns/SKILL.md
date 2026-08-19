# Anti-Pattern Detector

Check generated code against known AI coding anti-patterns BEFORE presenting to the user.

## Process

1. Generate the code.
2. Scan against the anti-pattern list below.
3. Self-correct any detected patterns.
4. In standard/strict mode: note what was corrected.

## Anti-Pattern Database

### 1. God Function
- **DETECT**: Single function > 80 lines.
- **WHY**: Unreadable, untestable, unmaintainable.
- **FIX**: Split into focused sub-functions with clear names.
- **EXCEPTION**: One-time scripts, data migrations.

### 2. Deep Nesting
- **DETECT**: > 3 levels of if/for/try nesting.
- **WHY**: Hard to follow logic flow. Bug-prone.
- **FIX**: Use early returns, guard clauses, extract to functions.
- **EXCEPTION**: Complex validation logic that genuinely requires depth.

### 3. Magic Numbers
- **DETECT**: Unexplained numeric or string literals in logic.
- **WHY**: No one knows what `if (status === 3)` means in 6 months.
- **FIX**: Extract to named constants: `const STATUS_ACTIVE = 3`.
- **EXCEPTION**: Obvious values (0, 1, "", true) and array indices.

### 4. Copy-Paste Code
- **DETECT**: 3+ blocks with similar structure (>5 lines each).
- **WHY**: Bug fixes need to be applied N times. Easy to miss one.
- **FIX**: Extract shared logic into a function.
- **EXCEPTION**: Test setup code where repetition aids readability.

### 5. Hallucinated API
- **DETECT**: Calling functions, methods, or properties that don't exist in the library.
- **WHY**: Code compiles in your head but crashes at runtime.
- **FIX**: Verify against actual library documentation or type definitions.
- **EXCEPTION**: None. Always verify.

### 6. Wrong Architecture Scale
- **DETECT**: Microservices for a 3-page app. Redis for 100 records. Message queue for synchronous workflow. Repository pattern for 2 models. Apply the **deletion test** (`skills/think/arch-analyzer/`): if removing the abstraction makes the code simpler with no complexity resurfacing elsewhere, it wasn't earning its place. Apply the **1-adapter-hypothetical/2-adapter-real rule**: an interface with exactly one implementation is premature.
- **WHY**: Complexity should match the problem, not the AI's training bias.
- **FIX**: Match solution scale to problem scale. Wait for a second real implementation before introducing an interface.
- **EXCEPTION**: User explicitly specifies the architecture for known future scale.

### 7. Trivial Dependency
- **DETECT**: npm/pip package for something achievable in < 10 lines.
- **WHY**: Each dependency is an attack surface, a license, and a maintenance burden.
- **FIX**: Inline the functionality.
- **EXCEPTION**: The package handles edge cases you'd miss (e.g., date parsing across locales).

### 8. Missing Boundary Validation
- **DETECT**: API endpoint or CLI command accepting user input without any validation.
- **WHY**: First line of defense against injection, corruption, and crashes.
- **FIX**: Validate type, range, and format at system boundaries.
- **EXCEPTION**: Internal-only functions where caller guarantees input.

### 9. Hardcoded Secrets
- **DETECT**: API keys, passwords, tokens, connection strings in source code.
- **WHY**: Security breach waiting to happen.
- **FIX**: Use environment variables or secret management.
- **EXCEPTION**: None.

### 10. N+1 Queries
- **DETECT**: Loop that makes a database query per iteration.
- **WHY**: Performance degrades linearly with data size.
- **FIX**: Batch query with WHERE IN or JOIN.
- **EXCEPTION**: Intentional per-item processing with side effects.

### 11. Ignoring Existing Utilities
- **DETECT**: Re-implementing logic the project already has (date formatting, validation, API calls).
- **WHY**: Inconsistency and wasted effort.
- **FIX**: Use the existing utility.
- **EXCEPTION**: Existing utility is deprecated or buggy.

### 12. Over-Typing
- **DETECT**: Complex generic types with 3+ type parameters that add no safety beyond what simpler types provide.
- **WHY**: Type gymnastics hurt readability without preventing real bugs.
- **FIX**: Simplify to the least complex type that still catches errors.
- **EXCEPTION**: Library public APIs where generic flexibility is the feature.

## Context Matters

A pattern is only an anti-pattern IN CONTEXT. Factory pattern with 12 product types is appropriate. Factory pattern for creating one type of object is not. Always evaluate against the actual situation before flagging.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Check #5 (hallucinated API) and #9 (secrets) only |
| vibe | Auto-fix all silently |
| standard | Fix and note what changed |
| strict | Report each detection with explanation, fix after acknowledgment |
| emergency | Skip |
