# Decision #2: Benchmark two domains with assurance-specific cost bounds

**Date**: 2026-10-02
**Status**: ACCEPTED

Initial evaluation covers developer tooling/library work and an authentication/authorization/customer-data API. A0/A1 permits at most +10% median end-to-end latency and +15% review time versus matched baseline; A2 permits +25% for both with safety gates passing; A3 has no hard latency cap but reports absolute and p90 cost for human judgment. No speed gain offsets a P1/P2 regression.

## Alternatives Considered

- A web/UI cohort adds browser and accessibility evidence but introduces visual-grading variance before the core protocol is calibrated.
- One global cost cap is simpler but treats low-risk edits and critical authorization work as equivalent.
