# vNext adoption map

This guide is the audience entry point. It links to canonical owners and does
not restate their schemas.

- **Product:** [Policy] use the product decision contract in
  `skills/meta/quality-contract/rules/product.mjs`; rejection and revision are
  valid outcomes, not failed runs.
- **Engineering and QA:** [Mechanical] use `rules/delivery.mjs`,
  `rules/engineering.mjs`, and `rules/qa.mjs`; a shadow PASS never grants
  acceptance.
- **Security and operations:** [Runtime] readiness and release bindings require
  exact candidate evidence and external authority.
- **Host operators:** [Host-dependent] capability truth, attestors, durable
  replay, and production action belong to the actual host environment.

Read [lifecycle](vnext-lifecycle.md), [roles](vnext-roles.md),
[assurance](vnext-assurance.md), [benchmark methodology](vnext-benchmark.md),
[migration](vnext-migration.md), then [worked examples](vnext-examples.md).
