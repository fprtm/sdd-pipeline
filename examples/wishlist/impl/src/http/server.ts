// HTTP delivery layer (TICKET-011/012/013). Wires the application services to
// routes and enforces the HTTP-level security controls: auth (SEC-001/003),
// CSRF (SEC-004), rate limiting (SEC-006), the shared-page cache + bust
// (SEC-008), and the shared-page CSP + encoding (SEC-005/007).

import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppError, NotFoundError } from '../domain/errors.ts';
import type { WishlistService } from '../app/wishlistService.ts';
import type { ShareService } from '../app/shareService.ts';
import type { SharedViewService } from '../app/sharedViewService.ts';
import type { ShareRepo } from '../domain/sharing.ts';
import type { Session } from '../app/access.ts';
import { hashToken } from '../lib/token.ts';
import { parseCookies } from './cookies.ts';
import { isSafeMethod, csrfOk } from './csrf.ts';
import { RateLimiter } from './rateLimit.ts';
import type { PageCache } from './cache.ts';
import { renderSharedPage, SHARED_PAGE_CSP } from './sharedPage.ts';

export interface ServerDeps {
  wishlist: WishlistService;
  share: ShareService;
  sharedView: SharedViewService;
  shareRepo: ShareRepo; // for cache-bust lookup on revoke
  // Resolve an opaque session id (cookie) to a Session, or null if invalid.
  resolveSession: (sid: string | undefined) => Session | null;
  cache: PageCache;
  rateLimiter: RateLimiter;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(json);
}

function sendError(res: ServerResponse, err: unknown): void {
  if (err instanceof AppError) {
    send(res, err.status, { error: err.code, message: err.message });
    return;
  }
  send(res, 500, { error: 'INTERNAL', message: 'Internal error' });
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

export function createServer(deps: ServerDeps): http.Server {
  return http.createServer(async (req, res) => {
    try {
      const method = req.method ?? 'GET';
      const url = new URL(req.url ?? '/', 'http://localhost');
      const path = url.pathname;
      const ip = req.socket.remoteAddress ?? 'unknown';
      const cookies = parseCookies(req.headers['cookie']);

      // Rate limit all writes and the public shared path (SEC-006).
      if (!isSafeMethod(method) || path.startsWith('/s/')) {
        if (!deps.rateLimiter.allow(`${ip}:${path}`)) {
          send(res, 429, { error: 'RATE_LIMITED', message: 'Too many requests' });
          return;
        }
      }

      // CSRF on state-changing requests (SEC-004).
      if (!isSafeMethod(method)) {
        const header = req.headers['x-csrf-token'];
        if (!csrfOk(cookies['csrf'], Array.isArray(header) ? header[0] : header)) {
          send(res, 403, { error: 'CSRF', message: 'Invalid CSRF token' });
          return;
        }
      }

      // Liveness probe for infra healthchecks (no auth).
      if (method === 'GET' && path === '/healthz') {
        return send(res, 200, { ok: true });
      }

      const session = deps.resolveSession(cookies['sid']);

      // ---- Public shared page (SSR, cached, encoded, CSP) ----
      if (method === 'GET' && path.startsWith('/s/')) {
        const token = decodeURIComponent(path.slice('/s/'.length));
        const key = hashToken(token);
        const cached = deps.cache.get(key);
        if (cached) {
          res.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            'content-security-policy': SHARED_PAGE_CSP,
            'cache-control': 'public, max-age=30',
          });
          res.end(cached);
          return;
        }
        try {
          const view = await deps.sharedView.getByToken(token);
          const html = renderSharedPage(view);
          deps.cache.set(key, html);
          res.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            'content-security-policy': SHARED_PAGE_CSP,
            'cache-control': 'public, max-age=30',
          });
          res.end(html);
        } catch (err) {
          // 404s are never cached (so a later valid link isn't shadowed).
          if (err instanceof NotFoundError) {
            res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
            res.end('<!doctype html><title>Not available</title><p>This list isn\'t available.</p>');
          } else {
            sendError(res, err);
          }
        }
        return;
      }

      // ---- Owner API (/v1) ----
      if (path === '/v1/wishlist/items' && method === 'POST') {
        const body = await readJson(req);
        return send(res, 200, await deps.wishlist.save(session, body));
      }
      if (path === '/v1/wishlist/items' && method === 'GET') {
        return send(res, 200, { items: await deps.wishlist.listMine(session) });
      }
      if (path.startsWith('/v1/wishlist/items/') && method === 'DELETE') {
        const productId = decodeURIComponent(path.slice('/v1/wishlist/items/'.length));
        await deps.wishlist.remove(session, productId);
        res.writeHead(204);
        res.end();
        return;
      }
      if (path === '/v1/share' && method === 'POST') {
        return send(res, 200, await deps.share.createLink(session));
      }
      if (path === '/v1/share/revoke' && method === 'POST') {
        // Look up the active link's hash BEFORE revoking, to bust its cached page.
        const uid = session?.userId;
        let hashToBust: string | null = null;
        if (uid) {
          const active = await deps.shareRepo.findActiveByUser(uid);
          hashToBust = active ? active.tokenHash : null;
        }
        const result = await deps.share.revokeLink(session);
        if (hashToBust) deps.cache.bust(hashToBust); // SEC-008
        return send(res, 200, result);
      }

      send(res, 404, { error: 'NOT_FOUND', message: 'No such route' });
    } catch (err) {
      sendError(res, err);
    }
  });
}
