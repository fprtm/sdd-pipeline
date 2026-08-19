# Example: Fixing a Bug with SDD Pipeline

This walkthrough shows SDD Pipeline in **standard mode** handling a bug fix.

## Scenario

User prompt: "Users are getting logged out randomly after about 15 minutes"

## What Happens

### 1. THINK Phase (lightweight)

**Orchestrator detects:**
- Mode: standard
- Size: small (bug fix, likely 1-3 files)
- Domain: web
- SDLC: scrum
- Architecture: layered

**Elicitation**: 0-1 questions (bug fix = auto-infer from context)
```
No questions needed. Error description is clear enough.
```

**Scope Guard**:
```
Scope: 1-3 files
IN: auth middleware, token handling, session config
OUT: everything else
```

**Complexity Analyzer**:
```
No hidden complexity flagged. Straightforward token/session debugging.
```

### 2. Plan Written

```markdown
# Plan: Fix Random Logout After 15 Minutes

**Mode**: standard | **Size**: small | **SDLC**: scrum

## Scope
- IN: auth middleware, token config
- OUT: user model, login flow
- Estimated: 1-2 files

## Approach
1. Read auth middleware and token configuration
2. Check token expiry settings
3. Check refresh token logic
4. Identify timing mismatch
5. Fix and verify

## Documents to Generate
- None (bug fix — report only)
```

User: "go"

### 3. BUILD Phase

**Context scan** finds the issue:
- `middleware/auth.js`: Access token expires in 15m ✅ (correct)
- `services/authService.js`: Refresh token logic has a race condition — when access token expires and two requests hit simultaneously, both try to refresh, second one fails with invalid token
- Root cause: no mutex/lock on refresh, no handling for concurrent refresh attempts

**Fix applied**:
- Add refresh token rotation with grace period (old refresh token valid for 30s after rotation)
- 1 file modified: `services/authService.js`

**Constraints**: ✅ minimal change, no scope creep
**Anti-patterns**: ✅ none introduced

### 4. PROVE Phase

**Verification**: Tests 14/14 ✅ (2 new tests added for concurrent refresh)
**Security**: Token handling still secure after fix ✅

### 5. Output

**Comprehension aid**:
```
Fixed race condition in token refresh. When two requests hit with expired
access token simultaneously, both tried to refresh — second failed.
Added 30s grace period for old refresh tokens during rotation.
Check: services/authService.js:47 — refreshToken function.
```

**Stats footer**:
```
SDD Pipeline: 0 anti-patterns | 0 security issues | 1 file changed | confidence: HIGH
```

## Key Takeaways

1. Bug fix = lightweight pipeline. 0 questions asked.
2. No docs generated — bug fix doesn't need FSD/SDD
3. Root cause identified and explained in comprehension aid
4. Tests added for the specific failure case
5. Minimal change — 1 file, surgical fix
