// SSR of the public shared wishlist page (TICKET-018, ADR-FE-001).
//  - Output-encodes all product data (SEC-007 stored-XSS defense).
//  - Contains NO owner identity (SEC-005) and no edit controls (read-only, FSD-012).

import { escapeHtml } from './html.ts';
import type { SharedWishlistView } from '../app/sharedViewService.ts';

export function renderSharedPage(view: SharedWishlistView): string {
  const items = view.items
    .map((i) => {
      const name = i.name ? escapeHtml(i.name) : 'No longer available';
      const price = i.price === null ? '' : escapeHtml(String(i.price));
      const avail = i.available ? '' : ' <span class="badge">unavailable</span>';
      // Note: no owner fields are ever referenced here.
      return `<li class="item"><span class="name">${name}</span>` +
        `<span class="price">${price}</span>${avail}</li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A shared wishlist</title>
</head>
<body>
  <main>
    <h1>A shared wishlist</h1>
    <ul class="wishlist">${items}</ul>
  </main>
</body>
</html>`;
}

// The CSP applied to the shared page response (SEC-007). Strict: no inline/eval.
export const SHARED_PAGE_CSP =
  "default-src 'self'; img-src 'self' https:; style-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
