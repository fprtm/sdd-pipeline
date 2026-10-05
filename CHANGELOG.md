# Changelog

Notable changes to SDD Pipeline. This release line is pre-1.0; see the
[release policy](docs/RELEASE-POLICY.md) for compatibility and migration rules.

## [0.1.0] — 2026-10-05

Initial release of the current SDD Pipeline product line.

### Included

- A portable orchestrator and eight explicit commands for discovery,
  specification, implementation, checking, documentation, learning, handoff,
  and updating.
- An adaptive ASK → SPEC → PLAN → BUILD → CHECK workflow with bounded work
  records, traceability, security analysis, coverage checks, and a judgment gate.
- Conditional multi-agent orchestration with independent implementation,
  review, verification, and security roles when the host supports them.
- Provider-neutral handoff records for continuing work across sessions and
  environments.
- Mechanical checkers and installation tests for artifact hygiene,
  traceability, parallel-work safety, retirement, and distribution consistency.

This is a pre-1.0 release. Command contracts, artifact formats, and policies
may evolve; changes that affect existing project data will include migration
guidance.
