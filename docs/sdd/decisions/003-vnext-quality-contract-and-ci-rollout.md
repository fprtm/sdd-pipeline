# Decision #3: Extend one Quality Contract boundary and migrate enforcement explicitly

**Date**: 2026-10-02
**Status**: ACCEPTED

vNext extends the existing Quality Contract with versioned lifecycle policy rather than creating a second authority engine. Rollout proceeds shadow → report-only → explicit opt-in enforcement; legacy consumers remain report-only, while a vNext-enforced installation fails closed when a required checker is missing and degrades only for declared optional capabilities.

## Alternatives Considered

- A separate lifecycle engine is easier to prototype but creates competing subject, replay, and acceptance authority.
- Permanent report-only consumer CI maximizes compatibility but can represent a corrupt opted-in installation as success.
