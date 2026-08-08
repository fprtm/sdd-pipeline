import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryWishlistRepo } from '../src/adapters/inMemoryWishlistRepo.ts';
import { InMemoryShareRepo } from '../src/adapters/inMemoryShareRepo.ts';
import { ShareService } from '../src/app/shareService.ts';
import { SharedViewService } from '../src/app/sharedViewService.ts';
import { purgeUserData } from '../src/app/accountDeletion.ts';
import { AppError } from '../src/domain/errors.ts';
import { advancingClock, catalogWith } from './helpers.ts';

// TEST-010 — account deletion purges wishlist + share links; prior link 404s
test('TEST-010: deleting an account purges data and kills live share links', async () => {
  const wishlistRepo = new InMemoryWishlistRepo();
  const shareRepo = new InMemoryShareRepo();
  const shareSvc = new ShareService(shareRepo, advancingClock());
  const view = new SharedViewService(shareRepo, wishlistRepo, catalogWith([{ productId: 'P1' }]));

  await wishlistRepo.add('u1', 'P1', new Date('2026-01-01T00:00:00Z'));
  const r = await shareSvc.createLink({ userId: 'u1' });
  const token = (r as { token: string }).token;

  await purgeUserData('u1', wishlistRepo, shareRepo);

  assert.equal(await wishlistRepo.count('u1'), 0);
  await assert.rejects(
    () => view.getByToken(token),
    (e: unknown) => e instanceof AppError && e.status === 404,
  );
});
