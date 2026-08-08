// Sharing domain module (FSD-008..011). The security-sensitive core: mint an
// opaque token, store only its hash, resolve active shares, revoke terminally.

import type { Clock } from '../lib/clock.ts';
import { generateToken, hashToken } from '../lib/token.ts';

export type ShareStatus = 'active' | 'revoked';

export interface ShareLink {
  userId: string;
  tokenHash: string; // never the raw token
  status: ShareStatus;
  createdAt: Date;
  revokedAt?: Date;
}

export interface ShareRepo {
  findActiveByUser(userId: string): Promise<ShareLink | null>;
  findActiveByTokenHash(tokenHash: string): Promise<ShareLink | null>;
  create(userId: string, tokenHash: string, now: Date): Promise<void>;
  revokeForUser(userId: string, now: Date): Promise<boolean>;
  deleteAllForUser(userId: string): Promise<void>;
}

// Result of createShare. The raw token is returned ONLY when newly created —
// because we persist just the hash, an already-active link cannot be re-derived.
// This is the secure resolution of FSD-008's idempotency: at most one active
// link, and re-sharing does not mint a second one. (See impl/README.md §Findings.)
export type CreateShareResult =
  | { created: true; token: string }
  | { created: false; alreadyActive: true };

export async function createShare(
  repo: ShareRepo,
  userId: string,
  clock: Clock,
): Promise<CreateShareResult> {
  const active = await repo.findActiveByUser(userId);
  if (active) return { created: false, alreadyActive: true };

  const token = generateToken();
  await repo.create(userId, hashToken(token), clock());
  return { created: true, token };
}

// FSD-009: revocation is terminal. Returns true if a link was revoked.
export async function revokeShare(
  repo: ShareRepo,
  userId: string,
  clock: Clock,
): Promise<boolean> {
  return repo.revokeForUser(userId, clock());
}

// FSD-010 / FSD-011: resolve a raw token to an active share, or null.
// Unknown and revoked both return null → the caller cannot tell them apart.
export async function resolveActiveShare(
  repo: ShareRepo,
  rawToken: string,
): Promise<ShareLink | null> {
  return repo.findActiveByTokenHash(hashToken(rawToken));
}
