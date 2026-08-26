# ADR 0001: Separate result confirmation from sharing

Status: accepted

## Context

The existing result dialog combines score correction, persistence, format
selection, design selection, image generation, native sharing, and navigation.
That makes the primary irreversible decision unclear and forces image work
before the result is saved.

## Decision

Confirm and persist the result first. After the existing reducer transition, a
transient Result saved celebration may open the Share Composer. The composer is
not a route and none of its state is persisted. Tournament sharing keeps three
artifact types—Champion, Standings, and Full draw—while Quick Match keeps three
visual designs.

## Consequences

- Score correction and persistence remain a short, unambiguous workflow.
- Sharing cancellation can never cancel or duplicate the result write.
- Quick and tournament sharing reuse one interaction shell without conflating
  artifact kinds with visual themes.
- Reloading clears the celebration and composer, while the recorded result
  remains in the existing history or tournament snapshot.

## Review Trigger

Revisit only if share drafts become persistent, the product adds a destination
integration, or users need to resume an interrupted composer after reload.
