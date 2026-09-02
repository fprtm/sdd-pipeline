# Diagnose

Single entry point for "something's wrong" — a bug report, an open ticket nobody's touched, a nagging feeling the implementation drifted from spec, or a security posture check. Default-on, read-only: nothing here installs a package or actively attempts an exploit — that's `skills/prove/pentest/`, invoked explicitly when diagnose finds something worth verifying with a live attempt.

Three things this skill does, run whichever apply to what's actually being asked:

## 1. Gap / Orphan Check

Is there dangling work nobody's tracking? Run the mechanical checkers and summarize in plain language, not raw tool output:
- `check-file-hygiene.mjs` and `check-traceability.mjs` (`skills/meta/traceability/`) — tree drift, orphaned docs, ID spine gaps.
- Ticket status board (`check-parallel-safety.mjs --board`, `skills/agents/parallel-work/`) — tickets stuck in 🔨 or 🧪 past a reasonable session, blockers nobody resolved.
- Traceability matrix rows still 🟡/🔴 for a feature reported as "done".

## 2. Bug Root-Cause Trace

Given a bug report, find *where* behavior diverged from what was actually specified — don't start reading code blind:
1. Find the feature's spec folder (Number-First Lookup if the number's known, else search `index.md`/glossary for the feature name — never re-derive a slug and create a second folder).
2. Read the relevant ticket's `Acceptance Criteria` (Given/When/Then) and `fsd.md`'s described behavior — this is the contract the code was supposed to meet.
3. Compare actual behavior (reported symptom, or reproduce it) against that contract line by line. The divergence point *is* the root cause — not a guess from skimming the implementation.
4. If no spec/ticket exists for this behavior at all, say so explicitly — that's itself a finding ("this was never specified, the bug is really a spec gap").

## 3. Security Posture Check (Passive)

**Checklist audit** (domain-aware static review of the code) and **executable security test verification** (run the test plan's security cases and confirm mitigations work mechanically) — both passive, no active exploitation. The design-phase half is `skills/think/threat-model/` (STRIDE, SEC-xxx controls); this half audits what the code actually does and verifies the tests actually prove it. If this check surfaces something that needs a live attempt to confirm (not just static review), hand off to `skills/prove/pentest/` explicitly — don't attempt it here.

## Process

1. Detect domain from context-loader output.
2. Apply the relevant checklist below — mark each item: PASS / FAIL / NOT APPLICABLE.
3. **If a threat model exists** (`docs/sdd/specs/{NNN}-{slug}/threats.md`): cite the SEC-xxx each finding verifies or violates, and confirm every High/Critical control's mitigation is actually present in the code — a control that exists on paper but not in the diff is a FAIL, not an N/A.
4. **Run executable security tests** from the test plan (class: security). A SEC control with a passing test is stronger evidence than a checklist PASS. A SEC control with NO test is a gap — flag it even if the checklist passes.
5. Critical failures block in strict mode; flag in standard mode.

## Web Security Checklist

| # | Check | How to Verify |
|---|-------|---------------|
| W1 | XSS prevention | User input escaped before rendering. No raw `innerHTML` with user data. |
| W2 | CSRF protection | State-changing endpoints use CSRF tokens or SameSite cookies. |
| W3 | Auth security | Passwords hashed with bcrypt/argon2 (cost >= 10). Tokens have expiry. |
| W4 | Security headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options set. |
| W5 | No hardcoded secrets | No API keys, tokens, passwords in source or git history. |
| W6 | Dependency safety | No known vulnerable packages (check lock file if possible). |
| W7 | HTTPS only | No mixed content. Secure cookies. |
| W8 | Input validation | All form inputs validated server-side, not just client-side. |

## CLI Security Checklist

| # | Check | How to Verify |
|---|-------|---------------|
| C1 | Path traversal | File paths from user input sanitized. No `..` escape. |
| C2 | Command injection | Shell commands use parameterized execution, not string concat. |
| C3 | Minimum permissions | Tool requests only necessary file/network permissions. |
| C4 | Credential storage | Secrets use system keyring or env vars, not plaintext config. |
| C5 | No hardcoded secrets | Same as W5. |

## API Security Checklist

| # | Check | How to Verify |
|---|-------|---------------|
| A1 | Input validation | All endpoints validate request body/params/query. |
| A2 | Rate limiting | Endpoints protected against abuse. |
| A3 | Authentication | Sensitive endpoints require auth. |
| A4 | Authorization | Users can only access their own data. IDOR prevention. |
| A5 | SQL injection | Parameterized queries used. No string concatenation in SQL. |
| A6 | Data exposure | Responses don't leak internal IDs, stack traces, or debug info. |
| A7 | CORS | Configured correctly for expected origins only. |
| A8 | No hardcoded secrets | Same as W5. |

## Library Security Checklist

| # | Check | How to Verify |
|---|-------|---------------|
| L1 | Minimal dependencies | Supply chain attack surface minimized. |
| L2 | Input validation | Public API validates inputs at boundary. |
| L3 | No side effects | Library doesn't access filesystem, network, or env unexpectedly. |
| L4 | No hardcoded secrets | Same as W5. |

## Mobile Security Checklist

| # | Check | How to Verify |
|---|-------|---------------|
| M1 | Data at rest | Sensitive data encrypted in storage. |
| M2 | Network security | TLS enforced. Certificate pinning for sensitive APIs. |
| M3 | Minimum permissions | Only necessary platform permissions requested. |
| M4 | No hardcoded secrets | Same as W5. |

## Executable Security Test Verification

If the test plan includes security test cases (class: security — see `skills/build/test-plan/`), run them and verify each SEC control has a passing test.

### What to Verify

For each High/Critical SEC-xxx control:

1. **Does a test exist?** A control without a test is a claim without evidence — flag it.
2. **Does the test actually exercise the attack?** A test that only proves "authorized user succeeds" doesn't prove "unauthorized user is blocked." The test must attempt the attack (unauthenticated request, IDOR attempt, injection payload) and assert it fails correctly (right error code, no data leak, no 500).
3. **Did the test pass?** Report actual test output, not what the code looks like.

### Report Format

Append to the checklist output:

```
SECURITY TESTS:
- SEC-012 (IDOR prevention): TEST-050 PASS — user A cannot access user B's orders (403)
- SEC-015 (rate limiting): TEST-055 PASS — 429 after 100 requests/minute
- SEC-008 (input sanitization): NO TEST — checklist PASS but no executable proof [GAP]
- SEC-003 (auth required): TEST-048 PASS — unauthenticated → 401
```

**A checklist PASS without a test is weaker than a checklist PASS with a passing test.** Both count, but the gap should be visible.

## Mode Behavior

| Mode | Checklist | Executable security tests |
|------|-----------|--------------------------|
| prototype | Check secrets only | Skip |
| vibe | Auto-check silently, CRITICAL only | Run if tests exist; report silently on PASS, surface on FAIL |
| standard | Full relevant checklist. Report all findings. | Run all security tests; report results; flag SEC controls without tests |
| strict | Full checklist + recommend manual security review | Run all; require all PASS; flag untested controls as blocking gaps |
| emergency | Critical items only (secrets, injection) | Run critical-path security tests only |
