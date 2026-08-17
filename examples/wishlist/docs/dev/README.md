# Wishlist — developer docs

Canonical entry point for developers/agents extending this example. This is the
index; deeper detail lives one hop away, not duplicated here.

## Run it

See [`impl/README.md`](../../impl/README.md) — exact commands (`npm test`,
`npm run test:ci`, `npm start`, `docker compose up --build`), no install step
needed (Node's built-in TypeScript stripping + `node:test`).

## Architecture

See [`architecture.md`](architecture.md) for the module map and dependency
rule. The full reasoning (forces, alternatives rejected) is the ADRs in
[`../sdd/04-architecture.md`](../sdd/04-architecture.md) — that file stays the
SSOT; this doc is a map pointing at it, not a copy.

## The spec trail (SSOT for what/why)

Everything about *what* this feature is and *why* it's shaped this way lives in
[`../sdd/`](../sdd/) — PRD, FSD, threat model, backlog, test plan, traceability.
Code implements the trail; it doesn't redecide it.

## Adding a feature through this pipeline

This example itself demonstrates the pattern: `../sdd/changes/` holds
brownfield changes (e.g. `2026-08-09-clear-wishlist.md`) layered on top of the
original full-mode build, each a self-contained dated file, each registered in
`../sdd/00-overview.md`'s topic index. Follow that shape for the next change.
