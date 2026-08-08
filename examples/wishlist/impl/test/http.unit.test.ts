import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSharedPage, SHARED_PAGE_CSP } from '../src/http/sharedPage.ts';
import { escapeHtml } from '../src/http/html.ts';
import { parseCookies, serializeSessionCookie } from '../src/http/cookies.ts';
import { csrfOk, isSafeMethod } from '../src/http/csrf.ts';
import { RateLimiter } from '../src/http/rateLimit.ts';
import { InMemoryPageCache } from '../src/http/cache.ts';

// TEST-030 — stored XSS: product text is encoded on the shared page (SEC-007)
test('TEST-030: shared page encodes product names (no script executes)', () => {
  const html = renderSharedPage({
    items: [
      { productId: 'P1', name: '<script>alert(1)</script>', image: null, price: 9, available: true },
    ],
  });
  assert.ok(!html.includes('<script>alert(1)</script>'), 'raw script must not appear');
  assert.ok(html.includes('&lt;script&gt;'), 'name is html-escaped');
});

// TEST-026 (delivery) — SSR HTML carries no owner identity (SEC-005)
test('shared page HTML contains no owner fields', () => {
  const html = renderSharedPage({
    items: [{ productId: 'P1', name: 'Mug', image: null, price: 9, available: true }],
  });
  assert.ok(!html.includes('userId'));
  assert.ok(!html.includes('savedAt'));
});

test('shared page marks unavailable items and has a strict CSP constant', () => {
  const html = renderSharedPage({
    items: [{ productId: 'P1', name: null, image: null, price: null, available: false }],
  });
  assert.ok(html.includes('No longer available'));
  assert.ok(html.includes('unavailable'));
  assert.ok(SHARED_PAGE_CSP.includes("script-src 'none'"));
});

test('escapeHtml handles all dangerous characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
});

// TEST-022 — session cookie is HttpOnly/Secure/SameSite (SEC-003)
test('TEST-022: session cookie carries secure attributes', () => {
  const c = serializeSessionCookie('sid', 'abc def');
  assert.ok(c.includes('HttpOnly'));
  assert.ok(c.includes('Secure'));
  assert.ok(c.includes('SameSite=Lax'));
  assert.ok(c.includes('sid=abc%20def')); // value encoded
});

test('parseCookies parses a cookie header', () => {
  const c = parseCookies('sid=s1; csrf=tok; empty');
  assert.equal(c.sid, 's1');
  assert.equal(c.csrf, 'tok');
  assert.deepEqual(parseCookies(undefined), {});
});

// TEST-023 (unit) — CSRF double-submit compare (SEC-004)
test('TEST-023u: csrfOk requires matching cookie and header', () => {
  assert.equal(csrfOk('tok', 'tok'), true);
  assert.equal(csrfOk('tok', 'other'), false);
  assert.equal(csrfOk(undefined, 'tok'), false);
  assert.equal(csrfOk('tok', undefined), false);
  assert.equal(csrfOk('short', 'longertoken'), false);
});

test('isSafeMethod classifies methods', () => {
  assert.ok(isSafeMethod('GET'));
  assert.ok(!isSafeMethod('POST'));
});

// TEST-028 (unit) — rate limiter blocks past the max in a window (SEC-006)
test('TEST-028u: RateLimiter allows up to max then blocks', () => {
  const rl = new RateLimiter(2, 1000);
  const now = 1000;
  assert.equal(rl.allow('k', now), true);
  assert.equal(rl.allow('k', now), true);
  assert.equal(rl.allow('k', now), false); // 3rd blocked
  assert.equal(rl.allow('k', now + 1001), true); // window reset
});

// SEC-008 (unit) — cache bust removes an entry; TTL expiry works
test('page cache stores, busts, and expires', () => {
  const cache = new InMemoryPageCache(50);
  cache.set('k', 'html');
  assert.equal(cache.get('k'), 'html');
  cache.bust('k');
  assert.equal(cache.get('k'), undefined);
  const short = new InMemoryPageCache(-1); // already expired
  short.set('k', 'v');
  assert.equal(short.get('k'), undefined);
});
