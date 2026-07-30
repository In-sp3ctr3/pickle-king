# ADR 0003: Seeded bracket and deadline timers

Status: accepted  
Date: 2026-07-30

## Decision

Use standard power-of-two seeded bracket positions, assign byes to high seeds,
and deterministically shuffle only equal ratings. Complete rounds before the
next round, schedule the bronze match before the final, and order other ready
matches by longest rest.

Persist match deadlines and paused milliseconds. Never persist interval tick
counts. The target score ends a match immediately; at the deadline the leader
wins and a tie enters golden point.

## Consequences

Seeds are separated fairly, reload/sleep does not freeze time, and the schedule
is predictable on one court. Ratings remain an input rather than a claim about
post-tournament skill.
