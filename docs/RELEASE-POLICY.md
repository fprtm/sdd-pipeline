# Release Policy

SDD Pipeline starts its current release line at `0.1.0`. It follows Semantic
Versioning, with the pre-1.0 contract made explicit: command behavior, artifact
formats, and policies may change before `1.0.0`; migration notes still accompany
changes that affect existing project data.

## Versioning rules

| Change | Version | Example |
|---|---|---|
| Compatible correction | Patch (`0.1.1`) | Fix an installer path without changing command behavior. |
| Capability addition or pre-1.0 contract change | Minor (`0.2.0`) | Add a command or revise an artifact format with migration notes. |
| Stable compatibility contract | `1.0.0` | Declare the supported public commands, artifact formats, and update guarantees. |

Before `1.0.0`, minor releases may include incompatible changes. The release
notes must state affected commands or artifacts and give a migration path when
user project data is involved. A version number does not measure adoption or
the amount of implementation.

## Release checklist

Before publishing a release:

1. Keep plugin, marketplace, installer, and project-router versions identical.
2. Record user-visible behavior and migration notes in `CHANGELOG.md`.
3. Update affected README, architecture, installation, and command documentation
   in the same change.
4. Run structural validation, checker tests, installer tests, and relevant
   feature checks; report unrun checks as absent evidence.
5. Verify a fresh marketplace or manual installation and the intended command
   surface and version.
6. For changes to user project data, provide migration guidance before release.

## Operational update path

Read the change notes before updating. Manual installations use the installed
pipeline's update flow or the installer with `--update`; marketplace
installations refresh and reinstall through their host. The
[installation guide](INSTALL.md) contains commands for each path.
