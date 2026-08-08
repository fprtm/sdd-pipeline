import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryShareRepo } from '../src/adapters/inMemoryShareRepo.ts';
import { ShareService } from '../src/app/shareService.ts';
import { resolveActiveShare } from '../src/domain/sharing.ts';
import { hashToken, TOKEN_BYTES } from '../src/lib/token.ts';
import { AppError } from '../src/domain/errors.ts';
import { advancingClock } from './helpers.ts';

const SESSION = { userId: 'owner1' };

function make() {
  const repo = new InMemoryShareRepo();
  return { repo, service: new ShareService(repo, advancingClock()) };
}

// TEST-007 — create is idempotent: one active link per wishlist (FSD-008)
test('TEST-007: creating a link twice does not mint a second active link', async () => {
  const { service, repo } = make();
  const first = await service.createLink(SESSION);
  assert.ok(first.created === true && typeof first.token === 'string');
  const second = await service.createLink(SESSION);
  assert.equal(second.created, false); // already active, no new token
  const active = repo._rawStore().filter((l) => l.status === 'active');
  assert.equal(active.length, 1);
});

// TEST-024 — token entropy + hash-at-rest (SEC-002)
test('TEST-024: tokens are high-entropy and only their hash is stored', async () => {
  const { service, repo } = make();
  const r = await service.createLink(SESSION);
  assert.ok(r.created);
  const token = (r as { token: string }).token;
  // >= 128 bits of entropy (we mint 256): decoded length >= 16 bytes.
  assert.ok(Buffer.from(token, 'base64url').length >= 16);
  assert.ok(Buffer.from(token, 'base64url').length === TOKEN_BYTES);
  // The raw token is never persisted — only its hash.
  const stored = repo._rawStore()[0];
  assert.notEqual(stored.tokenHash, token);
  assert.equal(stored.tokenHash, hashToken(token));
  assert.ok(!JSON.stringify(repo._rawStore()).includes(token));
});

// TEST-024b — tokens are not sequential/predictable
test('TEST-024b: successive tokens are unrelated', async () => {
  const a = await make().service.createLink(SESSION);
  const b = await make().service.createLink(SESSION);
  assert.notEqual((a as { token: string }).token, (b as { token: string }).token);
});

// TEST-008 — revoke is terminal; a new link after revoke is different (FSD-009)
test('TEST-008: revoking kills the link; a new one is a fresh token', async () => {
  const { service, repo } = make();
  const first = await service.createLink(SESSION);
  const token1 = (first as { token: string }).token;
  const rev = await service.revokeLink(SESSION);
  assert.equal(rev.revoked, true);
  // Old token no longer resolves.
  assert.equal(await resolveActiveShare(repo, token1), null);
  // A new share yields a different token.
  const second = await service.createLink(SESSION);
  assert.ok(second.created === true);
  assert.notEqual((second as { token: string }).token, token1);
});

// TEST-008b — revoking with no active link is a success no-op
test('TEST-008b: revoke with nothing active is a no-op success', async () => {
  const { service } = make();
  assert.deepEqual(await service.revokeLink(SESSION), { revoked: false });
});

// TEST-009 — resolve active token (FSD-010)
test('TEST-009: an active token resolves to the owner share', async () => {
  const { service, repo } = make();
  const r = await service.createLink(SESSION);
  const share = await resolveActiveShare(repo, (r as { token: string }).token);
  assert.ok(share);
  assert.equal(share!.userId, 'owner1');
});

// auth guard on share endpoints (FSD-007)
test('share endpoints require auth (401)', async () => {
  const { service } = make();
  await assert.rejects(
    () => service.createLink(null),
    (e: unknown) => e instanceof AppError && e.status === 401,
  );
  await assert.rejects(
    () => service.revokeLink(null),
    (e: unknown) => e instanceof AppError && e.status === 401,
  );
});
