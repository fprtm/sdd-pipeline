# Example: Building a Feature with SDD Pipeline

This walkthrough shows SDD Pipeline in **standard mode** handling a medium-sized feature request.

## Scenario

User prompt: "Add user authentication with JWT"

## What Happens

### 1. THINK Phase (parallel)

**Orchestrator detects:**
- Mode: standard (default)
- Size: medium (new feature, multiple files)
- Domain: web (Express.js detected)
- SDLC: scrum (Sprint labels in GitHub issues detected)
- Architecture: layered (controllers/, services/, models/ detected)

**Elicitation** asks 2-3 questions:
```
1. Email/password only, or also social login (Google, GitHub)?
2. Do you need role-based access control (admin/user), or just authenticated/not?
3. Session-based or stateless JWT?
```

**Scope Guard** estimates:
```
Scope: 8-12 files
IN: auth controller, user model, JWT middleware, auth routes, login/register endpoints
OUT: password reset, email verification, social login (unless requested)
```

**Complexity Analyzer** flags:
```
Hidden complexity: JWT refresh tokens, secure cookie handling, password hashing
Escalated from medium to medium-high
```

**Architecture Analyzer**:
```
Detected: Layered Architecture (HIGH confidence)
Recommendation: Auth logic in services/ layer, middleware in middleware/, routes in routes/
Consistent with existing patterns.
```

### 2. Plan Written

SDD Pipeline writes `docs/sdd/plans/current.md`:

```markdown
# Plan: User Authentication with JWT

**Mode**: standard | **Size**: medium | **SDLC**: scrum
**Architecture**: layered (existing)

## Scope
- IN: auth routes, controller, service, model, middleware, tests
- OUT: password reset, social login, email verification
- Estimated: 10 files (4 create, 6 modify)

## Approach
1. Create User model with bcrypt password hashing
2. Create auth service (register, login, verify token)
3. Create JWT middleware for protected routes
4. Create auth routes (POST /register, POST /login)
5. Add auth middleware to existing protected routes
6. Write unit + integration tests

## Documents to Generate
- FSD (functional spec)
- DoD (definition of done)
- Test plan

## Key Decisions
- bcrypt for hashing (industry standard, proven)
- Access + refresh token pattern (security best practice)
- JWT in httpOnly cookie (not localStorage — XSS protection)
```

User reviews and approves: "go"

### 3. BUILD Phase

**Doc Generator** creates:
- `docs/sdd/design/001-user-auth-fsd.md`
- `docs/sdd/dod/001-user-auth-dod.md`
- `docs/sdd/test-plans/001-user-auth-tests.md`

**Constraints** check during build:
- ✅ YAGNI: no unnecessary features
- ✅ No hardcoded secrets (JWT_SECRET from env)
- ✅ Boundary validation on email/password inputs
- ⚠️ Anti-pattern caught: password validation was >80 lines → split into validator

**Change Plan** tracks:
```
CREATE: models/User.js, services/authService.js, middleware/auth.js, routes/auth.js
MODIFY: routes/index.js, app.js, package.json (bcrypt, jsonwebtoken deps)
CREATE: tests/auth.test.js, tests/authService.test.js
```

### 4. PROVE Phase (parallel)

**Verification**: Types ✅ | Tests 12/12 ✅ | Lint ✅
**Adversarial**: 5 tests — SQL injection ✅, XSS in email ✅, expired token ✅, brute force ✅, missing fields ✅
**Security Check**: W1 (XSS) ✅, W2 (CSRF) ✅, A7 (auth) ✅, A8 (authz) ✅
**Performance**: No N+1, no blocking ops ✅

### 5. Output

**Comprehension aid**:
```
Built JWT authentication with register/login endpoints. Uses bcrypt for
password hashing, httpOnly cookies for token storage. Auth middleware
protects routes via req.user. Start reading: routes/auth.js → services/authService.js.
```

**Judgment gate** (`skills/prove/judgment/`) — runs after verification passes, before the task is considered done:
```
Weakest point: refresh-token rotation isn't covered by an adversarial test yet —
the 5 adversarial cases target the auth endpoints, not the token-refresh path.
Hallucination-risk zones: none flagged — bcrypt/JWT usage matches the project's
existing patterns rather than being invented fresh.
Security escalation: this change touches auth/session handling — automated
checks passed, but this is a category where AI-generated code statistically
fails most. Recommend a human skim of services/authService.js before merge.
Comprehension check: can you explain why login uses an httpOnly cookie instead
of returning the token in the response body?
```

**Decision logged**: `docs/sdd/decisions/005-jwt-auth-strategy.md`

**Stats footer**:
```
SDD Pipeline: 1 anti-pattern fixed, 0 security issues, 10 files changed
     Docs generated: FSD, DoD, test plan | Confidence: HIGH | 0 scope deviations
```

**Stats saved**: `docs/sdd/stats/2026-08.md`

**Index updated**: `docs/sdd/index.md` now links plan → FSD → decisions → report

## Key Takeaways

1. SDD Pipeline asked 2-3 questions, not 10 — adaptive elicitation
2. Plan was written BEFORE coding — user reviewed and approved
3. Architecture was respected — new code follows existing layered pattern
4. Docs were generated automatically — FSD, DoD, test plan
5. Anti-pattern was caught during build — auto-fixed
6. Security was verified — domain-aware checklist
7. Everything is linked — index.md connects all artifacts
8. Verification passing wasn't the end — the judgment gate named a real weak spot (refresh-token rotation untested) and flagged the auth-touching change for a human skim, even though every automated check was green
