# CLI Constraints

Apply when the project is a command-line tool.

## Rules

### C1. Exit Codes
- **RULE**: Exit 0 on success, non-zero on failure. Use distinct codes for different failure types.
- **RATIONALE**: Scripts and CI depend on exit codes.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### C2. Help Flag
- **RULE**: Support `--help` / `-h` with clear usage description, options, and examples.
- **RATIONALE**: Discoverability. Users shouldn't need to read source code.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### C3. Stderr for Errors
- **RULE**: Error messages go to stderr. Data output goes to stdout.
- **RATIONALE**: Enables piping: `cli-tool | other-command` without error noise in output.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### C4. Respect NO_COLOR
- **RULE**: If `NO_COLOR` env var is set, disable colored output. If stdout is not a TTY, disable colors.
- **RATIONALE**: Accessibility and CI compatibility.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### C5. Signal Handling
- **RULE**: Handle SIGINT (Ctrl+C) gracefully. Clean up temp files, close connections.
- **RATIONALE**: Abrupt termination shouldn't leave artifacts.
- **OVERRIDE**: Short-lived scripts that don't create temp state.
- **CHECK**: judgment

### C6. Configuration Hierarchy
- **RULE**: CLI args > env vars > config file > defaults.
- **RATIONALE**: Standard convention users expect.
- **OVERRIDE**: None.
- **CHECK**: mechanical

### C7. Idempotent Operations
- **RULE**: Running the same command twice should produce the same result (or be safely skipped).
- **RATIONALE**: Users retry commands. Scripts run commands multiple times.
- **OVERRIDE**: Commands that are inherently non-idempotent (send email, create unique resource).
- **CHECK**: judgment

### C8. Progress for Long Operations
- **RULE**: Operations taking > 2 seconds should show progress (spinner, progress bar, or status messages).
- **RATIONALE**: Silent tools feel broken.
- **OVERRIDE**: Piped output (non-TTY) should suppress progress.
- **CHECK**: judgment
