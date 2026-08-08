// In-memory WishlistRepo adapter (stands in for the Postgres adapter, ADR-003).
// Enforces the same invariant the DB unique(user_id, product_id) index would:
// at most one row per (user, product). Ordering is newest-first, like the index.

import type { WishlistRepo, WishlistItem, AddOutcome } from '../domain/wishlist.ts';
import { StoreUnavailableError } from '../domain/errors.ts';

export class InMemoryWishlistRepo implements WishlistRepo {
  private items: WishlistItem[] = [];
  // Test hook: when true, the next write throws StoreUnavailable (FSD-001 503).
  failNextWrite = false;

  async add(userId: string, productId: string, now: Date): Promise<AddOutcome> {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new StoreUnavailableError();
    }
    const exists = this.items.some(
      (i) => i.userId === userId && i.productId === productId,
    );
    if (exists) return 'exists'; // unique constraint → no-op (FSD-002)
    this.items.push({ userId, productId, createdAt: now });
    return 'created';
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter(
      (i) => !(i.userId === userId && i.productId === productId),
    );
    return this.items.length < before;
  }

  async list(userId: string): Promise<WishlistItem[]> {
    return this.items
      .filter((i) => i.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async count(userId: string): Promise<number> {
    return this.items.filter((i) => i.userId === userId).length;
  }

  async deleteAllForUser(userId: string): Promise<void> {
    this.items = this.items.filter((i) => i.userId !== userId);
  }
}
