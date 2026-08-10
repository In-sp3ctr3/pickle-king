# Implementation Plan

## Architecture

- Replace the fixed pairings with a pure circle-method schedule that appends a
  non-persisted bye slot for odd fields.
- Keep the existing bracket record, format enum, standing sources, lifecycle,
  scorer, results, and storage version. Broaden invariants rather than adding a
  second tournament model.
- Derive five-player rest labels in the feature UI from the roster and real
  matches in each round.

## Development mode

- Use TDD for pairings, counts, standings, lifecycle, timing, results ordering,
  replay, and schema validation.
- Use component tests for setup summaries, advisories, fallback, and resting
  labels; use ATDD through Playwright for complete five/six-player workflows.
- Use frontend-build Mode 2. The shipped four-player sources are the identity
  anchor; new states extend the same schedule composition without new assets.

## Delivery phases

1. Domain generation, timing, lifecycle, results, and regression tests.
2. Version-2 persistence validation and reload coverage.
3. Setup availability, dynamic summaries, and timed-only advisory.
4. Dynamic schedule rounds, rest labels, history numbering, results, and share.
5. Reference-derived route targets, browser workflows, responsive evidence,
   adversarial review, and release verification.

## Risks

- An odd-field bye must never become a scored or persisted match.
- Existing four-player schedules and saved V2 sessions must remain byte-shape
  compatible.
- Placement statistics must not reorder fifth/sixth away from frozen preliminary
  positions.
- Six-player pages are substantially taller and require explicit mobile and
  landscape-phone checks.
