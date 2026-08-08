// Lightweight boundary validation (TICKET-003 / ADR-004). In production this is
// the shared, typed `contract` package (e.g. Zod); here it's a dependency-free
// stand-in with the same job: reject bad input at the edge before it reaches
// the domain (defense against SEC-007 and garbage data).

import { ValidationError } from '../domain/errors.ts';

export interface SaveItemInput {
  productId: string;
}

export function parseSaveItemInput(raw: unknown): SaveItemInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new ValidationError('body must be an object');
  }
  const productId = (raw as Record<string, unknown>).productId;
  if (typeof productId !== 'string' || productId.trim() === '') {
    throw new ValidationError('productId is required');
  }
  if (productId.length > 200) {
    throw new ValidationError('productId too long');
  }
  return { productId };
}
