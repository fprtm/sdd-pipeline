// CSRF protection via double-submit token (SEC-004). On any state-changing
// (non-GET/HEAD) request, the `csrf` cookie must equal the `x-csrf-token` header.
// Both are set by the client from a value only same-origin JS can read.

import { timingSafeEqual } from 'node:crypto';

export function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

export function csrfOk(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
