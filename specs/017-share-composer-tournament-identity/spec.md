# Premium Share Composer and Tournament Identity

Status: approved for implementation

## Problem

Sharing is split across three dialog implementations, portrait exports default
to Post, Quick Match design choices are text-only, and result confirmation asks
the operator to save and share at the same time. Tournament exports expose the
right facts but do not consistently use the approved Quick Match and Receipts
identity.

## Product Decisions

- Confirming a result persists it before sharing. A transient Result saved
  celebration then offers Share result and the context-appropriate continue
  action.
- Quick Match, Session Recap, Champion, and Standings default to Story (9:16).
  Full draw defaults to Full draw (4:3).
- Quick Match keeps Poster, Frame, and Receipt. Tournament sharing keeps one
  Champion design plus Standings and Full draw; tournament artifacts are not
  theme variants.
- The composer shows a large exact preview, explicit aspect ratios, visual
  choices, and sticky Share/Save actions. Swipe is optional and never the only
  way to select a design.
- All generation remains local, deterministic, and ephemeral. No share
  preference, composer state, or saved-result screen is persisted.

## Functional Requirements

1. Result review contains only the result, exceptional finish context, Edit
   score, and Confirm result.
2. Confirmation records the result exactly once before the Result saved
   celebration appears.
3. Share result opens the composer without changing the saved result. Dismiss
   proceeds to Quick setup, the bracket, or tournament results.
4. Every portrait composer opens on Story and labels formats Story (9:16) and
   Post (4:5). Full bracket also offers and initially selects Full draw (4:3).
5. Quick design choices render actual result thumbnails, remain accessible as
   labeled radio choices, and preserve the selected design while the aspect
   ratio changes.
6. Session Recap retains Singles/Doubles, twelve-row pagination, page state,
   multi-file sharing, and per-page fallback.
7. Tournament sharing retains Champion, Standings, and Full draw. Round robin
   continues to omit Full draw.
8. Champion uses one dark poster composition. Standings uses the Receipts table
   language. Full draw uses cream nodes, black ink, lime winner paths, and the
   canonical lockup without obscuring bracket data.
9. Archived tournaments automatically use the new renderers without migration.
10. Native Share cancellation, unsupported sharing, encoding failures, Save
    fallback, offline generation, focus restoration, and privacy behavior remain
    intact.

## Acceptance Scenarios

- A Quick Match confirm writes one history record, shows Result saved, and can
  open Poster Story without requiring another confirmation.
- A tournament match confirm returns to its existing destination and still
  offers individual result sharing from the transient celebration.
- Every new Quick/history/recap/champion/standings composer opens on Story.
- Selecting Frame, switching to Post, and returning to Story keeps Frame
  selected and never flashes a stale Poster preview.
- Thumbnail alternatives are generated after the selected preview and remain
  usable by keyboard without horizontal gestures.
- A completed knockout tournament shares Champion and Standings in Post and
  Story plus Full draw in 4:3, Post, and Story.
- A completed round robin shares Champion and Standings only.
- Four, eight, and sixteen-player tournament exports retain all names, results,
  podium facts, paths, and canonical lockups without overlap.

## Non-goals

- Direct Instagram integration, accounts, remote storage, a template
  marketplace, custom colors, persisted share preferences, additional Champion
  styles, new routes, schema changes, or deployment.
