// Shared test helpers.
import type { Clock } from '../src/lib/clock.ts';
import { FakeCatalog } from '../src/adapters/fakeCatalog.ts';
import type { CatalogProduct } from '../src/adapters/fakeCatalog.ts';

// A clock that advances by 1s on each call, so createdAt values are distinct
// and ordering (newest-first) is testable deterministically.
export function advancingClock(startIso = '2026-01-01T00:00:00.000Z'): Clock {
  let t = new Date(startIso).getTime();
  return () => {
    const d = new Date(t);
    t += 1000;
    return d;
  };
}

export function catalogWith(products: Partial<CatalogProduct>[]): FakeCatalog {
  const seed: CatalogProduct[] = products.map((p, i) => ({
    productId: p.productId ?? `P${i + 1}`,
    name: p.name ?? `Product ${i + 1}`,
    image: p.image ?? `img${i + 1}.png`,
    price: p.price ?? 100 + i,
    status: p.status ?? 'active',
  }));
  return new FakeCatalog(seed);
}
