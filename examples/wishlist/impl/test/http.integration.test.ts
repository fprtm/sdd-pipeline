import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createServer } from '../src/http/server.ts';
import type { ServerDeps } from '../src/http/server.ts';
import { InMemoryWishlistRepo } from '../src/adapters/inMemoryWishlistRepo.ts';
import { InMemoryShareRepo } from '../src/adapters/inMemoryShareRepo.ts';
import { WishlistService } from '../src/app/wishlistService.ts';
import { ShareService } from '../src/app/shareService.ts';
import { SharedViewService } from '../src/app/sharedViewService.ts';
import { InMemoryPageCache } from '../src/http/cache.ts';
import { RateLimiter } from '../src/http/rateLimit.ts';
import { advancingClock, catalogWith } from './helpers.ts';

// Build a fully-wired server with in-memory everything. rateMax defaults high so
// unrelated tests don't 429; a dedicated test overrides it.
function buildServer(rateMax = 1000) {
  const wishlistRepo = new InMemoryWishlistRepo();
  const shareRepo = new InMemoryShareRepo();
  const catalog = catalogWith([{ productId: 'P1', name: 'Mug' }, { productId: 'P2', name: 'Hat' }]);
  const clock = advancingClock();
  const deps: ServerDeps = {
    wishlist: new WishlistService(wishlistRepo, catalog, clock),
    share: new ShareService(shareRepo, clock),
    sharedView: new SharedViewService(shareRepo, wishlistRepo, catalog),
    shareRepo,
    resolveSession: (sid) =>
      sid === 's1' ? { userId: 'u1' } : sid === 's2' ? { userId: 'u2' } : null,
    cache: new InMemoryPageCache(30_000),
    rateLimiter: new RateLimiter(rateMax, 60_000),
  };
  return createServer(deps);
}

async function withServer(
  server: ReturnType<typeof createServer>,
  fn: (base: string) => Promise<void>,
) {
  await new Promise<void>((r) => server.listen(0, r));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

// Authenticated headers for u1 (session + matching CSRF double-submit).
const authHeaders = {
  cookie: 'sid=s1; csrf=tok123',
  'x-csrf-token': 'tok123',
  'content-type': 'application/json',
};

// TEST-017 — save then list persists (over HTTP)
test('TEST-017: save then list returns the item', async () => {
  await withServer(buildServer(), async (base) => {
    const save = await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: 'P1' }),
    });
    assert.equal(save.status, 200);
    const list = await fetch(`${base}/v1/wishlist/items`, { headers: { cookie: 'sid=s1' } });
    const body = await list.json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].productId, 'P1');
  });
});

// TEST-011 (HTTP) — unauthenticated save → 401
test('TEST-011h: unauthenticated save is 401', async () => {
  await withServer(buildServer(), async (base) => {
    const r = await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST',
      // Valid CSRF (cookie csrf=x matches header) but NO sid → isolate the 401.
      headers: { cookie: 'csrf=x', 'x-csrf-token': 'x', 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'P1' }),
    });
    assert.equal(r.status, 401);
  });
});

// TEST-023 (HTTP) — missing/mismatched CSRF token → 403
test('TEST-023h: a write without a valid CSRF token is 403', async () => {
  await withServer(buildServer(), async (base) => {
    const r = await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST',
      headers: { cookie: 'sid=s1; csrf=tok123', 'content-type': 'application/json' }, // no x-csrf-token
      body: JSON.stringify({ productId: 'P1' }),
    });
    assert.equal(r.status, 403);
  });
});

// TEST-020 (HTTP) — session-scoping: u2 never sees u1's items (SEC-001)
test('TEST-020h: each user sees only their own wishlist', async () => {
  await withServer(buildServer(), async (base) => {
    await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: 'P1' }),
    });
    const asU2 = await fetch(`${base}/v1/wishlist/items`, { headers: { cookie: 'sid=s2' } });
    const body = await asU2.json();
    assert.equal(body.items.length, 0); // u2's list is empty; u1's item is invisible
  });
});

// TEST-018 — share, then anonymous viewer opens /s/{token} and sees read-only HTML
test('TEST-018: shared page renders for an active token, 404 for unknown', async () => {
  await withServer(buildServer(), async (base) => {
    await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: 'P1' }),
    });
    const shareRes = await fetch(`${base}/v1/share`, { method: 'POST', headers: authHeaders });
    const { token } = await shareRes.json();
    const page = await fetch(`${base}/s/${token}`); // anonymous, no cookies
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('content-security-policy')?.includes("script-src 'none'"), true);
    const html = await page.text();
    assert.ok(html.includes('Mug'));
    assert.ok(!html.includes('u1'), 'no owner id in the page');

    // Second GET of the same token is served from cache (still 200, same HTML).
    const cached = await fetch(`${base}/s/${token}`);
    assert.equal(cached.status, 200);
    assert.equal(await cached.text(), html);

    const unknown = await fetch(`${base}/s/nope-nope-nope`);
    assert.equal(unknown.status, 404);
  });
});

// TEST-031 — revoke busts the cached shared page (SEC-008)
test('TEST-031: after revoke the shared page is gone (cache busted)', async () => {
  await withServer(buildServer(), async (base) => {
    await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: 'P1' }),
    });
    const { token } = await (await fetch(`${base}/v1/share`, { method: 'POST', headers: authHeaders })).json();
    assert.equal((await fetch(`${base}/s/${token}`)).status, 200); // now cached
    const rev = await fetch(`${base}/v1/share/revoke`, { method: 'POST', headers: authHeaders });
    assert.equal(rev.status, 200);
    assert.equal((await fetch(`${base}/s/${token}`)).status, 404); // busted + revoked
  });
});

// TEST-028 (HTTP) — rate limit returns 429
test('TEST-028h: exceeding the rate limit returns 429', async () => {
  await withServer(buildServer(2), async (base) => {
    const hit = () =>
      fetch(`${base}/v1/share`, { method: 'POST', headers: authHeaders }).then((r) => r.status);
    await hit();
    await hit();
    assert.equal(await hit(), 429); // 3rd within the window
  });
});

// CHANGE (clear-wishlist): DELETE the collection clears all; single-item DELETE still works
test('TEST-034h: DELETE /v1/wishlist/items clears all, then list is empty', async () => {
  await withServer(buildServer(), async (base) => {
    for (const productId of ['P1', 'P2']) {
      await fetch(`${base}/v1/wishlist/items`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ productId }),
      });
    }
    const clear = await fetch(`${base}/v1/wishlist/items`, { method: 'DELETE', headers: authHeaders });
    assert.equal(clear.status, 204);
    const list = await (await fetch(`${base}/v1/wishlist/items`, { headers: { cookie: 'sid=s1' } })).json();
    assert.equal(list.items.length, 0);
  });
});

// healthz liveness probe (infra)
test('GET /healthz returns ok', async () => {
  await withServer(buildServer(), async (base) => {
    const r = await fetch(`${base}/healthz`);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  });
});

// remove over HTTP + unknown route + validation error mapping
test('remove works, unknown route 404, bad body 422', async () => {
  await withServer(buildServer(), async (base) => {
    await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ productId: 'P1' }),
    });
    const del = await fetch(`${base}/v1/wishlist/items/P1`, { method: 'DELETE', headers: authHeaders });
    assert.equal(del.status, 204);

    const nope = await fetch(`${base}/v1/nope`, { headers: { cookie: 'sid=s1' } });
    assert.equal(nope.status, 404);

    const bad = await fetch(`${base}/v1/wishlist/items`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({}),
    });
    assert.equal(bad.status, 422);
  });
});
