# Quality Contract v1 project settings

mode: standard
sdlc: incremental
sdlc-reason: Quality Contract v1 is introduced through versioned vertical slices and a read-only pilot before opt-in enforcement.
domain: library
architecture: modular-monolith
artifact-policy-version: 1
artifact-retention: git-history
active-entry-budget: 7
active-entry-budget-reason: The approved vNext program and context-efficiency release each have independent consumers and verification lifecycles while the two alignment review units, Quality Contract, and workflow-navigation remain under active review.

## Quality Contract policy

quality-contract-policy: 1
quality-contract-launch: provider-neutral-contract-one-validated-adapter
quality-contract-no-git: inspect-report-only
quality-contract-trust: external-attestation-medium-plus
