# ADR 0005: Local History and Live Draw Editing

Status: accepted

## Context

Production use exposed three related needs: correct a participant identity,
recover from an omitted entrant, and retain/share completed sessions. Preserving
results while inserting an entrant into an arbitrary partially completed
single-elimination draw would change paths, seed regions, automatic advances,
and rest opportunities without a unique fair answer.

## Decision

1. Player IDs are the identity boundary. A name correction changes the `name`
   attached to an ID and therefore propagates without changing results.
2. Add, remove, or rating changes rebuild the whole seeded draw. If play has
   started, the operator must confirm that every score/result will be cleared.
   The session deadline is preserved so the rebuilt schedule reflects remaining
   booked time.
3. Quick Match history is capped at 50 and completed tournament archives at 10.
   Both live in a separately validated, versioned localStorage document.
4. Remembered names are derived from archives instead of maintaining a second
   roster store.
5. Share images are generated locally with Canvas and explicitly shared or
   downloaded. No screenshot detection, upload, SQLite, IndexedDB, or backend is
   introduced.

## Alternatives Rejected

- **Splice a late entrant into the next open node:** grants an arbitrary bye or
  changes only one region and cannot claim seeded fairness.
- **Preserve unaffected completed matches during reseed:** player paths can move
  regions, making “unaffected” dependent on a non-neutral algorithm.
- **SQLite/IndexedDB immediately:** unnecessary operational surface for fewer
  than 60 bounded records and no querying requirement.
- **Infinite history:** creates storage/privacy ambiguity without improving the
  weekly-session job.
- **Selectable multi-match share board now:** useful later, but adds a second
  composition/editor flow before individual sharing is validated.

## Consequences

- Structural recovery after play begins is deliberately destructive but honest.
- Name corrections are cheap and safe at any non-live point.
- History survives active-session reset and remains offline.
- Users may explicitly clear history for privacy or recover from invalid data.
- Native sharing differs by browser; download is the guaranteed fallback.

## Verification

- Unit tests cover rename identity, rebuild resets, history idempotency/bounds,
  schema rejection, and name derivation.
- Browser tests cover cancellation/confirmation, remembered-name keyboard use,
  native-share stubbing, download fallback, and responsive share surfaces.
