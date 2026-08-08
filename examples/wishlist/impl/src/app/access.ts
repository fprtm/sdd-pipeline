// Access control (FSD-007, SEC-001). Two primitives every owner action uses:
//  - requireAuth: derive the userId from the server-side session, never the body
//  - assertOwner: for any globally-addressable resource, 404 if not the caller's
// Returning NotFound (not 403) prevents existence disclosure.

import { NotAuthenticatedError, NotFoundError } from '../domain/errors.ts';

export interface Session {
  userId: string;
}

// The ONLY source of the acting userId. Callers must never accept a userId
// from client input — that is the IDOR the whole design forbids.
export function requireAuth(session: Session | null | undefined): string {
  if (!session || !session.userId) throw new NotAuthenticatedError();
  return session.userId;
}

// Guard for endpoints that resolve a resource by a global id: the caller may
// only act on resources they own; otherwise it's indistinguishable from absent.
export function assertOwner(
  sessionUserId: string,
  resourceOwnerId: string,
): void {
  if (sessionUserId !== resourceOwnerId) throw new NotFoundError();
}
