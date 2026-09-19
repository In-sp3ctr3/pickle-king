# ADR 0010: Co-signed results, scoring claims, and the live scorer

Status: proposed
Date: 2026-09-17

## Context

Once results attach to identities and ratings, who entered a score
matters. Official events already have both teams sign a scoresheet, and
comparable products use "winner enters, loser confirms". The existing
offline rally-by-rally scorer is a strength but must not become a second
trust path. Full rules, findings, and types live in `PLAN.md` D4, D7 and
section 7, and `docs/architecture/platform-rules.draft.ts`.

## Decision

- Manual final-score entry is the primary path. The live scorer is an
  input method that produces the same submission, plus a rally log and an
  optional live scoreboard. It is never a source of trust.
- One scoring claim per match, server-serialised, only on a ready match,
  eligible to staff or a participant of that match, expiring after 3h.
  Staff manual entry always takes the claim over, so a match can be
  delayed but never blocked. Stale submissions end in a visible
  `superseded` state.
- Every result, whoever recorded it, is co-signed: `recorded` → `signed`
  → `final`, or `disputed`. Signatures are typed (submit, tap,
  staff-override, conflicted). A participant never signs for opponents or
  resolves their own dispute; in personal-org lobbies the host may sign as
  `conflicted`, which caps rating weight and bars DUPR. Non-participant
  staff may override an unsigned side after 24h with an audit row.
- Corrections after `final` are staff-only, need a reason, return the
  match to `recorded` for re-signing, remain visible forever, and are
  refused while downstream matches have started.
- Nothing downstream (bracket advance, rating, DUPR) happens before
  `final`. Forfeits count for standings and contribute zero to rating.
- Storage: match document holds games, result, signatures; rally
  snapshots in chunked `rallyLogs`; a tiny `liveScores` document for
  spectators.

## Consequences

Slightly more taps per match than a bare scoreboard, in exchange for a
single trust path that survives a lost phone, a sulking loser, a staff
member who is also playing, and a fat-fingered score. A signature proves
a session, not a person; accepted and documented, with PIN re-auth as a
later option.
