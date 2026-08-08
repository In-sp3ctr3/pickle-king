# Implementation Plan

## Architecture

- Add a persisted tournament format and keep the existing bracket model as the
  shared tournament record to avoid a broad rename.
- Put creation, standings, and resolution rules in a new pure tournament
  module. Dispatch generic creation/reset/lifecycle behavior by format.
- Add standing-derived match sources for the two placement matches.
- Upgrade active-session and history documents to version 2 with explicit V1
  knockout migrations.

## Development mode

- Use TDD for generation, standings, lifecycle, timing, correction, results,
  replay, and persistence.
- Use browser acceptance tests for setup, the eight-match workflow, responsive
  behavior, accessibility, history, and sharing.
- Use reference-derived frontend mode with the existing setup, bracket,
  match-card, results, and share surfaces as the visual contract.

## Delivery phases

1. Domain types, generator, standings, lifecycle, timing, and results.
2. Snapshot/history V2 migration and reducer integration.
3. Setup choice and dedicated round-robin tournament surface.
4. Results, history, replay, and completed-share adaptation.
5. Browser, contract, responsive, and repository verification.

## Risks

- A preliminary correction can invalidate both placement matches; the UI must
  confirm and clear them rather than preserving scores under new players.
- Existing bracket-only functions must be narrowed or format-dispatched so the
  knockout path does not accept standing sources.
- V1 migration must update both active snapshots and archived history without
  silently deleting corrupt source data.
