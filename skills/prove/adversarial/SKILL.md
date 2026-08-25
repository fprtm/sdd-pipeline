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

### 5. Permission / Authorization
- Access resource without authentication → assert 401 (not 500, not silent success)
- Access another user's data by swapping IDs in the URL/body (IDOR) → assert 403 (not the other user's data)
- Escalate privileges (user token on admin endpoint) → assert 403
- Expired/revoked token → assert 401 (not stale cached session)
- **Test every role the FSD defines**, not just "logged in" — if the FSD has admin/user/anonymous, test the boundaries between all three

### 6. Entity State
- Action on deleted/archived/cancelled entity → assert correct rejection (not 500)
- Action on expired entity (expired token, ended promo, past deadline) → assert correct error
- Action that requires prerequisite state (checkout without items, approve without submit) → assert rejection
- **Soft-deleted entity**: can it still be accessed? Updated? Re-activated? What does the FSD say?

### 7. Scale / Volume
- What happens with 0 records? (empty state handling)
- What happens with 10,000 records? (pagination, response time)
- What happens with deeply nested data?
- What happens at the exact boundary limit? (e.g., max 50 items in cart — test 50 and 51)

### 8. Concurrency / Timing
- Double-submit (click button twice fast, two identical API calls)
- Concurrent modifications to same resource by different users
- Race condition: two users claiming the last item
- Stale data: cached vs actual state after another user modifies

### 9. Environment
- Missing environment variables
- Wrong configuration values
- Network timeout/failure

## Rules

- Generate 5-8 tests for standard mode, 8-15+ for strict mode.
- Tests must be RUNNABLE, not theoretical descriptions — actual test code with assertions, not a list of "things to check."
- Do NOT generate tests for irrelevant categories (no SQL injection tests for a CLI tool).
- Focus on the categories most likely to reveal real bugs in THIS specific task.
- **Every test must name the specific behavior it expects** — "should handle gracefully" is not an assertion; "should return 403 with body `{error: 'forbidden'}`" is.

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip |
| vibe | Skip |
| standard | 5-8 targeted tests across the most relevant categories |
| strict | 8-15+ comprehensive tests, all relevant categories covered |
| emergency | Skip |
