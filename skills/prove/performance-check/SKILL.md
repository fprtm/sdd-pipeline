# Performance Check

Two layers: **static pattern detection** (scan code for anti-patterns) and **executable performance verification** (run the test plan's performance cases and check actual measurements).

## Patterns to Detect

### 1. O(n²) or Worse
- **DETECT**: Nested loops over same or related data.
- **IMPACT**: Processing time grows quadratically. Breaks at scale.
- **FIX**: Sort + single pass, hash map lookup, or pre-indexing.
- **SEVERITY**: LIKELY ISSUE if data can grow > 100 items.

### 2. N+1 Queries
- **DETECT**: Loop that makes a database query per iteration.
- **IMPACT**: 1000 items = 1001 queries. Database connection exhaustion.
- **FIX**: Batch query with WHERE IN, JOIN, or eager loading.
- **SEVERITY**: LIKELY ISSUE for any loop over DB results.

### 3. Missing Pagination
- **DETECT**: Endpoint returning unbounded result set (no LIMIT, no cursor).
- **IMPACT**: One large dataset = OOM or timeout.
- **FIX**: Add limit/offset or cursor-based pagination. Default limit.
- **SEVERITY**: LIKELY ISSUE for any list/search endpoint.

### 4. Memory Accumulation
- **DETECT**: Array or object growing in a loop without bounds.
- **IMPACT**: Memory grows linearly with data. OOM for large datasets.
- **FIX**: Stream processing, chunking, or bounded buffer.
- **SEVERITY**: WORTH CHECKING if data source is unbounded.

### 5. Synchronous Blocking
- **DETECT**: Heavy computation on main thread (Node.js event loop, UI thread).
- **IMPACT**: UI freezes, server stops responding.
- **FIX**: Worker threads, async processing, or web workers.
- **SEVERITY**: LIKELY ISSUE for computation-heavy tasks.

### 6. Redundant Computation
- **DETECT**: Same expensive calculation repeated in a loop or across renders.
- **IMPACT**: Wasted CPU cycles.
- **FIX**: Memoization, useMemo/useCallback, or caching.
- **SEVERITY**: WORTH CHECKING for expensive operations.

### 7. Large Bundle Imports
- **DETECT**: Importing entire library when only one function is needed.
- **IMPACT**: Bundle size bloat, slower load times.
- **FIX**: Named import or tree-shakeable import.
- **SEVERITY**: WORTH CHECKING for frontend code.

### 8. Missing Database Indexes
- **DETECT**: Queries filtering/sorting on columns without declared indexes.
- **IMPACT**: Full table scan. Slow queries at scale.
- **FIX**: Add index on frequently queried columns.
- **SEVERITY**: LIKELY ISSUE for columns used in WHERE or ORDER BY.

### 9. Unbounded Cache
- **DETECT**: Cache (Map, object, in-memory store) that grows without eviction.
- **IMPACT**: Memory leak over time.
- **FIX**: LRU cache or TTL-based eviction.
- **SEVERITY**: WORTH CHECKING for any in-memory cache.

### 10. Missing Connection Pooling
- **DETECT**: Creating new database connection per request.
- **IMPACT**: Connection exhaustion under load.
- **FIX**: Use connection pool.
- **SEVERITY**: LIKELY ISSUE for any multi-request server.

## Output Format — Static Scan

```
PERFORMANCE CHECK — STATIC:
- [LIKELY ISSUE] N+1 query in getUserOrders() — line 42. FIX: batch query.
- [WORTH CHECKING] Unbounded array in processResults() — line 88. Check if data source is bounded.
- No issues detected in other areas.
```

## Layer 2 — Executable Performance Verification

If the test plan includes performance test cases (class: performance), run them and verify actual measurements. This is not static analysis — this is running test code that measures real response times, query counts, and memory usage.

### What to Verify

1. **Response time assertions** — run the performance test, check p95 is under the REQ-NF threshold (default 200ms for API, 3s for page load). Report the actual measured value.
2. **Query count assertions** — count actual DB queries during a list/search operation with realistic data. Report the number. N items triggering N+K queries (where K > 2-3) is a flag.
3. **Memory assertions** — if the test plan includes a memory test, run it and check heap stays bounded.
4. **Concurrent load** — if tested, report whether responses stayed within threshold under parallel load.

### How to Run

Use the same LOCAL-only test environment as verification (`skills/prove/verification/`). Performance tests use seeded data — the seed must be part of the test setup, not dependent on manual DB state.

The performance test report appends to the static scan:

```
PERFORMANCE CHECK — EXECUTABLE:
- [PASS] GET /api/orders p95=45ms (target <200ms) — 500 seeded records, 50 runs
- [FAIL] GET /api/products/search p95=890ms (target <200ms) — missing index on `name` column
- [PASS] List orders query count: 2 (list + count) for 500 records — no N+1
- [SKIP] Memory test — no REQ-NF memory target defined
```

**A static scan that passes while the executable test fails is not a pass.** The static scan catches patterns; the executable test proves actual performance. Both are needed.

## Mode Behavior

| Mode | Static scan | Executable tests |
|------|-------------|------------------|
| prototype | Skip | Skip |
| vibe | Skip | Skip |
| standard | Detect and flag | Run if test plan has performance cases; report results |
| strict | Detect, flag, require resolution | Run and require all PASS before proceeding |
| emergency | Skip | Skip |
