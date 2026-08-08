import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, assertOwner } from '../src/app/access.ts';
import { AppError } from '../src/domain/errors.ts';

// TEST-011 — requireAuth rejects missing/invalid sessions (FSD-007)
test('requireAuth: rejects null/empty session with 401', () => {
  assert.throws(() => requireAuth(null), (e: unknown) => e instanceof AppError && e.status === 401);
  assert.throws(
    () => requireAuth({ userId: '' } as { userId: string }),
    (e: unknown) => e instanceof AppError && e.status === 401,
  );
  assert.equal(requireAuth({ userId: 'u1' }), 'u1');
});

// TEST-020 — IDOR: acting on another user's resource → 404 (SEC-001)
test('TEST-020: assertOwner returns 404 (not 403) for a non-owned resource', () => {
  assert.throws(
    () => assertOwner('userA', 'userB'),
    (e: unknown) => e instanceof AppError && e.status === 404,
  );
});

// TEST-021 — same guard protects the delete path
test('TEST-021: assertOwner passes silently when the caller owns the resource', () => {
  assert.doesNotThrow(() => assertOwner('userA', 'userA'));
});
