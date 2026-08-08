// Wishlist application service (TICKET-011). Orchestrates domain + adapters and
// maps to the API's owner-scoped operations. All userIds come from the session.

import type { WishlistRepo } from '../domain/wishlist.ts';
import { addItem, removeItem, listItems } from '../domain/wishlist.ts';
import type { Catalog } from '../adapters/fakeCatalog.ts';
import type { Clock } from '../lib/clock.ts';
import { requireAuth } from './access.ts';
import type { Session } from './access.ts';
import { ProductUnavailableError } from '../domain/errors.ts';
import { parseSaveItemInput } from '../contract/schemas.ts';

// The shape returned to the owner's client (FSD-004). Includes availability so
// archived products are shown, not dropped (FSD-005).
export interface WishlistItemView {
  productId: string;
  name: string | null;
  image: string | null;
  price: number | null;
  available: boolean;
  savedAt: string;
}

export class WishlistService {
  private readonly repo: WishlistRepo;
  private readonly catalog: Catalog;
  private readonly clock: Clock;

  constructor(repo: WishlistRepo, catalog: Catalog, clock: Clock) {
    this.repo = repo;
    this.catalog = catalog;
    this.clock = clock;
  }

  // FSD-001: save a purchasable product.
  async save(session: Session | null, rawBody: unknown): Promise<{ state: 'saved' }> {
    const userId = requireAuth(session);
    const { productId } = parseSaveItemInput(rawBody);
    if (!(await this.catalog.isPurchasable(productId))) {
      throw new ProductUnavailableError(); // 422 (FSD-001 error)
    }
    // A store failure here propagates as 503; the client keeps its intent.
    const state = await addItem(this.repo, userId, productId, this.clock);
    return { state };
  }

  // FSD-006: remove (idempotent).
  async remove(session: Session | null, productId: string): Promise<void> {
    const userId = requireAuth(session);
    await removeItem(this.repo, userId, productId);
  }

  // FSD-004 + FSD-005: list newest-first, enriched, archived flagged.
  async listMine(session: Session | null): Promise<WishlistItemView[]> {
    const userId = requireAuth(session);
    const items = await listItems(this.repo, userId);
    const enriched = await this.catalog.getMany(items.map((i) => i.productId));
    return items.map((i) => {
      const p = enriched.get(i.productId);
      return {
        productId: i.productId,
        name: p ? p.name : null,
        image: p ? p.image : null,
        price: p ? p.price : null,
        // Not in catalog (archived/missing/lookup-failure) => unavailable, but
        // still returned so the user can see and remove it.
        available: !!p && p.status === 'active',
        savedAt: i.createdAt.toISOString(),
      };
    });
  }
}
