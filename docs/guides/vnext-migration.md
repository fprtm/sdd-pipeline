# vNext migration and downgrade

[Policy] Legacy repositories stay report-only. Explicit project migration is
represented by `.sdd/vnext-enforced`; installers never create it silently.

[Mechanical] Preview provider support with `rules/capabilities.mjs`. Missing
optional capability is degraded; after opt-in, missing required capability is
blocked. The installer atomically switches the complete Quality Contract
runtime, benchmark code, and data-only reference packs.

[Runtime] To migrate, review capability output, create the marker in the target
project through its normal approval path, then run its CI. To downgrade, preview
the change, explicitly remove enforcement, and preserve vNext evidence without
reinterpreting it as legacy authority.

[Host-dependent] Provider support is limited to capabilities actually declared
and tested on that host. A provider-neutral handoff preserves state; it does not
upgrade missing authority.
