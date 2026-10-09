# Security Audit

Date: 2026-08-10

## Status

This is the historical audit of the offline-only application as it existed on
2026-08-10. Its guest/offline scope remains relevant, but every result below is
evidence about that dated tree, not a current attestation. It did not test Clerk,
Convex, accounts, server authorization, webhooks, scheduled jobs, hosted personal
data, result co-signing, ratings, or DUPR because those controls were not
implemented.

The approved hosted architecture is covered by the re-issued threat model and
security requirements. This audit does not attest that those future controls
exist or pass; each implementation ticket must supply current executable
security evidence.

## Current-tree note

During the SPE-93 documentation run on 2026-10-09,
`npm audit --audit-level=high` reported 28 vulnerabilities in the unchanged
dependency baseline: 7 moderate, 19 high, and 2 critical. This does not alter
the historical result below and no dependency remediation is claimed by this
ticket. The open dependency work and a current risk disposition remain separate
release evidence.

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
- Feed, Story, stats, recap, and bracket PNGs were composed from local assets.
  At the audit date, the only player-data transmission boundary in scope was
  the user-invoked Web Share API.
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
- The approved hosted platform introduces additional trust boundaries and
  residual risks that this dated audit did not test. See `threat-model.md` and
  `security-test-plan.md`; planned tests are not historical audit results.
