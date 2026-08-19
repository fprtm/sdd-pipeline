# Library Constraints

Apply when the project is a published library or package.

## Rules

### LIB1. Minimal API Surface
- **RULE**: Export only what consumers need. Keep internal implementation private.
- **RATIONALE**: Every export is a public contract you must maintain.
- **OVERRIDE**: None.
- **CHECK**: judgment

### LIB2. Backwards Compatibility
- **RULE**: Breaking changes require major version bump. Deprecate before removing.
- **RATIONALE**: Consumers depend on your API. Breaking them breaks trust.
- **OVERRIDE**: Pre-1.0 libraries (semver allows breaking changes in minor versions).
- **CHECK**: judgment

### LIB3. Minimal Dependencies
- **RULE**: Fewer dependencies = smaller install, fewer vulnerabilities, fewer conflicts.
- **RATIONALE**: Your dependencies become your consumers' dependencies.
- **OVERRIDE**: None. Inline small utilities instead of importing packages.
- **CHECK**: mechanical

### LIB4. Tree-Shaking Support
- **RULE**: Support ESM exports. Avoid side effects in module scope.
- **RATIONALE**: Consumers should only pay for what they use.
- **OVERRIDE**: Library requires global setup (polyfills, registration).
- **CHECK**: mechanical

### LIB5. Public API Documentation
- **RULE**: Every exported function/class/type has a JSDoc/docstring describing purpose, params, return value.
- **RATIONALE**: Libraries without docs don't get adopted.
- **OVERRIDE**: None for public API.
- **CHECK**: mechanical

### LIB6. Semantic Versioning
- **RULE**: Follow semver strictly. Patch = bug fix, minor = new feature, major = breaking change.
- **RATIONALE**: Consumers rely on semver for safe upgrades.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### LIB7. No Side Effects
- **RULE**: Importing the library should not modify global state, access filesystem, or make network requests.
- **RATIONALE**: Surprising side effects break consumer trust and testing.
- **OVERRIDE**: Library's purpose is a side effect (logger, polyfill, instrumentation).
- **CHECK**: judgment
