// Wishlist domain module (FSD-001..006). Pure rules behind a repository PORT —
// no DB, no HTTP. Testable with an in-memory fake.

import type { Clock } from '../lib/clock.ts';
import { WishlistFullError } from './errors.ts';

export const MAX_ITEMS = 500; // FSD-003 soft cap, named (not magic)

export interface WishlistItem {
  userId: string;
  productId: string;
  createdAt: Date;
}

export type AddOutcome = 'created' | 'exists';

// The port the domain depends on. Adapters implement it.
export interface WishlistRepo {
  add(userId: string, productId: string, now: Date): Promise<AddOutcome>;
  remove(userId: string, productId: string): Promise<boolean>;
  // Returns the user's items ordered newest-first.
  list(userId: string): Promise<WishlistItem[]>;
  count(userId: string): Promise<number>;
  deleteAllForUser(userId: string): Promise<void>;
}

// FSD-001 + FSD-002 + FSD-003: save (idempotent), enforce cap.
// Returns 'saved' whether it was newly created or already present.
export async function addItem(
  repo: WishlistRepo,
  userId: string,
  productId: string,
  clock: Clock,
): Promise<'saved'> {
  // Only a brand-new item counts against the cap; a duplicate is a no-op.
  const current = await repo.count(userId);
  if (current >= MAX_ITEMS) {
    // Re-saving an existing item at the cap is still fine (no growth).
    const existing = await repo.list(userId);
    const alreadyThere = existing.some((i) => i.productId === productId);
    if (!alreadyThere) throw new WishlistFullError();
  }
  await repo.add(userId, productId, clock());
  return 'saved';
}

// FSD-006: remove (idempotent — removing a non-present item is success).
export async function removeItem(
  repo: WishlistRepo,
  userId: string,
  productId: string,
): Promise<void> {
  await repo.remove(userId, productId);
}

// FSD-004: list the caller's items, newest-first (ordering owned by the repo).
export async function listItems(
  repo: WishlistRepo,
  userId: string,
): Promise<WishlistItem[]> {
  return repo.list(userId);
}

// CHANGE (clear-wishlist): remove all of the caller's items. Idempotent — reuses
// the owner-scoped deleteAllForUser port that already backs account deletion.
export async function clearItems(
  repo: WishlistRepo,
  userId: string,
): Promise<void> {
  await repo.deleteAllForUser(userId);
}
