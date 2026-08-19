# Infra — Deployable, Observable, Safe to Run

Code that passes tests on a laptop is not shipped. This skill turns deployment decisions (ADRs) into running pipelines and environments, and wires the SSDLC controls (`skills/think/threat-model/`) so security is enforced by the machine, not by memory. Triggered by "set up CI/CD / deploy this / provision infra / add observability", or as the delivery step of a large/full build.

**Set up the CI + coverage gate early** (start of implementation, not the end) so every ticket lands against a green pipeline. Provision + deploy happen as ship approaches.

## 1. CI Pipeline (Set Up First)

`enforcement/ci/sdd-check.yml` is the starting template. Wire the test plan's command with the **coverage gate** (default ≥80% line+branch — `skills/prove/coverage-check/`) so the build fails below it. Add, per the threat model's baseline:

- **Dependency & supply-chain hygiene** — lockfile committed; vulnerability scanner; fail on known-critical advisories.
- **Static checks** — lint, type-check, format.
- **Secret scanning** — block commits/PRs containing credentials.
- **SAST** where available for the languages in use.
- **Browser e2e (UI products)** — run the committed Playwright/Cypress specs (`skills/prove/browser-qa/`'s durable flavor) against an ephemeral local/CI environment with a disposable DB — never production. Keep the suite thin (Must journeys only).
- **Docs-drift check** — flag a public-interface change with no matching doc change in the same diff.
- **Traceability check** — `tools/check-traceability.mjs` (bundled with `skills/meta/traceability/`) in CI, so a drifting matrix fails the build.
- **File hygiene check** — `tools/check-file-hygiene.mjs` (bundled with `skills/meta/health-check/`) in CI. Markdown conventions are followed probabilistically; this catches the drift a weaker model skips under time pressure.

The pipeline is the enforcement point: a merge is not allowed while any of these fail.

## 2. Infrastructure as Code

Never click production into existence by hand — describe it in code so it's reviewable, repeatable, destroyable. Match the topology the ADRs decided (container/serverless/VM; CDN for cacheable public paths). Cover compute + networking + datastore, the CDN/edge (with cache-busting per SEC controls where relevant), and **least-privilege IAM — deny by default**. Keep **environment parity**: dev/staging/prod from the same definitions, differing only in scale and config.

## 3. Configuration & Secrets

- **No secrets in code, images, URLs, or logs** — a SEC control, not a nicety.
- Config via environment/secret manager; document every required variable.
- Rotate-able credentials; separate secrets per environment.

## 4. Observability & Operations

- **Structured logs** without secrets/PII (per the threat model).
- **Metrics + SLOs tied to the REQ-NF targets** (p95 latency, availability) — this is how NFRs that aren't unit-testable get verified.
- **Alerting** on SLO breach and error spikes.
- **Health checks** and a real, tested rollback path.

## 5. Deploy & Release

- Automated deploy from CI; no manual copying.
- Safe rollout (blue/green or canary where justified) with a tested rollback.
- Post-deploy smoke/e2e check against the running environment.

## Safety Rules (Important)

Provisioning and deploying are **outward, hard-to-reverse actions**:

- Prepare everything (IaC, pipelines, configs) freely — but **STOP and get explicit human confirmation before actually provisioning cloud resources, deploying to a shared/production environment, or anything that costs money or is destructive.** This confirmation is required in every mode, including the most autonomous ones.
- Never enter cloud/billing credentials yourself — direct the user to do that.
- Prefer `dry-run`/`plan` output first; show it before `apply`.

## Exit Gate

CI enforces tests + coverage + security scans + the two mechanical checkers; infra is code with environment parity; secrets managed (none in code); observability + SLOs + alerting + rollback exist; deploy is automated with a post-deploy check.
