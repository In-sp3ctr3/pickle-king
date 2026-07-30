# Implementation Plan

## Architecture

A single App Router route mounts a client application whose screen state is
encoded only in the URL hash. Feature modules depend inward on a pure tournament
domain. Browser APIs are isolated in persistence, timer, wake-lock, sound, and
service-worker adapters.

## Feature boundaries

```text
app/                         thin route shell and metadata
src/features/home/           entry and resume
src/features/setup/          tournament input and validation
src/features/bracket/        bracket and one-court run of show
src/features/live-match/     scorekeeper, clocks, confirmation
src/features/quick-match/    standalone singles/doubles
src/features/results/        podium, standings, history
src/tournament/              pure domain types and functions
src/persistence/             versioned snapshot boundary
src/shared/                  curated primitives and browser adapters
```

## Decisions

- Use standard seeded bracket placement; ratings are never recalculated.
- Use a reducer for application state and pure match transitions.
- Store the current snapshot only in localStorage.
- Use Zod at the persistence boundary; internal domain functions remain typed.
- Use Motion and Number Flow only for bracket/score transformations.
- Build an original DOM/CSS bracket; the referenced Pro component is not copied.
- Generate raster brand/social assets and document provenance.

## Phases

1. Foundation: contracts, starter audit, CI, public repository baseline.
2. Tournament engine: types, seeding, byes, schedule, caps, results.
3. Live product: reducer, scorer, clocks, persistence, Quick Match.
4. PWA polish: assets, motion, offline build, accessibility, browser evidence.
5. Release: GitHub protections, merged-main verification, Sites deployment.
