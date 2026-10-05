# vNext assurance and evidence

[Policy] Risk sets the A0–A3 floor independently of complexity and ceremony in
`rules/axes.mjs`. Packs may tighten it through `rules/packs.mjs` but cannot
delete a hard stop, broaden scope, or lower assurance.

[Mechanical] Acceptance criteria declare E0–E6 minimum evidence levels through
`rules/delivery.mjs`. Higher evidence cannot escape its exact subject; E5/E6
also require an environment binding. A2/A3 reject self-reported or self-verified
required evidence.

[Mechanical] `rules/engineering.mjs` makes architecture fitness,
dependency/API compatibility, migration/reversibility, maintainability,
performance budget, and operability explicit for every work packet. An
inapplicable dimension needs a recorded rationale; applicable dimensions use
assurance-derived floors: E1/E2/E3 for A0/A1/A2; at A3, independent E4 for
architecture/compatibility/maintainability and environment-bound E5 for
migration/performance/operability. This shadow profile cannot accept a change.

[Runtime] Shadow evaluation always keeps `may_accept: false`; authorized
lifecycle events perform state transitions.

[Host-dependent] E4 independent identity, E5 realistic environments, and E6
field outcomes must come from external systems and accountable humans.
