# Performance Check

Detect performance anti-patterns in generated code. This is static analysis — detection, not profiling.

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

## Output Format

```
PERFORMANCE CHECK:
- [LIKELY ISSUE] N+1 query in getUserOrders() — line 42. FIX: batch query.
- [WORTH CHECKING] Unbounded array in processResults() — line 88. Check if data source is bounded.
- No issues detected in other areas.
```

## Mode Behavior

| Mode | Behavior |
|------|----------|
| prototype | Skip |
| vibe | Skip |
| standard | Detect and flag |
| strict | Detect, flag, require resolution before proceeding |
| emergency | Skip |
