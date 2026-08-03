# ADR 0006: Procedurally fair late entry

Status: accepted
Date: 2026-08-03

## Context

The destructive live-field rebuild in ADR 0005 is honest but too restrictive
for four-to-seven-player social sessions. Exact pre-tournament fairness cannot be
restored after results are known, but completed matches can remain valid if a
newcomer earns the missed bracket depth and the affected route is objective.

## Decision

Add one optional Late Entry Challenge before placement play starts:

1. Fill a reversible bye when one remains.
2. Otherwise add a preliminary to an untouched opening-round position.
3. Otherwise reopen one deterministic active branch and require the entrant to
   face its eliminated lineage before its protected holder.

Choose the route by fewest matches played, then the stored random seed. Preserve
completed scores, add explicit challenge matches, and record original sources for
undo until challenge play starts. When a finalist route is reopened, the final
challenge winner takes the final position and its loser takes that route's bronze
position. Lock insertion once bronze or the final starts.

## Consequences

- The result is procedurally fair for a casual amended tournament, not identical
  to a draw that included the entrant from the start.
- The entrant is unseeded, never receives a free advance, and may play consecutive
  challenge matches as the cost of arriving late.
- Eliminated players return only from the reopened branch and may decline.
- The bracket can contain one additional dependency chain while the original tree
  and completed match history remain readable.
- Timed sessions may receive shorter remaining caps or explicitly become untimed.
- A second late entrant, a live match, or started placement play requires Quick
  Match, a full rebuild, a later tournament, or continuing unchanged.

## Alternatives rejected

- **Arbitrary open-slot insertion:** gives organizer-controlled advantage.
- **Rock-paper-scissors selection by default:** social but not reproducible.
- **Full repechage:** too many one-court matches for the target group size.
- **Reset-only policy:** unnecessarily destroys legitimate completed results.
- **Insertion after bronze starts:** can invalidate an already-played podium match.

## Verification

Pure tests cover selection and graph invariants; reducer/storage tests cover
recovery; browser tests cover all user decisions and iPad interaction.
