import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryWishlistRepo } from '../src/adapters/inMemoryWishlistRepo.ts';
import { WishlistService } from '../src/app/wishlistService.ts';
import { MAX_ITEMS } from '../src/domain/wishlist.ts';
import { AppError } from '../src/domain/errors.ts';
import { advancingClock, catalogWith } from './helpers.ts';

const SESSION = { userId: 'u1' };

function svc(opts: { catalog?: ReturnType<typeof catalogWith>; repo?: InMemoryWishlistRepo } = {}) {
  const repo = opts.repo ?? new InMemoryWishlistRepo();
  const catalog = opts.catalog ?? catalogWith([{ productId: 'P1' }, { productId: 'P2' }]);
  return { repo, catalog, service: new WishlistService(repo, catalog, advancingClock()) };
}

// TEST-001 — save persists (FSD-001)
test('TEST-001: saving a purchasable product persists it', async () => {
  const { service, repo } = svc();
  const r = await service.save(SESSION, { productId: 'P1' });
  assert.equal(r.state, 'saved');
  assert.equal(await repo.count('u1'), 1);
});

// TEST-002 — duplicate save is a no-op (FSD-002)
test('TEST-002: saving the same product twice does not duplicate', async () => {
  const { service, repo } = svc();
  await service.save(SESSION, { productId: 'P1' });
  const r = await service.save(SESSION, { productId: 'P1' });
  assert.equal(r.state, 'saved');
  assert.equal(await repo.count('u1'), 1);
});

// TEST-003 — cap rejects the 501st new item (FSD-003)
test('TEST-003: exceeding MAX_ITEMS is rejected with 409', async () => {
  const repo = new InMemoryWishlistRepo();
  const catalog = catalogWith(
    Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({ productId: `P${i}` })),
  );
  const { service } = svc({ repo, catalog });
  for (let i = 0; i < MAX_ITEMS; i++) await service.save(SESSION, { productId: `P${i}` });
  await assert.rejects(
    () => service.save(SESSION, { productId: `P${MAX_ITEMS}` }),
    (e: unknown) => e instanceof AppError && e.status === 409,
  );
  assert.equal(await repo.count('u1'), MAX_ITEMS);
});

// TEST-003b — re-saving an existing item while at the cap is still fine
test('TEST-003b: re-saving an existing item at the cap is allowed', async () => {
  const repo = new InMemoryWishlistRepo();
  const catalog = catalogWith(Array.from({ length: MAX_ITEMS }, (_, i) => ({ productId: `P${i}` })));
  const { service } = svc({ repo, catalog });
  for (let i = 0; i < MAX_ITEMS; i++) await service.save(SESSION, { productId: `P${i}` });
  const r = await service.save(SESSION, { productId: 'P0' }); // already present
  assert.equal(r.state, 'saved');
  assert.equal(await repo.count('u1'), MAX_ITEMS);
});

// TEST-004 — list newest-first with enrichment (FSD-004)
test('TEST-004: wishlist lists newest-first, enriched', async () => {
  const { service } = svc();
  await service.save(SESSION, { productId: 'P1' });
  await service.save(SESSION, { productId: 'P2' });
  const list = await service.listMine(SESSION);
  assert.deepEqual(list.map((i) => i.productId), ['P2', 'P1']); // newest first
  assert.equal(list[0].name, 'Product 2');
  assert.equal(list[0].available, true);
});

// TEST-005 — archived product shown as unavailable, not dropped (FSD-005)
test('TEST-005: archived product is flagged unavailable, not dropped', async () => {
  const repo = new InMemoryWishlistRepo();
  const catalog = catalogWith([{ productId: 'P1', status: 'active' }, { productId: 'P2', status: 'archived' }]);
  const { service } = svc({ repo, catalog });
  await service.save(SESSION, { productId: 'P1' });
  // Save P2 while active, then archive it:
  await repo.add('u1', 'P2', new Date('2026-02-01T00:00:00Z'));
  const list = await service.listMine(SESSION);
  const p2 = list.find((i) => i.productId === 'P2');
  assert.ok(p2, 'archived item still present');
  assert.equal(p2!.available, false);
});

// TEST-006 — remove item (FSD-006)
test('TEST-006: removing an item makes it disappear', async () => {
  const { service, repo } = svc();
  await service.save(SESSION, { productId: 'P1' });
  await service.remove(SESSION, 'P1');
  assert.equal(await repo.count('u1'), 0);
});

// TEST-006b — remove is idempotent
test('TEST-006b: removing a non-present item is a success no-op', async () => {
  const { service } = svc();
  await service.remove(SESSION, 'P-nope'); // must not throw
});

// TEST-034 — clear empties the caller's wishlist (CHANGE: clear-wishlist)
test('TEST-034: clearing the wishlist removes all of my items', async () => {
  const { service, repo } = svc();
  await service.save(SESSION, { productId: 'P1' });
  await service.save(SESSION, { productId: 'P2' });
  await service.clearMine(SESSION);
  assert.equal(await repo.count('u1'), 0);
  // idempotent: clearing an empty wishlist is a no-op success
  await service.clearMine(SESSION);
});

// TEST-035 — clear is owner-scoped (does not touch another user) (SEC-001)
test('TEST-035: clearing my wishlist does not affect another user', async () => {
  const { service, repo } = svc();
  await service.save(SESSION, { productId: 'P1' });
  await repo.add('u2', 'P2', new Date('2026-01-01T00:00:00Z'));
  await service.clearMine(SESSION);
  assert.equal(await repo.count('u1'), 0);
  assert.equal(await repo.count('u2'), 1); // untouched
});

// unauthenticated clear → 401
test('clearing without a session is 401', async () => {
  const { service } = svc();
  await assert.rejects(
    () => service.clearMine(null),
    (e: unknown) => e instanceof AppError && e.status === 401,
  );
});

// TEST-011 — not authenticated → 401 (FSD-001 error, FSD-007)
test('TEST-011: unauthenticated save is rejected 401', async () => {
  const { service } = svc();
  await assert.rejects(
    () => service.save(null, { productId: 'P1' }),
    (e: unknown) => e instanceof AppError && e.status === 401,
  );
});

// TEST-012 — archived/missing product → 422 (FSD-001 error)
test('TEST-012: saving an unavailable product is rejected 422', async () => {
  const { service } = svc();
  await assert.rejects(
    () => service.save(SESSION, { productId: 'GHOST' }),
    (e: unknown) => e instanceof AppError && e.status === 422,
  );
});

// TEST-013 — store write failure → 503, intent not lost (FSD-001 error)
test('TEST-013: a store write failure surfaces as 503', async () => {
  const { service, repo } = svc();
  repo.failNextWrite = true;
  await assert.rejects(
    () => service.save(SESSION, { productId: 'P1' }),
    (e: unknown) => e instanceof AppError && e.status === 503,
  );
});

// TEST-015 — empty wishlist (FSD-004 edge)
test('TEST-015: empty wishlist returns no items', async () => {
  const { service } = svc();
  assert.deepEqual(await service.listMine(SESSION), []);
});

// TEST-016 — catalog lookup fails for an item → placeholder, not dropped (FSD-004 edge)
test('TEST-016: a per-item catalog failure keeps the item with a placeholder', async () => {
  const repo = new InMemoryWishlistRepo();
  const catalog = catalogWith([{ productId: 'P1' }]);
  catalog.failFor.add('P1');
  const { service } = svc({ repo, catalog });
  await service.save({ userId: 'u1' }, { productId: 'P1' }).catch(() => {});
  await repo.add('u1', 'P1', new Date('2026-01-01T00:00:00Z')); // ensure present
  const list = await service.listMine(SESSION);
  assert.equal(list.length, 1);
  assert.equal(list[0].productId, 'P1');
  assert.equal(list[0].name, null); // enrichment failed → placeholder
  assert.equal(list[0].available, false);
});

// Contract validation (TICKET-003)
test('validation: missing productId is rejected 422', async () => {
  const { service } = svc();
  await assert.rejects(
    () => service.save(SESSION, {}),
    (e: unknown) => e instanceof AppError && e.status === 422,
  );
  await assert.rejects(
    () => service.save(SESSION, null),
    (e: unknown) => e instanceof AppError && e.status === 422,
  );
  await assert.rejects(
    () => service.save(SESSION, { productId: '   ' }),
    (e: unknown) => e instanceof AppError && e.status === 422,
  );
  await assert.rejects(
    () => service.save(SESSION, { productId: 'x'.repeat(201) }),
    (e: unknown) => e instanceof AppError && e.status === 422,
  );
});
