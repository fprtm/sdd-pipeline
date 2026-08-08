// Account-deletion purge hook (TICKET-020 / FSD-013 / REQ-NF-002 GDPR).
// Runs inside the account-deletion transaction: removes all wishlist items and
// share links for the user, which also kills any live share links.

import type { WishlistRepo } from '../domain/wishlist.ts';
import type { ShareRepo } from '../domain/sharing.ts';

export async function purgeUserData(
  userId: string,
  wishlistRepo: WishlistRepo,
  shareRepo: ShareRepo,
): Promise<void> {
  await wishlistRepo.deleteAllForUser(userId);
  await shareRepo.deleteAllForUser(userId);
}
