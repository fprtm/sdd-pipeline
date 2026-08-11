---
name: infra
description: >-
  Operationalize the architecture — CI/CD, infrastructure-as-code, environments,
  secrets, and observability — so the built code can actually be tested, deployed,
  and run safely. Use when the user says "set up CI/CD / deploy this / provision
  infra / add observability", or as the delivery phase of spec-driven-development.
  Turns ADR-005-style deployment decisions into running pipelines and environments.
---

# infra — make it deployable, observable, and safe to run

Code that passes tests on a laptop is not shipped. This phase builds the pipeline
and the environments that carry the architecture's deployment decisions
(`04-architecture.md`) into production, and wires in the SSDLC controls
(`05-threat-model.md`) so security is enforced by the machine, not by memory.

Set up the **CI + coverage gate early** (at the start of implementation, not the
end) so every ticket lands against a green pipeline. Do the **provision + deploy**
parts as you approach ship.

## 1. CI pipeline (set up first)

Wire the test-plan command with the **coverage gate** (default ≥80% line+branch —
see `coverage-check`) so the build fails below it. Add, per the threat model's
baseline:

- **Dependency & supply-chain hygiene** — commit a lockfile; run a vulnerability
  scanner; fail on known-critical advisories (this closes the baseline item the
  threat model flagged).
- **Static checks** — lint, type-check, format.
- **Secret scanning** — block commits/PRs that contain credentials.
- **SAST** (where available) for the languages in use.
- **Docs-drift check** — flag a public-interface change with no matching doc
  change in the same diff. `implement`/`code-review` keep docs current inside the
  pipeline; this is the backstop for changes made outside it (a pre-commit hook
  can run the same check earlier).
- **Traceability check** — copy `check-traceability.mjs` (bundled with the
  `traceability` skill) into the project as `tools/check-traceability.mjs`, run
  it in CI so a drifting matrix fails the build — the backstop against the
  matrix becoming decoration.

The pipeline is the enforcement point for the verify gate; a merge is not allowed
if any of these fail.

## 2. Infrastructure as code

Never click production into existence by hand — describe it in code so it's
reviewable, repeatable, and destroyable. Match the topology decided in the ADRs
(fullstack / FE+BE separate / monorepo; container / serverless / VM; CDN for
cacheable public paths). Cover:

- compute + networking + the datastore (with the ADR's choice),
- the CDN/edge for cacheable public routes (and, per SEC controls, cache-bust on
  events like a share revoke),
- least-privilege IAM/roles — deny by default.

Keep environments **parity**: dev / staging / prod from the same definitions,
differing only by scale and config.

## 3. Configuration & secrets

- **No secrets in code, images, URLs, or logs** (this is a SEC control, not a nicety).
- Inject config via environment/secret manager; document every required variable.
- Rotate-able credentials; separate secrets per environment.

## 4. Observability & operations

You can't run what you can't see. Add:

- **Structured logs** — without secrets/PII (per the threat model).
- **Metrics + SLOs** — tie them to the NFRs (e.g. the p95 latency target, the
  availability target). This is how NFRs that aren't unit-testable get verified.
- **Alerting** on SLO breach and on error spikes.
- **Health checks** and a rollback path (the ADR's independent-deploy promise only
  pays off if rollback is real).

## 5. Deploy & release

- Automated deploy from CI on the release branch; no manual copying.
- A safe rollout (blue/green or canary where justified) and a tested rollback.
- Smoke/e2e check post-deploy against the running environment.

## Safety rules (important)

Provisioning and deploying are **outward, hard-to-reverse actions**.

- **Autopilot** may prepare everything (write IaC, pipelines, configs) but must
  **stop and get explicit human confirmation before actually provisioning cloud
  resources, deploying to a shared/production environment, or anything that costs
  money or is destructive.** Never enter cloud/billing credentials yourself —
  direct the user to do that (or use a credential-request flow if available).
- **Copilot** proposes the plan and waits for the developer to run/approve the
  real actions.
- Prefer `dry-run`/`plan` output first; show it before `apply`.

## Exit gate

CI enforces tests + coverage + security scans; infra is defined as code with
environment parity; secrets are managed (none in code); observability + SLOs +
alerting + rollback exist; deploy is automated with a post-deploy check. Then the
**ship** phase can complete with the traceability matrix green.
