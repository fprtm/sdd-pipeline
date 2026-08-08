import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryShareRepo } from '../src/adapters/inMemoryShareRepo.ts';
import { InMemoryWishlistRepo } from '../src/adapters/inMemoryWishlistRepo.ts';
import { ShareService } from '../src/app/shareService.ts';
import { SharedViewService } from '../src/app/sharedViewService.ts';
import { AppError } from '../src/domain/errors.ts';
import { advancingClock, catalogWith } from './helpers.ts';

function setup() {
  const shareRepo = new InMemoryShareRepo();
  const wishlistRepo = new InMemoryWishlistRepo();
  const catalog = catalogWith([{ productId: 'P1', name: 'Nice Mug' }, { productId: 'P2' }]);
  const shareSvc = new ShareService(shareRepo, advancingClock());
  const view = new SharedViewService(shareRepo, wishlistRepo, catalog);
  return { shareRepo, wishlistRepo, catalog, shareSvc, view };
}

// TEST-009/018 — active token → read-only items
test('shared view returns items for an active token', async () => {
  const { wishlistRepo, shareSvc, view } = setup();
  await wishlistRepo.add('owner1', 'P1', new Date('2026-01-01T00:00:00Z'));
  const r = await shareSvc.createLink({ userId: 'owner1' });
  const res = await view.getByToken((r as { token: string }).token);
  assert.equal(res.items.length, 1);
  assert.equal(res.items[0].name, 'Nice Mug');
});

// TEST-025 — uniform NotFound for unknown vs revoked (SEC-002 / FSD-011)
test('TEST-025: unknown and revoked tokens both 404 identically', async () => {
  const { shareSvc, view } = setup();
  // unknown token
  let unknownErr: unknown;
  await view.getByToken('totally-unknown-token').catch((e) => (unknownErr = e));
  // revoked token
  const r = await shareSvc.createLink({ userId: 'owner1' });
  const token = (r as { token: string }).token;
  await shareSvc.revokeLink({ userId: 'owner1' });
  let revokedErr: unknown;
  await view.getByToken(token).catch((e) => (revokedErr = e));

  assert.ok(unknownErr instanceof AppError && revokedErr instanceof AppError);
  assert.equal((unknownErr as AppError).status, 404);
  assert.equal((revokedErr as AppError).status, 404);
  // Indistinguishable message — no leak of whether the token ever existed.
  assert.equal((unknownErr as AppError).message, (revokedErr as AppError).message);
});

// TEST-026 — the shared DTO exposes NO owner PII (SEC-005)
test('TEST-026: shared response contains no owner identity or timestamps', async () => {
  const { wishlistRepo, shareSvc, view } = setup();
  await wishlistRepo.add('owner1', 'P1', new Date('2026-01-01T00:00:00Z'));
  const r = await shareSvc.createLink({ userId: 'owner1' });
  const res = await view.getByToken((r as { token: string }).token);
  const json = JSON.stringify(res);
  assert.ok(!json.includes('owner1'), 'no userId leaked');
  assert.ok(!json.includes('savedAt'), 'no owner timestamp leaked');
  // whitelist: item keys are exactly the product-facing fields
  assert.deepEqual(
    Object.keys(res.items[0]).sort(),
    ['available', 'image', 'name', 'price', 'productId'],
  );
});

// shared view flags an archived/missing product as unavailable (SEC-005 + FSD-005)
test('shared view marks a missing product unavailable without leaking data', async () => {
  const { wishlistRepo, shareSvc, view } = setup();
  await wishlistRepo.add('owner1', 'GHOST', new Date('2026-01-01T00:00:00Z')); // not in catalog
  const r = await shareSvc.createLink({ userId: 'owner1' });
  const res = await view.getByToken((r as { token: string }).token);
  assert.equal(res.items[0].productId, 'GHOST');
  assert.equal(res.items[0].name, null);
  assert.equal(res.items[0].available, false);
});

// TEST-027 — the shared view is read-only (no mutators exist on the service)
test('TEST-027: shared view service exposes only a read method', () => {
  const view = setup().view;
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(view)).filter(
    (m) => m !== 'constructor',
  );
  assert.deepEqual(methods, ['getByToken']); // no add/remove/update
});
