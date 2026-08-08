// In-memory ShareRepo adapter (stands in for the Postgres adapter, ADR-003).
// Mirrors the DB constraints: one active link per user; lookups by token hash.

import type { ShareRepo, ShareLink } from '../domain/sharing.ts';

export class InMemoryShareRepo implements ShareRepo {
  private links: ShareLink[] = [];

  async findActiveByUser(userId: string): Promise<ShareLink | null> {
    return (
      this.links.find((l) => l.userId === userId && l.status === 'active') ?? null
    );
  }

  async findActiveByTokenHash(tokenHash: string): Promise<ShareLink | null> {
    return (
      this.links.find(
        (l) => l.tokenHash === tokenHash && l.status === 'active',
      ) ?? null
    );
  }

  async create(userId: string, tokenHash: string, now: Date): Promise<void> {
    this.links.push({ userId, tokenHash, status: 'active', createdAt: now });
  }

  async revokeForUser(userId: string, now: Date): Promise<boolean> {
    const link = await this.findActiveByUser(userId);
    if (!link) return false;
    link.status = 'revoked';
    link.revokedAt = now;
    return true;
  }

  async deleteAllForUser(userId: string): Promise<void> {
    this.links = this.links.filter((l) => l.userId !== userId);
  }

  // Test-only introspection: assert the raw token is never stored.
  _rawStore(): ReadonlyArray<ShareLink> {
    return this.links;
  }
}
