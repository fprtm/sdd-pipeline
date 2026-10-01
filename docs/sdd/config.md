# Quality Contract v1 project settings

mode: standard
sdlc: incremental
sdlc-reason: Quality Contract v1 is introduced through versioned vertical slices and a read-only pilot before opt-in enforcement.
domain: library
architecture: modular-monolith
artifact-policy-version: 1
artifact-retention: git-history

## Quality Contract policy

quality-contract-policy: 1
quality-contract-launch: provider-neutral-contract-one-validated-adapter
quality-contract-no-git: inspect-report-only
quality-contract-trust: external-attestation-medium-plus

