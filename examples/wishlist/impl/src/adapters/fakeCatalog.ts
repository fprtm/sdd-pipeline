// Fake product catalog (stands in for the real catalog client, TICKET-006).
// Supports enrichment and the archived/missing cases (FSD-004, FSD-005).

export interface CatalogProduct {
  productId: string;
  name: string;
  image: string;
  price: number;
  status: 'active' | 'archived';
}

export interface Catalog {
  // Enrich a set of productIds. Missing ids are simply absent from the result,
  // so callers can detect "no longer available" (FSD-005) and not drop them.
  getMany(productIds: string[]): Promise<Map<string, CatalogProduct>>;
  isPurchasable(productId: string): Promise<boolean>;
}

export class FakeCatalog implements Catalog {
  private products = new Map<string, CatalogProduct>();
  // Test hook: force getMany to throw for a specific id (FSD-004 lookup failure).
  failFor = new Set<string>();

  constructor(seed: CatalogProduct[] = []) {
    for (const p of seed) this.products.set(p.productId, p);
  }

  async getMany(productIds: string[]): Promise<Map<string, CatalogProduct>> {
    const out = new Map<string, CatalogProduct>();
    for (const id of productIds) {
      if (this.failFor.has(id)) continue; // simulate per-item lookup failure
      const p = this.products.get(id);
      if (p) out.set(id, p);
    }
    return out;
  }

  async isPurchasable(productId: string): Promise<boolean> {
    const p = this.products.get(productId);
    return !!p && p.status === 'active';
  }
}
