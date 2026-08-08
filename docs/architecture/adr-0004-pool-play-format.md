# ADR 0004: Optional pool play before the knockout draw

Status: accepted
Date: 2026-07-31

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

Add `Pools + knockout` as an optional future tournament format for 4–8 players;
retain fast knockout as a separate option.

For six players:

- create two seeded pools of three;
- play one round robin inside each pool;
- advance the top two from each pool;
- cross the semifinals as A1 vs B2 and B1 vs A2;
- run third place before the final;
- rank pool ties by wins, head-to-head for a two-player tie, point
  differential, points scored, then the stored deterministic seed.

The product must say that every entrant receives at least two pool matches. It
must not say everyone plays everyone. A complete round robin remains unsuitable
for a normal two-hour, one-court session.

For exactly four players, offer a true round robin as the
participation-first format: six preliminary matches, followed by a third-place
match between third and fourth and a final between first and second for eight
matches total. Every entrant plays four matches. Do not add semifinals that
advance all four players; that would turn the six preliminary matches into
little more than seeding and raise the session to ten matches.

For a session without a deadline, a separate `Everyone plays everyone` choice
may use a complete round robin. It must show the calculated match count before
confirmation: `n × (n - 1) / 2`, before any playoff. This choice is not the
default for a one-court booking.

## Consequences

- Six-player pool play has 10 matches rather than 6.
- A two-hour booking should recommend play-to-7 or a 9–10 minute cap.
- The persistence schema, tournament lifecycle, standings UI, correction
  behavior, schedule calculation, migrations, and tests all need an explicit
  domain change.
- This is not included in the current visual-repair slice; partially adding a
  setup toggle without the lifecycle is prohibited.

## Verification for implementation

- Every pool pairing appears exactly once.
- Each six-player entrant plays two pool matches.
- Pool standings and tie breakers are deterministic.
- Only qualified players enter the crossed semifinals.
- The calculated cap preserves the booking deadline or rejects the schedule.
- Result corrections recalculate standings and reset affected knockout results.
