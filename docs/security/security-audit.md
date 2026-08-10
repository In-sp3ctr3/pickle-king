# Security Audit

Date: 2026-08-10

## Scope

Session-history persistence, bracket editing, remembered player names,
on-device share-image generation, archived-result viewing, and the public
repository boundary, including the reachable commit history.

## Results

- `npm audit --audit-level=high`: zero known vulnerabilities.
- Strict typecheck, lint, unit tests, production build, PWA tests, and browser
  workflows passed.
- No network request was added for player data or generated share images.
- Repository tracking audit found no dependency directories, build output,
  environment files, credentials, or tool metadata.
- Reachable-history and current-tree checks found no common credential or
  private-key signatures.
- History is schema-validated, separately recoverable, and bounded.
- Share cancellation is non-fatal; unsupported file sharing falls back to a
  local download.
- Feed, Story, stats, recap, and bracket PNGs are composed from local assets.
  The only transmission boundary remains the user-invoked Web Share API.
- Archived results are selected by an ID already present in the validated,
  bounded history store. A missing or deleted ID returns to history.
- `npm audit --audit-level=high` reported zero vulnerabilities on 2026-08-10.

Gitleaks, Semgrep, OSV-Scanner, and Trivy were not installed in the local
environment. GitHub secret scanning, CodeQL, dependency review, and the locked
dependency audit remain the release controls for those lanes.

## Residual risks

- Anyone with access to an unlocked shared device can read locally stored
  results until site data is cleared.
- A user can intentionally share a card containing player names. The app makes
  no automatic upload and requires an explicit Share action.
