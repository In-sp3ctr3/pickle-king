# ADR 0004: Small-field round robin and future pool play

Status: accepted
Date: 2026-07-31
Amended: 2026-08-08

## Context

The group commonly has six players. A fast single-elimination bracket finishes
inside a two-hour, one-court booking, but some entrants play only once. The
requested alternative is a group stage that decides the knockout draw.

A six-player full round robin requires 15 matches. Adding two semifinals, a
third-place match, and a final raises the session to 19 matches. After a
10-minute warmup and eighteen 60-second changeovers, a 120-minute booking would
leave about 4.8 minutes per match.

Two pools of three require six pool matches. Crossed semifinals, third place,
and the final raise the session to 10 matches. The same booking assumptions
leave about 10.1 minutes per match.

This is not an invented format. USA Pickleball lists round robin and pool play
among its approved tournament formats. Its 2026 Golden Ticket event uses round
robin followed by playoffs for fields of four through seven and pools for
larger fields. A published Golden Ticket player brief seeds the top four after
round robin, then plays 1 vs 4 and 2 vs 3, with the winners contesting gold and
the losers contesting bronze.

Sources:

- [USA Pickleball approved formats](https://usapickleball.org/sanctioning/formats/)
- [USA Pickleball Golden Ticket Boise format](https://usapickleball.org/tournaments/usap-golden-ticket-boise/)
- [USA Pickleball Golden Ticket player instructions](https://usapickleball.org/docs/GT/Mesa/2025-Golden-Ticket-Player-Instruction-Letter-Mesa.pdf)

## Decision

Add `Pools + knockout` as an optional future format for fields above the
small-field threshold; retain Fast knockout as the default separate option.

### Rejected six-player pool alternative

The earlier six-player pool proposal would:

- create two seeded pools of three;
- play one round robin inside each pool;
- advance the top two from each pool;
- cross the semifinals as A1 vs B2 and B1 vs A2;
- run third place before the final;
- rank pool ties by wins, head-to-head for a two-player tie, point
  differential, points scored, then the stored deterministic seed.

That format would need to say every entrant receives at least two pool matches,
not that everyone plays everyone. It remains deferred; the accepted complete
round robin is available with a timing advisory rather than being replaced by
this pool structure.

For four through six players, offer a true round robin as the
participation-first format. Everyone meets once, preliminary ranks three and
four play bronze, and ranks one and two play the final. Fifth and sixth retain
their preliminary table positions. Four, five, and six players therefore
produce 8, 12, and 17 matches.

Timed schedules remain selectable when their calculated cap is short. A cap
below eight minutes receives a prominent advisory before confirmation, but the
organizer may continue. Untimed schedules show the match count and participation
range without a duration warning. Seven or more players require pool play or
Fast knockout; a complete round robin is not offered.

## Consequences

- Six-player pool play remains the smaller future alternative at 10 matches.
- A two-hour booking should recommend play-to-7 or a 9–10 minute cap.
- The persistence schema, tournament lifecycle, standings UI, correction
  behavior, schedule calculation, migrations, and tests all need an explicit
  domain change.
- The implemented small-field format reuses the existing tournament lifecycle;
  pool play remains deferred and must not appear as a partial setup option.

## Implemented small-field verification

- Four, five, and six players create 8, 12, and 17 matches.
- Every preliminary pairing appears once and every player appears `n - 1`
  times.
- Five-player rounds rotate one real rest without persisting a fake match.
- Placement correction, replay, reload, archived results, sharing, and frozen
  fifth/sixth-place order remain deterministic.
- Timed caps below eight minutes advise without blocking; untimed schedules
  never render the advisory.

## Future pool-play verification

- Every pool pairing appears exactly once.
- Each six-player entrant plays two pool matches.
- Pool standings and tie breakers are deterministic.
- Only qualified players enter the crossed semifinals.
- The calculated cap preserves the booking deadline or rejects the schedule.
- Result corrections recalculate standings and reset affected knockout results.
