# Adversarial Testing

Generate tests that try to BREAK the code. Think like an attacker and an edge-case explorer.

## Test Categories

Generate tests from these categories, picking only those RELEVANT to the task:

### 1. Boundary
- Empty input, null, undefined
- Maximum length strings
- Zero, negative numbers, Number.MAX_SAFE_INTEGER
- Empty arrays, single-element arrays
- Unicode, emoji, RTL text

### 2. Injection (web/API only)
- SQL injection: `'; DROP TABLE users; --`
- XSS: `<script>alert('xss')</script>`
- Command injection: `; rm -rf /`
- Path traversal: `../../etc/passwd`

### 3. State
- Double-submit (click button twice fast)
- Concurrent modifications to same resource
- Stale data (cached vs actual)
- Out-of-order operations

### 4. Type Confusion
- String where number expected
- Array where object expected
- Wrong date formats
- Mixed encodings

### 5. Permission
- Access resource without authentication
- Access another user's data
- Escalate privileges (user acting as admin)

### 6. Scale
- What happens with 0 records?
- What happens with 10,000 records?
- What happens with deeply nested data?

### 7. Environment
- Missing environment variables
- Wrong configuration values
- Network timeout/failure

## Rules

- Generate 3-5 tests for standard mode, 5-10+ for strict mode.
- Tests must be RUNNABLE, not theoretical descriptions.
- Do NOT generate tests for irrelevant categories (no SQL injection tests for a CLI tool).
- Focus on the categories most likely to reveal real bugs in THIS specific task.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip |
| vibe | Skip |
| standard | 3-5 targeted tests |
| strict | 5-10+ comprehensive tests |
| emergency | Skip |
