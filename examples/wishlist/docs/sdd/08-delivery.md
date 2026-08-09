# Delivery & Infra Runbook — Wishlist

> **Plain-language summary:** How the wishlist runs and ships: the pipeline that
> tests every change, the containers it runs in, where config/secrets come from,
> what we watch in production, and how to roll back. Produced by the `infra` phase.

- **Traces up to:** [architecture](04-architecture.md) (ADR-005) · [threat model](05-threat-model.md) (SEC baseline, SEC-008)
- **Artifacts in repo:** `impl/Dockerfile`, `impl/docker-compose.yml`,
  `../../.github/workflows/ci.yml`, `impl/src/main.ts` (demo boot)

## Pipeline (CI) — TICKET-019
`.github/workflows/ci.yml` runs on every push/PR:
- **Tests + coverage gate** — `npm run test:ci` fails the build below 80% line &
  branch (the `coverage-check` gate). Currently: 54 tests, ~99% line / ~96% branch.
- **Secret scan** — blocks committed private keys / access keys.
- _(Real project adds: `npm ci`, dependency vulnerability scan (`npm audit` /
  Trivy), SAST — closes the threat-model supply-chain baseline item.)_

## Environments
Same definitions, different scale/config: **dev → staging → prod**.
- Demo boots with in-memory adapters (`src/main.ts`) so the image runs anywhere.
- Real deployment injects the Postgres adapter (ADR-003), the real auth/session
  service, and the catalog client via config — no code change to the domain.

## Containers & topology (ADR-005)
- `Dockerfile`: zero-dependency image, non-root user, `/healthz` HEALTHCHECK.
- `docker-compose.yml`: `api` (+ illustrative `db` Postgres showing where the real
  adapter connects). Public shared page (`/s/{token}`) is CDN-cacheable; owner
  `/v1/*` paths bypass cache.
- Run locally: `docker compose up --build`, then `curl localhost:3000/healthz`.

## Configuration & secrets (SEC-003 baseline)
- **No secrets in code, image, URL, or logs.** Inject via env/secret manager.
- Required vars: `PORT`, (real) `DATABASE_URL`, auth service URL/keys, CDN purge
  credentials. Separate secrets per environment; rotate-able.

## Observability & SLOs
- **Structured logs** — never log tokens, cookies, or PII (threat model).
- **Metrics/SLOs tied to NFRs:**
  - REQ-NF-001: shared/list read p95 < 300ms → alert on breach.
  - REQ-NF-004: 99.9% availability on read paths → CDN keeps `/s/*` up during
    backend blips; SLO monitor + alert.
- **Health:** `/healthz` liveness; add readiness once Postgres is wired.

## Release & rollback
- Automated deploy from CI on `main`; independent deploy per app (ADR-005).
- Rollout: blue/green or canary; **rollback = redeploy previous image tag.**
- Post-deploy smoke: `/healthz` + one shared-page fetch.
- **SEC-008:** on share revoke the API busts the CDN cache entry for that token
  (implemented in `server.ts`); verify purge credentials exist per environment.

## What still needs a human (not automatable safely here)
- Provisioning real cloud resources and the first production deploy — **require
  explicit human action** (credentials, spend, irreversibility). The `infra`
  skill prepares everything up to, but not including, pressing "apply/deploy".
- Real a11y audit (REQ-NF-005) and load test (REQ-NF-001) against a deployed env.
