// Share-token generation & hashing (SEC-002).
// - Tokens are 256 bits of CSPRNG randomness, URL-safe, opaque (never derived
//   from a userId, never sequential).
// - Only the hash is ever persisted, so a DB leak yields no live tokens.

import { randomBytes, createHash } from 'node:crypto';

export const TOKEN_BYTES = 32; // 256 bits (>= the 128-bit requirement)

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
