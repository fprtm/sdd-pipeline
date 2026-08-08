// Public shared-view service (TICKET-013). The most security-sensitive path.
//  - Uniform NotFound for unknown/revoked tokens (SEC-002 / FSD-011).
//  - Read-only: this service exposes NO mutators (FSD-012).
//  - The DTO whitelists product fields only — never owner identity (SEC-005).

import type { ShareRepo } from '../domain/sharing.ts';
import { resolveActiveShare } from '../domain/sharing.ts';
import type { WishlistRepo } from '../domain/wishlist.ts';
import type { Catalog } from '../adapters/fakeCatalog.ts';
import { NotFoundError } from '../domain/errors.ts';

// Deliberately contains NO userId, email, name, or timestamps of the owner.
export interface SharedProductView {
  productId: string;
  name: string | null;
  image: string | null;
  price: number | null;
  available: boolean;
}

export interface SharedWishlistView {
  items: SharedProductView[];
}

export class SharedViewService {
  private readonly shareRepo: ShareRepo;
  private readonly wishlistRepo: WishlistRepo;
  private readonly catalog: Catalog;

  constructor(shareRepo: ShareRepo, wishlistRepo: WishlistRepo, catalog: Catalog) {
    this.shareRepo = shareRepo;
    this.wishlistRepo = wishlistRepo;
    this.catalog = catalog;
  }

  // Anonymous, read-only. Throws NotFound identically for unknown and revoked.
  async getByToken(rawToken: string): Promise<SharedWishlistView> {
    const share = await resolveActiveShare(this.shareRepo, rawToken);
    if (!share) throw new NotFoundError('This list isn\'t available');

    const items = await this.wishlistRepo.list(share.userId);
    const enriched = await this.catalog.getMany(items.map((i) => i.productId));
    return {
      items: items.map((i) => {
        const p = enriched.get(i.productId);
        return {
          productId: i.productId,
          name: p ? p.name : null,
          image: p ? p.image : null,
          price: p ? p.price : null,
          available: !!p && p.status === 'active',
        };
      }),
    };
  }
}
