# Security Check

Domain-aware security checklist — the post-code PROVE-phase half of security. The design-phase half is `skills/think/threat-model/` (STRIDE, SEC-xxx controls); this checklist audits what the code actually does.

## Process

1. Detect domain from context-loader output.
2. Apply the relevant checklist below.
3. Mark each item: PASS / FAIL / NOT APPLICABLE.
4. **If a threat model exists** (`docs/sdd/design/*-threats.md`): cite the SEC-xxx each finding verifies or violates, and confirm every High/Critical control's mitigation is actually present in the code — a control that exists on paper but not in the diff is a FAIL, not an N/A.
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

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Check secrets (#5/C5/A8/L4/M4) only |
| vibe | Auto-check silently. Only alert user on CRITICAL findings. |
| standard | Full relevant checklist. Report all findings. |
| strict | Full checklist + recommend manual security review for production. |
| emergency | Critical items only (secrets, injection) |
