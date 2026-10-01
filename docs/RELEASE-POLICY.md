# Release Policy

SDD Pipeline uses Semantic Versioning to communicate compatibility, not team size, marketing maturity, or the number of people using it. The current `6.x` line is a continuing product lineage. It is not a count of customers or an assertion that every optional capability has completed its rollout.

## What is stable

The compatibility contract is intentionally narrower than the repository layout:

| Surface | Compatibility expectation |
|---|---|
| Public entry points | The orchestrator and the eight documented `/sdd-pipeline:*` commands retain their stated purpose or receive a documented migration path. |
| Project artifacts | Versioned config and contract markers, canonical spec-tree conventions, traceability IDs, and stable Quality Contract machine codes remain readable according to their declared lifecycle. |
| Installer and marketplace | A released version installs as a complete, internally consistent skill set; updates do not silently erase a project's `docs/sdd/` history. |
| Enforcement | A released checker rule either preserves compatible behavior or documents the migration and severity change. |

Internal skill paths, prose organization, test fixtures, and implementation details may change in a minor release when the public contract above remains intact.

## Versioning rules

| Change | Version | Example |
|---|---|---|
| Compatible correction: broken install, inaccurate document, checker false positive | Patch (`6.11.1`) | Fix a copied-path rewrite without changing the installer interface. |
| Compatible capability or opt-in rule | Minor (`6.12.0`) | Add a new command, optional policy, or supported harness. |
| Contract-breaking migration | Major (`7.0.0`) | Rename/remove a public command, require a new project-artifact layout, or make a prior opt-in enforcement default in a non-compatible way. |

Major versions are reserved for real migration boundaries. SDD Pipeline does not reset its version number because a project is privately operated or has a small user base; a lower version can be interpreted by plugin tooling as a downgrade and obscures the compatibility history users need to upgrade safely.

## Release checklist

Before publishing a release:

1. Update the plugin and marketplace versions together.
2. Record user-visible behavior and migration notes in `CHANGELOG.md`.
3. Update affected README, architecture, installation, and command documentation in the same change; do not leave a new rule discoverable in only one place.
4. Run structural validation, checker tests, installer tests, and any feature-specific test harness. Treat an unrun check as absent evidence.
5. Verify a fresh marketplace or manual installation and confirm the intended command surface and version.
6. For a breaking change, publish a migration path before or with the release; never rely on readers inferring it from source diffs.

## Deprecation and rollout

Deprecated artifacts or inputs remain readable only for their declared compatibility window. They cannot silently become the authority for new work. Features with an explicit rollout policy—such as Quality Contract v1—state their promotion criteria in their own document; their opt-in status does not weaken the stable contract of the rest of the pipeline.

## Operational update path

Read the change notes before updating. Manual installations use the installed pipeline's update flow or the installer with `--update`; marketplace installations refresh and reinstall through their host. The [installation guide](INSTALL.md) contains exact commands and verification steps for each path.
