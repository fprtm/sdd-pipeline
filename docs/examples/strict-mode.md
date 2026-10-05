# Example: Strict Mode for Production Code

This walkthrough shows SDD Pipeline in **strict mode** handling a payment-related change.

## Scenario

User prompt: "Add refund functionality to the payment system. This is production code."

## What Happens

### 1. THINK Phase (maximum depth)

**Orchestrator detects:**
- Mode: strict (user said "production code" + payment domain)
- Size: medium-large (payment system modification)
- Domain: api
- SDLC: scrum (Sprint-23 detected)
- Architecture: modular monolith (modules/ structure detected)

**Elicitation** asks 5+ questions with formal confirmation:
```
1. Full refund only, or partial refund support too?
2. Who can initiate refunds? (Admin only, or customer self-service?)
3. Refund window? (30 days? Unlimited? Configurable?)
4. What happens to inventory on refund? (Restock automatically?)
5. Stripe refund or custom refund logic?
6. Do you need refund reason tracking for analytics?

Please confirm understanding before I proceed:
- Full + partial refunds via Stripe
- Admin-only initiation
- 30-day window, configurable
- Auto-restock on full refund
- Reason tracking: yes

Correct? (yes/no/modify)
```

User confirms: "yes"

**Architecture Analyzer**:
```
Current: payments/ module with Stripe integration
Impact: Modifying payment service + adding refund endpoints
Consistency: ✅ Follows existing module pattern
Warning: Refund logic must handle Stripe webhook for async refund completion
```

### 2. Plan Written — APPROVAL REQUIRED

```markdown
# Plan: Payment Refund Functionality

**Mode**: STRICT | **Size**: medium-large | **SDLC**: scrum (Sprint-23)
**Architecture**: modular monolith — payments module

## Scope
- IN: payment service, refund model, refund routes, Stripe refund API, webhook handler
- OUT: customer-facing refund UI, email notifications, accounting integration
- Estimated: 8-10 files (5 create, 3-5 modify)

## Approach
1. Create Refund model (id, order_id, amount, reason, status, stripe_refund_id)
2. Add refund methods to PaymentService (initiate, process, complete)
3. Create refund API endpoints (POST /orders/:id/refund, GET /refunds)
4. Update Stripe webhook handler for refund.succeeded/refund.failed events
5. Add inventory restock logic on full refund completion
6. Idempotency key for refund requests (prevent double refund)

## Documents to Generate
- FSD, SDS, ERD update, DoD, Test Plan

## Key Decisions
- Stripe Refund API (not manual balance adjustment) — auditable, reversible
- Async completion via webhook (not synchronous) — Stripe recommends this
- Idempotency key per refund request — prevents accidental double refund
- Soft-delete approach for refund records — never lose financial data

## Risks
- Double refund if idempotency not implemented correctly
- Race condition: refund + new order on same inventory item
- Stripe webhook delivery failure: need retry/fallback logic
```

SDD Pipeline pauses and waits:
```
Tickets written to docs/sdd/specs/002-payment-refund/tickets/ — 4 tickets, starting with TICKET-018.

⚠️ STRICT MODE: Please review the breakdown carefully.
- Scope is correct?
- Architecture approach is acceptable?
- Key decisions align with your requirements?
- Risks acknowledged?

Approve? (yes/no/modify)
```

User: "approved"

### 3. BUILD Phase — With Checkpoints

**Doc Generator** creates full suite, all inside `docs/sdd/specs/002-payment-refund/`:
- `fsd.md`
- `sds.md`
- `erd.md` (ERD update with Refund entity)
- `dod.md`
- `tests.md`

**Strict checkpoint 1** (before writing code):
```
FSD and SDS generated. Please review:
- docs/sdd/specs/002-payment-refund/fsd.md
- docs/sdd/specs/002-payment-refund/sds.md

Proceed with implementation? (yes/no/modify)
```

User: "yes"

**During build, checkpoint at each major decision**:
```
Checkpoint: I'm about to create the Refund model.

  model Refund {
    id, order_id, amount, reason, status, stripe_refund_id, created_at
  }

  - Status enum: PENDING → PROCESSING → COMPLETED → FAILED
  - Indexed on: order_id, status, created_at
  - Cascade: none (refund records always preserved)

Proceed? (yes/no/modify)
```

**Constraints enforced**:
- ✅ No hardcoded Stripe keys (from env)
- ✅ Input validation on refund amount (> 0, ≤ order total)
- ✅ Idempotency key implemented
- ✅ No N+1 queries
- ⚠️ Anti-pattern caught: refund handler was 95 lines → split into initiateRefund + processRefund + completeRefund

### 4. PROVE Phase (comprehensive)

**Verification**: Types ✅ | Tests 24/24 ✅ | Lint ✅ | Spec conformance ✅
**Adversarial** (8 tests):
- Double refund attempt ✅ (idempotency blocks)
- Refund > order amount ✅ (validation rejects)
- Refund on already-refunded order ✅ (status check)
- Webhook replay attack ✅ (idempotency)
- Concurrent refund + purchase on same item ✅ (transaction isolation)
- Refund after 30-day window ✅ (time check)
- Invalid Stripe refund ID ✅ (error handling)
- Partial refund math edge case ✅ (cents rounding)

**Security Check** (full API checklist):
- A1 Input validation ✅
- A2 Rate limiting ✅ (max 3 refund attempts per order per hour)
- A7 Auth ✅ (admin-only endpoint)
- A8 Authz ✅ (admin role check)
- A10 No sensitive data in logs ✅

**Performance**: No O(n²), no N+1, indexed queries ✅

### 5. Output

**Full report** (strict mode = detailed):
```
## Verification Report: Payment Refund

**Verdict**: PASS
**Confidence**: HIGH

### Checks Run
- Type safety: ✅ PASS
- Tests: 24/24 ✅ PASS (18 existing + 6 new)
- Lint: ✅ PASS
- Adversarial: 8/8 ✅ PASS
- Security: 5/5 relevant checks ✅ PASS
- Performance: ✅ No issues

### Human-Verify Items
1. Verify Stripe test mode refund works end-to-end in staging
2. Confirm webhook endpoint is registered in Stripe dashboard
3. Load test concurrent refund scenario with real Stripe test API

### Blind Spots
- Stripe API behavior during outage (can't test without Stripe down)
- Actual webhook delivery timing (varies by Stripe)

### Key Decisions (audit trail)
- Decision #012: Stripe Refund API over manual balance → auditable
- Decision #013: Async webhook completion → Stripe best practice
- Decision #014: Idempotency key per request → prevents double refund

### Files Changed
CREATE: models/Refund.js, services/refundService.js, routes/refund.js,
        tests/refund.test.js, tests/refundService.test.js, migrations/add-refunds.js
MODIFY: services/paymentService.js, routes/index.js, webhooks/stripe.js
```

**Decisions logged**: 3 entries in `docs/sdd/decisions/`
**Stats**: Full detail in `docs/sdd/stats/2026-08.md`

## Key Takeaways

1. Strict mode = every decision has a checkpoint
2. Plan MUST be approved before build starts
3. Full document suite generated and reviewed
4. 8 adversarial tests — not just happy path
5. Complete audit trail in decision log
6. Human-verify items are actionable — not vague "test everything"
7. Blind spots explicitly stated — honest about what can't be verified
