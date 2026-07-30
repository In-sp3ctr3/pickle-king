# Pickle King Constitution

## Core Principles

### I. Local-first privacy

Player names, scores, brackets, and session history stay on the device. The app
has no account, analytics, database, or application API. A feature that transmits
tournament data requires a new threat model and an explicit product decision.

### II. Deterministic, test-first domain logic

Tournament creation, byes, seeding, scheduling, scoring, advancement, timers,
results, and migrations are pure or isolated behind narrow adapters. Non-trivial
behavior starts with a failing test and is refactored only after it passes.

### III. Simple, cohesive modules

Use a feature-first single-app structure and the fewest necessary concepts.
Hand-authored TypeScript and TSX files may not exceed 300 logical lines. Generic
manager/service layers, speculative abstractions, and unused starter code are
prohibited.

### IV. Offline and interruption resilience

Every active session must survive refresh, sleep, and loss of connectivity.
Timers use wall-clock deadlines and paused remaining values. Corrupt persistence
must produce a recoverable screen; it must never be silently discarded.

### V. Accessible, evidence-backed delivery

Primary controls are at least 48px, keyboard accessible, visibly focused, and
semantically announced. Status is never color-only. Each phase closes with
lint, typecheck, tests, build, security checks, and the evidence named in the
verification record.

## Product Constraints

- Singles tournament: 4–16 players, one court, third-place match.
- Ratings are seeding inputs only and never recomputed as official ratings.
- Quick Match supports one or two players per side.
- Scoring is manual, first to target, no win-by-two; tied buzzer enters golden point.
- Runtime dependencies and assets need documented purpose and provenance.
- Vinext compatibility and `vinext check` are blocking foundation gates.

## Development Workflow

Work proceeds through the Spec Kit artifacts in `specs/001-offline-tournament-pwa`.
Every pull request maps to tasks and acceptance criteria. `main` remains
deployable; squash merge is the only merge strategy. Security-sensitive and
persistence changes receive an adversarial review before release.

## Governance

This constitution governs project-local implementation. Amendments require a
documented reason, migration impact, and a version change. Pull requests must
state verification evidence and any accepted risk.

**Version**: 1.0.0 | **Ratified**: 2026-07-30 | **Last Amended**: 2026-07-30
