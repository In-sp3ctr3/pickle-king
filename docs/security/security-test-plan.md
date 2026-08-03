# Security Test Plan

## Persistence

- Reject malformed, unknown-version, and structurally invalid history records.
- Preserve the active snapshot when resetting corrupt history, and vice versa.
- Prove record IDs prevent duplicate confirmation writes.
- Prove retention bounds prune the oldest records.

## Input and rendering

- Validate empty, duplicate, overlong, and markup-like player names.
- Render every player-controlled value through React text nodes or Canvas text,
  never HTML injection paths.
- Keep share generation behind a direct user action.

## Supply chain and repository

- Run the locked dependency audit at high severity.
- Run lint, strict typecheck, tests, production build, and PWA smoke checks.
- Run CodeQL, dependency review, and secret scanning in GitHub where available.
- Verify generated output, dependencies, credentials, and agent metadata are not
  tracked.
