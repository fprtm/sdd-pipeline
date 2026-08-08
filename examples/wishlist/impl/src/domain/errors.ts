// Typed domain errors. Each carries the HTTP status the API layer maps it to,
// so the FSD status codes (401/404/409/422/503) live in one place.

export type ErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_FOUND'
  | 'WISHLIST_FULL'
  | 'PRODUCT_UNAVAILABLE'
  | 'STORE_UNAVAILABLE'
  | 'VALIDATION';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  constructor(code: ErrorCode, status: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

// 401 — no valid session (FSD-001 error, FSD-007)
export class NotAuthenticatedError extends AppError {
  constructor(message = 'Not authenticated') {
    super('NOT_AUTHENTICATED', 401, message);
  }
}

// 404 — resource absent OR not owned by caller. One class so "not found" and
// "not yours" are indistinguishable to the caller (SEC-001 existence hiding).
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super('NOT_FOUND', 404, message);
  }
}

// 409 — wishlist at capacity (FSD-003)
export class WishlistFullError extends AppError {
  constructor(message = 'Your wishlist is full (500). Remove an item to add more.') {
    super('WISHLIST_FULL', 409, message);
  }
}

// 422 — product missing/archived (FSD-001 error)
export class ProductUnavailableError extends AppError {
  constructor(message = "This product isn't available") {
    super('PRODUCT_UNAVAILABLE', 422, message);
  }
}

// 503 — datastore write failed; caller should retry, intent not lost (FSD-001)
export class StoreUnavailableError extends AppError {
  constructor(message = 'Temporarily unavailable, please retry') {
    super('STORE_UNAVAILABLE', 503, message);
  }
}

// 400/422 — input failed contract validation
export class ValidationError extends AppError {
  constructor(message = 'Invalid input') {
    super('VALIDATION', 422, message);
  }
}
