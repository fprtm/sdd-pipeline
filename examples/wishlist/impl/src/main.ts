// DEMO boot wiring (infra phase). Boots the HTTP server with in-memory adapters
// so the Docker image / compose stack has something real to run.
//
// NOT production: a real deployment injects the Postgres adapters (ADR-003), the
// real auth/session service, and the real catalog client. The session resolver
// here trusts the `sid` cookie value as the userId — demo only, never ship this.

import { createServer } from './http/server.ts';
import { InMemoryWishlistRepo } from './adapters/inMemoryWishlistRepo.ts';
import { InMemoryShareRepo } from './adapters/inMemoryShareRepo.ts';
import { FakeCatalog } from './adapters/fakeCatalog.ts';
import { WishlistService } from './app/wishlistService.ts';
import { ShareService } from './app/shareService.ts';
import { SharedViewService } from './app/sharedViewService.ts';
import { InMemoryPageCache } from './http/cache.ts';
import { RateLimiter } from './http/rateLimit.ts';
import { systemClock } from './lib/clock.ts';

const PORT = Number(process.env.PORT ?? 3000);

const wishlistRepo = new InMemoryWishlistRepo();
const shareRepo = new InMemoryShareRepo();
const catalog = new FakeCatalog([
  { productId: 'P1', name: 'Ceramic Mug', image: 'mug.png', price: 12, status: 'active' },
  { productId: 'P2', name: 'Wool Hat', image: 'hat.png', price: 25, status: 'active' },
]);

const server = createServer({
  wishlist: new WishlistService(wishlistRepo, catalog, systemClock),
  share: new ShareService(shareRepo, systemClock),
  sharedView: new SharedViewService(shareRepo, wishlistRepo, catalog),
  shareRepo,
  resolveSession: (sid) => (sid ? { userId: sid } : null), // DEMO ONLY
  cache: new InMemoryPageCache(30_000),
  rateLimiter: new RateLimiter(100, 60_000),
});

server.listen(PORT, () => {
  console.log(`[demo] wishlist API listening on :${PORT}`);
});
