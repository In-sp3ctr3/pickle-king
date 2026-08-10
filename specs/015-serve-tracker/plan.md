# Implementation Plan: Serve tracker

**Branch**: `serve-tracker` | **Date**: 2026-08-09 | **Spec**: [spec.md](spec.md)

## Summary

Replace point-only live scoring with deterministic standard side-out rally
scoring. A pure match-domain service model owns the legal sequence; the live
screen collects one rally winner per tap and presents a compact legal-position
guide. Existing target, timer, and result flows remain intact.

## Technical Context

- **Language/Version**: TypeScript, Node.js 22.13+
- **Platform**: Offline Vinext PWA for phone and tablet
- **Dependencies**: Existing React, Motion, Lucide, Zod, Vitest, Playwright;
  no new dependencies
- **Storage**: Existing local persisted tournament snapshot and history schema
- **Testing**: Vitest domain/component tests; Playwright scorer workflow;
  existing check, format, and frontend gates
- **Performance goal**: Service derivation is synchronous and constant-size;
  the score screen stays viewport-bound at required breakpoints

## Constitution Check

| Principle                             | Plan response                                                           | Status |
| ------------------------------------- | ----------------------------------------------------------------------- | ------ |
| Local-first privacy                   | No network, account, analytics, or new data destination                 | pass   |
| Deterministic test-first domain logic | Pure service transitions and test-first reducer integration             | pass   |
| Simple cohesive modules               | One match-domain service module, thin feature UI modules                | pass   |
| Offline resilience                    | Persist service state; legacy active sessions require deliberate setup  | pass   |
| Accessible delivery                   | Semantic rally controls, live status, focus, reduced motion, browser QA | pass   |

## Architecture

```text
scorekeeper tap
  -> scoring reducer
    -> pure service transition
      -> scoring + service state + reversible rally record
        -> persisted app state
          -> live scorer guide and controls
```

- `src/match/service.ts` owns service transitions and derived legal positions.
- `src/match/scoring.ts` keeps match completion/timer behavior and composes the
  service transition for live rally actions.
- `src/match/types.ts` contains serializable service and rally types.
- `src/features/live-match/` renders the setup/recovery controls and guide;
  it does not decide serving rules.
- `src/persistence/` validates the added serializable state and migrates legacy
  snapshots to an unconfigured service state.

## Frontend Plan

- **Mode**: reference-derived product. The existing scoreboard and approved
  near-black, acid-lime court identity are the authority; the compact guide is
  a new subregion, not a new product visual direction.
- **Representation**: DOM/CSS mini-court and text labels. Motion remains a
  small state-feedback enhancement with a reduced-motion fallback.
- **New surface**: a short guide under the live top bar, a Start-time serve
  setup dialog, and secondary undo/fix-serve controls. The large score zones
  remain primary and use the words “won rally.”
- **Assets/capabilities**: `dom-css` is available and selected. Existing
  `motion` is available for feedback only. No generated, remote, 3D, or
  registry asset is needed.

## Persistence Plan

Add an optional service field compatible with prior snapshots. A legacy active
scorer remains readable but has no enabled rally targets until its service setup
is supplied. Completed records are unaffected. This avoids inventing historical
starting positions.

## Verification Plan

1. Write pure service-transition tests first for every scoring path.
2. Add reducer/persistence tests for service state and legacy recovery.
3. Add focused live-match rendering/interaction tests.
4. Extend Playwright scorer workflow and frontend route map.
5. Capture desktop and mobile reference-derived evidence; run direction,
   prototype (explicitly static), frontend QA/release, `npm run check`, and
   `npm run format:check`.

## Complexity Tracking

No constitutional violations or new dependencies. A small explicit service
state is necessary because scores alone cannot recover no-point faults.
