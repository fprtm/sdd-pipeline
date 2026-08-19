# API Constraints

Apply when the project is a backend API (REST, GraphQL, RPC).

## Rules

### API1. Input Validation
- **RULE**: Every endpoint validates request body, params, query, and headers.
- **RATIONALE**: Unvalidated input is the root of injection, corruption, and crashes.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### API2. Rate Limiting
- **RULE**: Public and authenticated endpoints have rate limits.
- **RATIONALE**: Without limits, one bad actor can DoS your service.
- **OVERRIDE**: Internal-only APIs behind VPN/firewall.
- **CHECK**: mechanical

### API3. Pagination
- **RULE**: List endpoints return paginated results with a default limit.
- **RATIONALE**: Unbounded queries cause OOM and timeouts.
- **OVERRIDE**: Endpoints guaranteed to return small fixed-size results.
- **CHECK**: mechanical

### API4. Consistent Error Format
- **RULE**: Errors return consistent JSON structure: `{ error: { code, message, details? } }`.
- **RATIONALE**: Consumers need predictable error handling.
- **OVERRIDE**: Legacy API with established error format.
- **CHECK**: mechanical

### API5. Versioning Strategy
- **RULE**: API has a versioning strategy (URL prefix, header, or content negotiation).
- **RATIONALE**: Breaking changes without versioning break consumers.
- **OVERRIDE**: Internal APIs with coordinated deploys.
- **CHECK**: judgment

### API6. Idempotency
- **RULE**: POST endpoints that create resources should support idempotency keys.
- **RATIONALE**: Network retries should not create duplicates.
- **OVERRIDE**: Endpoints where duplicates are harmless or naturally deduplicated.
- **CHECK**: judgment

### API7. Authentication
- **RULE**: Sensitive endpoints require authentication. Use standard mechanisms (JWT, OAuth, API keys).
- **RATIONALE**: Unauthenticated access to sensitive data is a security incident.
- **OVERRIDE**: Intentionally public endpoints (health check, public data).
- **CHECK**: mechanical

### API8. Authorization
- **RULE**: Users can only access their own data. Implement resource-level authorization.
- **RATIONALE**: IDOR (Insecure Direct Object Reference) is a top-10 vulnerability.
- **OVERRIDE**: Admin endpoints with proper role checks.
- **CHECK**: judgment

### API9. CORS Configuration
- **RULE**: CORS allows only expected origins. No wildcard (`*`) on authenticated endpoints.
- **RATIONALE**: Overly permissive CORS enables cross-origin attacks.
- **OVERRIDE**: Public read-only APIs.
- **CHECK**: mechanical

### API10. No Sensitive Data in Logs
- **RULE**: Do not log passwords, tokens, credit card numbers, or PII.
- **RATIONALE**: Logs are often stored insecurely and accessed by many people.
- **OVERRIDE**: None.
- **CHECK**: mechanical
