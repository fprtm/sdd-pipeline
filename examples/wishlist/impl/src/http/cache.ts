// Shared-page cache with explicit invalidation (SEC-008, ADR-005).
// Keyed by token HASH (never the raw token). A revoke busts the entry so a
// revoked link is never served stale.

export interface PageCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  bust(key: string): void;
}

export class InMemoryPageCache implements PageCache {
  private store = new Map<string, { value: string; expires: number }>();
  private ttlMs: number;

  constructor(ttlMs = 30_000) {
    this.ttlMs = ttlMs;
  }

  get(key: string): string | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: string): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  bust(key: string): void {
    this.store.delete(key);
  }
}
