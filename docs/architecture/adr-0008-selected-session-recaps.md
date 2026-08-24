# ADR 0008: Selected Quick Match Session Recaps

Status: accepted

## Context

ADR 0005 deferred a selectable multi-match share board until individual result
sharing had been used in production. Real court use now requires an end-of-night
summary across independent Quick Matches, including rotating Doubles partners
and short Singles games.

## Decision

1. A Session Recap is calculated on demand from explicitly selected
   QuickMatchRecord values.
2. Selection, aggregates, pages, and generated files are ephemeral and do not
   change versioned history storage.
3. Singles and Doubles are separate outputs. Point differential is displayed
   only for same-target matches completed normally at the target.
4. Player identity across Quick Matches is the trimmed, case-insensitive name;
   the most recent spelling is displayed.
5. Recap PNGs are generated locally and shared only by explicit user action.

## Alternatives Rejected

- **Persist a session entity:** adds lifecycle, migration, and recovery work
  before users have asked the app to organize play.
- **Infer a session from dates:** fails for midnight crossings and multiple
  groups sharing one device.
- **Combine Singles and Doubles standings:** compares unlike formats and partner
  effects.
- **Use AI or screenshot ingestion:** sends or reparses data already available
  in structured local records.

## Consequences

- Users can revise a recap by changing the selected ledger rows.
- Reloading clears the selection but not its source matches.
- Same-name players may merge until a demonstrated need justifies persistent
  player identity.
- No rollback migration is necessary.

## Review Trigger

Revisit persistence only when repeated field use requires Start/End Session,
automatic matchup scheduling, or disambiguation of same-name players.
