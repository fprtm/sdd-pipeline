// Share application service (TICKET-012). Owner-scoped create/revoke.

import type { ShareRepo } from '../domain/sharing.ts';
import { createShare, revokeShare } from '../domain/sharing.ts';
import type { CreateShareResult } from '../domain/sharing.ts';
import type { Clock } from '../lib/clock.ts';
import { requireAuth } from './access.ts';
import type { Session } from './access.ts';

export class ShareService {
  private readonly repo: ShareRepo;
  private readonly clock: Clock;

  constructor(repo: ShareRepo, clock: Clock) {
    this.repo = repo;
    this.clock = clock;
  }

  // FSD-008: create (idempotent — one active link per wishlist).
  async createLink(session: Session | null): Promise<CreateShareResult> {
    const userId = requireAuth(session);
    return createShare(this.repo, userId, this.clock);
  }

  // FSD-009: revoke (terminal). No-op success if nothing active.
  async revokeLink(session: Session | null): Promise<{ revoked: boolean }> {
    const userId = requireAuth(session);
    const revoked = await revokeShare(this.repo, userId, this.clock);
    return { revoked };
  }
}
