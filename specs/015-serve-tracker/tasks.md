# Tasks: Serve tracker

**Input**: Design documents in `specs/015-serve-tracker/`

## Phase 1: Contract and harness

- [x] T001 Update the V2 frontend contract and gate receipts in `docs/frontend/` and `package.json`.
- [x] T002 Record this feature's gate matrix and implementation evidence in `specs/015-serve-tracker/`.

## Phase 2: Domain foundation

- [x] T003 Write failing service-sequence tests in `src/match/service.test.ts`.
- [x] T004 Add serializable service and rally types in `src/match/types.ts`.
- [x] T005 Implement pure legal-position and side-out transitions in `src/match/service.ts`.
- [x] T006 Integrate rally winner, undo, setup, and repair actions into `src/match/scoring.ts` and `src/match/scoring.test.ts`.
- [x] T007 Add persistence schema and legacy-session recovery coverage in `src/persistence/tournament-schema.ts` and `src/persistence/storage.test.ts`.

## Phase 3: User Story 1 - Record a rally (P1)

**Goal**: Record standard side-out rally outcomes in one large team tap.

- [x] T008 [US1] Update score target labels and actions in `src/features/live-match/score-side.tsx`.
- [x] T009 [US1] Wire rally actions through `src/features/live-match/match-screen.tsx`.
- [x] T010 [US1] Add live-score behavior coverage in `src/match/scoring-rally.test.ts` and `tests/playwright/serve-tracker.spec.ts`.

## Phase 4: User Story 2 - Serve guide (P1)

**Goal**: Show the legal next server and service box without reducing scoring clarity.

- [x] T011 [US2] Add the accessible compact guide in `src/features/live-match/serve-guide.tsx`.
- [x] T012 [US2] Add responsive service-guide styling in `app/styles/match.css`.
- [x] T013 [US2] Add guide rendering tests in `src/features/live-match/serve-guide.test.tsx`.

## Phase 5: User Story 3 - Setup and recovery (P2)

**Goal**: Establish or repair service state without modifying scores.

- [x] T014 [US3] Add serve setup and Fix serve dialogs in `src/features/live-match/serve-setup-dialog.tsx` and `src/features/live-match/serve-fix-dialog.tsx`.
- [x] T015 [US3] Integrate setup, undo, recovery status, focus, and reduced-motion feedback in `src/features/live-match/match-screen.tsx`.
- [x] T016 [US3] Add dialog and recovery coverage in `tests/playwright/serve-tracker.spec.ts` and `docs/frontend/route-map.json`.

## Phase 6: Browser coverage and release

- [x] T017 Update scorer preparation and rally workflow expectations in `tests/playwright/frontend-harness-support.ts` and `tests/playwright/product-workflows.spec.ts`.
- [x] T018 Update the quick-live control map and source/render evidence paths in `docs/frontend/route-map.json` and `docs/frontend/design-qa.md`.
- [x] T019 Capture same-viewport desktop/mobile scorer evidence and run visual comparison.
- [x] T020 Run adversarial domain/UI review, frontend QA/release, `npm run check`, and `npm run format:check`; record results in `specs/015-serve-tracker/verification.md`.
- [x] T021 Persist court orientation, mirror service boxes across both ends, and add the one-tap Swap sides control with reducer, persistence, and browser coverage.
- [x] T022 Derive and display the doubles receiver with a white court marker and focused domain, component, and browser coverage.

## Dependencies

`T003` → `T004` → `T005` → `T006` → `T007` blocks all user stories.
`T008` and `T011` can proceed after T006; the screen integration tasks follow.
`T014` depends on T006 and named-player availability. Browser and release work
depends on all user-story tasks.

## MVP

The minimum usable slice is T003–T013: correct side-out transitions plus a
read-only service guide. Setup/recovery follows immediately because doubles
positions cannot be guessed safely.
